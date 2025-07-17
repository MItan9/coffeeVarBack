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
    "INSERT INTO users (name, surname, mail, phone,  password,  role, reset_token, token_expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)  RETURNING id, name, surname, mail, role",
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

const createUserCups = async (userId, cupsNumber = 0) => {
  const result = await pool.query(
    "INSERT INTO cups (user_id, cups_number) VALUES ($1, $2) RETURNING id, user_id, cups_number",
    [userId, cupsNumber]
  );
  return result.rows[0];
};
const createUserCoupones = async (userId, couponeNumber = 0) => {
  const result = await pool.query(
    "INSERT INTO coupones (user_id, coupons_number) VALUES ($1, $2) RETURNING id, user_id, coupons_number",
    [userId, couponeNumber]
  );
  return result.rows[0];
};

const findUserByMail = async (mail) => {
  const result = await pool.query("SELECT * FROM users WHERE mail = $1", [
    mail,
  ]);
  return result.rows[0];
};

const createOrUpdateQrCode = async (userId, code, qrImage, expiresAt) => {
  await pool.query(
    `INSERT INTO user_codes (user_id, plain_code, qr_code, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id)
     DO UPDATE SET plain_code = $2, qr_code = $3, created_at = NOW(), expires_at = $4`,
    [userId, code, qrImage, expiresAt]
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

async function saveRefreshToken(userId, refreshToken) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
    [userId, refreshToken, expiresAt]
  );
}

async function findUserByRefreshToken(token) {
  const res = await pool.query(
    `SELECT users.id, users.name, users.role
     FROM users
     JOIN refresh_tokens ON users.id = refresh_tokens.user_id
     WHERE refresh_tokens.token = $1`,
    [token]
  );
  return res.rows[0];
}

const findUserById = async (id) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
};

const updateUserFields = async (userId, updatedField) => {
  const field = Object.keys(updatedField);
  const value = Object.values(updatedField);

  const result = await pool.query(
    `UPDATE users SET ${field} = $1 WHERE id = $2 RETURNING ${field}`,
    [...value, userId]
  );
  return result.rows[0];
};

const deleteUserById = async (userId) => {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  return result.rows[0];
};

const getUserCupsById = async (userId) => {
  const result = await pool.query(
    "SELECT cups_number FROM cups WHERE user_id = $1",
    [userId]
  );
  return result.rows[0];
};
const getUserByCode = async (code) => {
  const result = await pool.query(
    `SELECT 
  u.name,
  u.surname,
  c.cups_number,
  (
    SELECT COUNT(*)::int
    FROM coupones 
    WHERE user_id = uc.user_id
  ) AS coupons_number
FROM user_codes uc
LEFT JOIN users u ON u.id = uc.user_id
LEFT JOIN cups c ON uc.user_id = c.user_id
LEFT JOIN coupones cpn ON uc.user_id = cpn.user_id
WHERE uc.plain_code = $1`,
    [code]
  );
  return result.rows[0];
};

const updateCupsNumber = async (userId, cupsDelta) => {
  const result = await pool.query(
    "UPDATE cups SET cups_number = GREATEST(cups_number + $1, 0) WHERE user_id = $2 RETURNING cups_number",
    [cupsDelta, userId]
  );

  if (result.rowCount > 0) {
    return { success: true, cups_number: result.rows[0].cups_number };
  } else {
    return { success: false, message: "Пользователь не найден" };
  }
};
const updateCouponsNumber = async (userId, couponsDelta) => {
  try {
    if (couponsDelta < 0) {
      // Удаляем столько строк, сколько отрицательное значение (но не больше текущих купонов)
      const deleteCount = Math.abs(couponsDelta);

      const deleteResult = await pool.query(
        `DELETE FROM coupones 
         WHERE user_id = $1 
         AND id IN (
           SELECT id FROM coupones 
           WHERE user_id = $1 
           ORDER BY expires_at ASC 
           LIMIT $2
         )
         RETURNING *`,
        [userId, deleteCount]
      );

      return {
        success: true,
        removed_coupons_number: Math.max(0, deleteResult.rowCount),
      };
    } else {
      for (let i = 0; i < couponsDelta; i++) {
        await pool.query(
          `INSERT INTO coupones (user_id, created_at, expires_at)
           VALUES ($1, NOW(), NOW() + INTERVAL '1 month')`,
          [userId]
        );
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM coupones WHERE user_id = $1`,
        [userId]
      );

      return {
        success: true,
        coupons_number: parseInt(countResult.rows[0].count),
      };
    }
  } catch (error) {
    console.error("Ошибка при обновлении купонов:", error);
    return {
      success: false,
      message: "Ошибка при обновлении купонов",
    };
  }
};

const getUserIdByCode = async (code) => {
  const result = await pool.query(
    "SELECT u.id FROM user_codes uc LEFT JOIN users u ON u.id = uc.user_id WHERE plain_code = $1",
    [code]
  );
  return result.rows[0];
};


const getUserCoupons = async (userId) => {
  const result = await pool.query(
    `SELECT id, expires_at FROM coupones
     WHERE user_id = $1 AND expires_at > NOW()
     ORDER BY expires_at ASC`,
    [userId]
  );
  return result.rows;
};

const addCouponToUser = async (userId) => {
  const res = await pool.query(
    `SELECT COUNT(*) FROM coupones 
    WHERE user_id = $1 AND expires_at > NOW()`,
    [userId]
  );
  
const count = parseInt(res.rows[0]?.count ?? 0); 
if (count >= 3) return false; // лимит достигнут
console.log("Количество купонов:", count);


  if (count >= 3) return false; // лимит достигнут

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

  const inserted = await pool.query(
    `INSERT INTO coupones (user_id, created_at, expires_at)
     VALUES ($1, NOW(), $2)
     RETURNING id, expires_at`,
    [userId, expiresAt]
  );

  return inserted.rows[0]; // можно возвращать новый купон, если нужно на фронте
};

const resetUserCups = async (userId) => {
  await pool.query(
    `UPDATE cups SET cups_number = 0 WHERE user_id = $1`,
    [userId]
  );
};



// const incrementCupAndReward = async (userId) => {
//   // Убедимся, что строка в cups существует
//   const exists = await pool.query(
//     `SELECT 1 FROM cups WHERE user_id = $1`,
//     [userId]
//   );
//   if (exists.rows.length === 0) {
//     await pool.query(
//       `INSERT INTO cups (user_id, cups_number) VALUES ($1, 0)`,
//       [userId]
//     );
//   }

//   // Увеличиваем cups_number
//   const updated = await pool.query(
//     `UPDATE cups
//      SET cups_number = cups_number + 1
//      WHERE user_id = $1
//      RETURNING cups_number`,
//     [userId]
//   );

//   const cups = updated.rows[0]?.cups_number;
//   if (cups === undefined) throw new Error("cups_number не получено");

//   // Проверка на выдачу купона
//   let couponAdded = false;
//   if (cups >= 6) {
//     const addedCoupon = await addCouponToUser(userId); // добавление с лимитом
//     if (addedCoupon) {
//       await resetUserCups(userId);
//       couponAdded = true;
//     }
//   }

//   return {
//     cups: couponAdded ? 0 : cups,
//     couponAdded
//   };
// };



module.exports = {
  createUser,
  findUserByMail,
  createOrUpdateQrCode,
  findUserByQrCode,
  insertResetToken,
  updatePassword,
  findUserByToken,
  saveRefreshToken,
  findUserByRefreshToken,
  findUserById,
  updateUserFields,
  deleteUserById,
  getUserCupsById,
  getUserByCode,
  createUserCups,
  createUserCoupones,
  updateCupsNumber,
  getUserIdByCode,
  updateCouponsNumber,
  getUserCoupons,
  addCouponToUser,
  resetUserCups,

};
