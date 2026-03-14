const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db"); // Make sure this points to your mysql2 connection

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/property");
// ... other routes

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/property", propertyRoutes);
// ... other routes

// Serve images
app.use("/uploads", express.static("uploads"));

// Test DB connectivity
app.get("/db-test", (req, res) => {
  db.query("SELECT 1", (err, result) => {
    if (err) return res.status(500).json({ message: "DB not reachable", error: err });
    res.json({ message: "DB OK", result });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));