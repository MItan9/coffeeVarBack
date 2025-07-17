const cron = require("node-cron");
const pool = require("../database/db"); // путь к подключению

cron.schedule("*/10 * * * *", async () => {
  try {
    const result = await pool.query(
      "DELETE FROM user_codes WHERE expires_at < NOW()"
    );
    console.log(`[CRON] Удалено просроченных кодов: ${result.rowCount}`);
  } catch (err) {
    console.error("[CRON] Ошибка при удалении кодов:", err);
  }
});
