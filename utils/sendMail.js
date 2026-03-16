const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.NODEMAILER_EMAIL,
//     pass: process.env.NODEMAILER_PASSWORD // gmail app password
//   }
// });
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true only for 465
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
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