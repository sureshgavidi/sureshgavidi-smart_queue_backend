const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hospital = require('./models/Hospital');

dotenv.config();

const clearHospitals = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    await Hospital.deleteMany({});
    console.log('Cleared existing hospitals. They will re-seed on next server start.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

clearHospitals();
