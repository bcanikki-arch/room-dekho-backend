const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nikitagtech115@gmail.com",
    pass: "klxkbmncomegoiql" // gmail app password
  }
});

const sendMail = async (email, subject, html) => {
  await transporter.sendMail({
    from: `"RoomRent App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html
  });
};

module.exports = sendMail;