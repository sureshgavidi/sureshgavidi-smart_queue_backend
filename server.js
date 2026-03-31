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

app.use(cors());
app.use(express.json());

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
