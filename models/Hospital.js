const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  departments: [{ type: String, required: true }],
  location: { type: String, required: true },
  address: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Hospital", hospitalSchema);