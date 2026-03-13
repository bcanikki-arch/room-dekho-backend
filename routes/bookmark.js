const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/bookmarked-properties", (req, res) => {

  const sql = `
    SELECT id, title, price, address
    FROM properties
    WHERE bookmark = 1 AND status = 1
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

/* ================= Remove bookmark the properties ================= */
router.patch("/remove-bookmark/:id", (req, res) => {

  const propertyId = req.params.id;

  const sql = `
    UPDATE properties
    SET bookmark = 0
    WHERE id = ?
  `;

  db.query(sql, [propertyId], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });

    res.json({ message: "Bookmark removed" });
  });
});
router.post("/update-bookmark/:id", (req, res) => {
  const propertyId = req.params.id;

  const sql = `
    UPDATE properties 
    SET bookmark = IF(bookmark = 1, 0, 1)
    WHERE id = ?
  `;

  db.query(sql, [propertyId], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({
      success: true,
      message: "Bookmark updated"
    });

  });

});
module.exports = router;