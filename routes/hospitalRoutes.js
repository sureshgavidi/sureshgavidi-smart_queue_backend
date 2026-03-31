const express = require('express');
const router = express.Router();
const { getHospitals } = require('../controllers/hospitalController');

// All endpoints sit under /api/hospitals
router.get('/', getHospitals);

module.exports = router;
