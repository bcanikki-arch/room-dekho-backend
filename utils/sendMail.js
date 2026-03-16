const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD // gmail app password
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