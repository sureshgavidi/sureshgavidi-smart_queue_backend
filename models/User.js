const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firebaseUid: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for OAuth
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
  role: { type: String, enum: ["admin", "user"], default: "user" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
