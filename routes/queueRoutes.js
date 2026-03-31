const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { issueToken, advanceQueue, getUserJourney, getAdminTokens, skipToken, setPriorityToken } = require('../controllers/queueController');

router.post('/issue', protect, issueToken);
router.post('/advance', protect, advanceQueue); // Typically role constraint here but keeping simple
router.get('/journey', protect, getUserJourney);

router.get('/admin/tokens', protect, getAdminTokens);
router.post('/admin/skip', protect, skipToken);
router.post('/admin/priority', protect, setPriorityToken);

module.exports = router;
