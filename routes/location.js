const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../db");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null,"uploads/"),
  filename: (req,file,cb)=> cb(null, Date.now()+"-"+file.originalname)
});
const upload = multer({ storage });

// Get Locations
router.get("/locations", (req, res) => {

  const sql = `
    SELECT id,title,image,available
    FROM locations
    WHERE status = 1
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(result);

  });

});

router.post("/add-location", upload.single("image"), (req, res) => {

  const { title, available } = req.body;

  let image = req.file ? req.file.filename : null;

  const sql = `
  INSERT INTO locations (title,image,available)
  VALUES (?,?,?)`;

  db.query(sql, [title, image, available], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error inserting location" });
    }

    res.json({
      message: "Location added successfully",
      id: result.insertId
    });

  });

});
router.put("/update-location/:id", upload.single("image"), (req, res) => {

  const { title, available } = req.body;
  const id = req.params.id;

  let image = req.file ? req.file.filename : null;

  if (image) {

    const sql = `
      UPDATE locations 
      SET title=?, image=?, available=? 
      WHERE id=?`;

    db.query(sql, [title, image, available, id], (err) => {

      if (err) return res.status(500).json(err);

      res.json({ message: "Location updated" });

    });

  } else {

    const sql = `
      UPDATE locations 
      SET title=?, available=? 
      WHERE id=?`;

    db.query(sql, [title, available, id], (err) => {

      if (err) return res.status(500).json(err);

      res.json({ message: "Location updated" });

    });

  }

});
router.delete("/delete-location/:id", (req, res) => {

  const sql = "DELETE FROM locations WHERE id=?";

  db.query(sql, [req.params.id], (err) => {

    if (err) return res.status(500).json(err);

    res.json({ message: "Location deleted" });

  });

});

module.exports = router;