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
    subject: "🔐 Восстановление пароля — CoffeeVar",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #6F4E37;">CoffeeVar</h2>
        <p>Здравствуйте!</p>
        <p>Мы получили запрос на восстановление пароля для вашей учётной записи.</p>
        <p>
          Чтобы задать новый пароль, нажмите на кнопку ниже:
        </p>
        <a href="${resetLink}" 
           style="display: inline-block; background-color: #6F4E37; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 10px;">
          Сбросить пароль
        </a>
        <p style="margin-top: 20px;">Если вы не запрашивали сброс, просто проигнорируйте это сообщение.</p>
        <hr style="margin: 30px 0;" />
        <p style="font-size: 12px; color: #999;">С любовью, команда CoffeeVar ☕</p>
      </div>
    `,
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
