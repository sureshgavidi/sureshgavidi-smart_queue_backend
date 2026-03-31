const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const admin = require("firebase-admin");
const connectDB = require("./config/db");

// Initialize Firebase Admin (local or cloud)
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require("./config/serviceAccountKey.json");
  }
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
  }
} catch (error) {
  console.warn("⚠️ Firebase Admin NOT initialized. Set FIREBASE_SERVICE_ACCOUNT or provide config/serviceAccountKey.json");
}

const { seedHospitalsIfEmpty } = require("./controllers/hospitalController");

dotenv.config();
connectDB().then(() => {
  seedHospitalsIfEmpty();
});

const app = express();

// CORS Configuration for Production
const allowedOrigins = [
  "http://localhost:5173",
  "https://smart-queue-d6d5e.web.app",
  "https://smart-queue-d6d5e.firebaseapp.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check for Render
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/queue", require("./routes/queueRoutes"));
app.use("/api/hospitals", require("./routes/hospitalRoutes"));

app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
