const pool = require("./db");

const createUser = async (
  username,
  userSurname,
  mail,
  phone,
  hashedPassword,
  role,
  resetToken = null,
  tokenExpiresAt = null
) => {
  const result = await pool.query(
    "INSERT INTO users (name, surname, mail, phone,  password,  role, reset_token, token_expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
    [
      username,
      userSurname,
      mail,
      phone,
      hashedPassword,
      role,
      resetToken,
      tokenExpiresAt,
    ]
  );
  return result.rows[0];
};

const findUserByMail = async (mail) => {
  const result = await pool.query("SELECT * FROM users WHERE mail = $1", [
    mail,
  ]);
  return result.rows[0];
};

const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createOrUpdateQrCode = async (userId) => {
  const code = generate6DigitCode();
  console.log("Generated code:", code);
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 минуты

  await pool.query(
    `INSERT INTO user_codes (user_id, plain_code, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET plain_code = $2, created_at = NOW(), expires_at = $3`,
    [userId, code, expiresAt]
  );

  return code;
};

const findUserByQrCode = async (code) => {
  const result = await pool.query(
    `SELECT u."name", u.surname, ca.caps_number, co.coupons_number FROM user_codes 
     JOIN users AS u ON u.id = user_codes.user_id
     LEFT JOIN caps AS ca ON ca.user_id = user_codes.user_id
    LEFT JOIN coupones AS co ON co.user_id = user_codes.user_id
     WHERE user_codes.plain_code = $1 AND user_codes.expires_at > NOW()`,
    [code]
  );

  return result.rows[0]; // может быть undefined, если код истёк или не найден
};

const insertResetToken = async (resetToken, email, expiresAt) => {
  const result = await pool.query(
    `UPDATE users
     SET reset_token = $1, token_expires_at = $2
     WHERE mail = $3
     RETURNING id`,
    [resetToken, expiresAt, email]
  );
  return result.rows[0];
};

const updatePassword = async (hashedPassword, email) => {
  const result = await pool.query(
    `UPDATE users SET password = $1, reset_token = NULL, token_expires_at = NULL WHERE mail = $2`,
    [hashedPassword, email]
  );
  return result.rows[0];
};

const findUserByToken = async (token) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE reset_token = $1",
    [token]
  );
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByMail,
  createOrUpdateQrCode,
  findUserByQrCode,
  insertResetToken,
  updatePassword,
  findUserByToken,
};
