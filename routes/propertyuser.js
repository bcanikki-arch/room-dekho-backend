const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/user", (req, res) => {
  const { user_id, page = 1, limit = 5 } = req.body;

  const offset = (page - 1) * limit;

  // Get properties with pagination
  const sql = `
    SELECT * 
    FROM properties 
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [user_id, Number(limit), Number(offset)], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });

    // total count query
    const countSql = `SELECT COUNT(*) as total FROM properties WHERE user_id = ?`;

    db.query(countSql, [user_id], (err2, countResult) => {
      if (err2) return res.status(500).json({ message: "Count error" });

      const formatted = results.map(p => ({
        ...p,
        images: JSON.parse(p.images || "[]"),
        features: JSON.parse(p.features || "[]")
      }));

      res.json({
        data: formatted,
        total: countResult[0].total,
        page: Number(page),
        totalPages: Math.ceil(countResult[0].total / limit)
      });
    });
  });
});
/* ================= proerties status update  ================= */
router.patch("/:id/status", (req, res) => {
  const propertyId = req.params.id;
  const { status } = req.body;

  const sql = "UPDATE properties SET status = ? WHERE id = ?";
  db.query(sql, [status, propertyId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "Status updated successfully" });
  });
});

module.exports = router;