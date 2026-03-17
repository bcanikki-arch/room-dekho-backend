const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  secure: true, // ✅ REQUIRED for 465
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  },
  // tls: {
  //   rejectUnauthorized: false
  // }
});

transporter.verify((err) => {
  if (err) console.log(err);
  else console.log("Mail server ready");
});

const sendMail = async (email, subject, html) => {
  await transporter.sendMail({
    from: `"RoomRent App" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject,
    html
  });
};

module.exports = sendMail;