const Token = require('../models/Token');
const QueueState = require('../models/QueueState');

// Issue a new Token (Identity-bound & strictly single)
exports.issueToken = async (req, res) => {
  try {
    const { hospital, department, patientName, phone, priority } = req.body;
    const userId = req.user.id;

    // 1. Check if user already has an active token
    const existingActive = await Token.findOne({
      user: userId,
      status: { $in: ['waiting', 'serving'] }
    });

    if (existingActive) {
      return res.status(400).json({ message: "You already have an active token in the system." });
    }

    // 2. Atomically increment the QueueState to get a deterministic token number
    const qState = await QueueState.findOneAndUpdate(
      { hospital, department },
      { $inc: { lastIssuedTokenNumber: 1, activeWaitersCount: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const tokenNumber = qState.lastIssuedTokenNumber;
    
    // Calculate Wait -> (People Ahead - it's technically activeWaitersCount after increment minus 1) * averageService
    const waitAhead = Math.max(0, qState.activeWaitersCount - 1);
    const estimatedWaitMins = Math.round((waitAhead * qState.averageServiceTimeMs) / 60000);

    const newToken = await Token.create({
      user: userId,
      hospital,
      department,
      tokenNumber,
      patientName,
      phone,
      priority: priority || false,
      status: 'waiting',
      estimatedWait: estimatedWaitMins,
      lifecycleEvents: [{ state: 'waiting' }]
    });

    res.status(201).json({ token: newToken, queueState: qState });
  } catch (err) {
    // Check for MongoDB unique compound index collision protecting integrity
    if (err.code === 11000) {
      return res.status(400).json({ message: "System prevented duplicate active token creation." });
    }
    res.status(500).json({ message: err.message });
  }
};

// Shift the Queue Forward
exports.advanceQueue = async (req, res) => {
  try {
    const { hospital, department } = req.body;

    // 1. Mark current serving token as completed
    const currentServing = await Token.findOne({ hospital, department, status: 'serving' }).sort({ tokenNumber: 1 });
    
    if (currentServing) {
      currentServing.status = 'completed';
      currentServing.lifecycleEvents.push({ state: 'completed' });
      await currentServing.save();
    }

    // 2. Locate the next person in line
    const nextToken = await Token.findOne({ hospital, department, status: 'waiting' }).sort({ priority: -1, tokenNumber: 1 });

    const stateUpdates = {};
    if (currentServing) stateUpdates.$inc = { activeWaitersCount: -1 };

    if (nextToken) {
      nextToken.status = 'serving';
      nextToken.lifecycleEvents.push({ state: 'serving', timestamp: new Date() });
      await nextToken.save();
      
      stateUpdates.$set = { currentServingTokenNumber: nextToken.tokenNumber };
    }

    const qState = await QueueState.findOneAndUpdate(
      { hospital, department },
      stateUpdates,
      { new: true }
    );

    return res.status(200).json({ 
      nextToken: nextToken || null, 
      message: nextToken ? "Next token serving." : "Queue empty.",
      queueState: qState 
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Retrieve timeline for an authenticated user
exports.getUserJourney = async (req, res) => {
  try {
    const activeToken = await Token.findOne({
      user: req.user.id,
      status: { $in: ['waiting', 'serving'] }
    });
    
    if (!activeToken) return res.status(404).json({ message: "No active token found." });
    
    const qState = await QueueState.findOne({ hospital: activeToken.hospital, department: activeToken.department });
    // Identify people accurately ahead
    const tokensAheadList = await Token.find({
      hospital: activeToken.hospital,
      department: activeToken.department,
      status: 'waiting',
      tokenNumber: { $lt: activeToken.tokenNumber }
    }).sort({ tokenNumber: 1 });

    const tokensAheadNum = tokensAheadList.length;

    res.status(200).json({ 
      token: activeToken, 
      queueState: qState,
      metrics: {
        tokensAhead: tokensAheadNum
      },
      tokensAheadList
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAdminTokens = async (req, res) => {
  try {
    const { hospital, department } = req.query;
    if (!hospital) return res.status(400).json({ message: "Hospital is required" });
    
    const query = { hospital };
    if (department && department !== '__all') {
      query.department = department;
    }
    
    const tokens = await Token.find(query).sort({ createdAt: -1 }).limit(100);
    res.status(200).json(tokens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.skipToken = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await Token.findById(tokenId);
    if (!token) return res.status(404).json({ message: "Token not found" });
    
    if (token.status === 'waiting') {
      token.status = 'skipped';
      token.lifecycleEvents.push({ state: 'skipped', timestamp: new Date() });
      await token.save();
      
      await QueueState.findOneAndUpdate(
        { hospital: token.hospital, department: token.department },
        { $inc: { activeWaitersCount: -1 } }
      );
    }
    
    res.status(200).json({ message: "Token skipped successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setPriorityToken = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await Token.findById(tokenId);
    if (!token) return res.status(404).json({ message: "Token not found" });
    
    token.priority = true;
    await token.save();
    res.status(200).json({ message: "Token priority updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
