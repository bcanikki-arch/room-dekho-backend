const express = require("express");
const router = express.Router();
const db = require("../db");
const sendMail = require("../utils/sendMail");

router.post("/send-message", async (req,res)=>{
  const { property_id, message } = req.body;
  const sql = `SELECT users.email, users.firstName FROM properties JOIN users ON users.id = properties.user_id WHERE properties.id=? LIMIT 1`;
  db.query(sql, [property_id], async (err,result)=>{
    if(err) return res.status(500).json({ message:"DB error" });
    if(!result.length) return res.status(404).json({ message:"Owner not found" });

    try{
      await sendMail(result[0].email, "New Property Inquiry", `<h3>Hello ${result[0].firstName}</h3><p>You have a new message:</p><p>${message}</p>`);
      res.json({ message:"Message sent successfully" });
    } catch(e){
      console.log(e);
      res.status(500).json({ message:"Mail error" });
    }
  });
});

module.exports = router;