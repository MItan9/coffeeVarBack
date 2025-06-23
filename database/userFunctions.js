const pool = require("./db");

const createUser = async (username, userSurname, mail, phone, hashedPassword, role) => {
  const result = await pool.query(
    "INSERT INTO users (name, surname, mail, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [username, userSurname, mail, phone, hashedPassword, role]
  );
  return result.rows[0];
};

const findUserByMail = async (mail) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE mail = $1",
    [mail]
  );
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByMail,
};
