const nodemailer = require("nodemailer");
require("dotenv").config();

const userMail = process.env.GMAIL;
const userPass = process.env.GMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: userMail,
    pass: userPass,
  },
});

const sendResetPasswordEmail = (to, resetLink) => {
  const mailOptions = {
    from: "coffeebar.app@gmail.com",
    to,
    subject: "Восстановление пароля",
    text: `Чтобы восстановить пароль, перейдите по ссылке: ${resetLink}`,
  };

  //   return transporter.sendMail(mailOptions);
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Ошибка при отправке:", error);
    } else {
      console.log("Письмо отправлено:", info.response);
    }
  });
};

module.exports = { sendResetPasswordEmail };
