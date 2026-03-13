const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const multer = require("multer");

/* ================= MULTER ================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ================= REGISTER ================= */
const sendOTPEmail = require("../utils/sendMail");

let otpStore = {}; // temporary memory

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = otp;

  await sendMail(email, "Your OTP Code", `<h2>Your OTP is: ${otp}</h2>`);

  res.json({ message: "OTP sent" });
});

router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] == otp) {
    delete otpStore[email];
    return res.json({ verified: true });
  }

  res.status(400).json({ message: "Invalid OTP" });
});
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, phone, password, role } = req.body;

  try {
    // Check if user exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length > 0) return res.status(400).json({ message: "User already exists" });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
     db.query(
      "INSERT INTO users (firstName, lastName, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, phone, hashedPassword, role],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });

        const token = jwt.sign(
          { id: result.insertId },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.status(201).json({
          message: "User registered successfully",
          token,
          user: {
            id: result.insertId,
            firstName,
            lastName,
            email,
            phone,
            role,
          },
        });
      }
    );
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= LOGIN ================= */

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json({ message: "DB Error" });

      if (result.length === 0) {
        return res.status(400).json({ message: "Invalid Email" });
      }

      const user = result[0];

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(400).json({ message: "Invalid Password" });
      }

      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          photo: user.photo,
        },
      });
    }
  );
});


/* ================= UPDATE PROFILE ================= */
router.put("/update-profile", upload.single("photo"), (req, res) => {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: true,
        message: "Authorization header missing. Please login again."
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: true,
        message: "Invalid token format. Token must start with Bearer."
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: true,
        message: "Token not found."
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

      if (err) {
        return res.status(401).json({
          error: true,
          message: "Token expired or invalid. Please login again."
        });
      }

      const userId = decoded.id;

      const { firstName, lastName, email, role ,phone } = req.body;

      // if (!firstName || !email) {
      //   return res.status(400).json({
      //     error: true,
      //     message: "First name and email are required."
      //   });
      // }

      let photo = req.file ? req.file.filename : null;

      let sql;
      let values;

      if (photo) {

        sql = `
        UPDATE users 
        SET firstName=?, lastName=?, email=?, phone=?, role=?, photo=? 
        WHERE id=?
        `;

        values = [firstName, lastName, email, phone, role, photo, userId];

      } else {

        sql = `
        UPDATE users 
        SET firstName=?, lastName=?, email=?, role=? 
        WHERE id=?
        `;

        values = [firstName, lastName, email, role, userId];

      }

      db.query(sql, values, (err) => {

        if (err) {

          return res.status(500).json({
            error: true,
            message: "Database update failed.",
            details: err.message
          });

        }

        db.query(
          "SELECT id,firstName,lastName,email,phone,role,photo FROM users WHERE id=?",
          [userId],
          (err, result) => {

            if (err) {
              return res.status(500).json({
                error: true,
                message: "Could not fetch updated user."
              });
            }

            res.json({
              error: false,
              message: "Profile updated successfully",
              user: result[0]
            });

          }
        );

      });

    });

  } catch (error) {

    res.status(500).json({
      error: true,
      message: "Server error",
      details: error.message
    });

  }

});
module.exports = router;