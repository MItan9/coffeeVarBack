const cron = require("node-cron");
const pool = require("../database/db");

cron.schedule("0 0 * * *", async () => {
  try {
    const result = await pool.query(`
      DELETE FROM coupones
      WHERE DATE(expires_at) < CURRENT_DATE
    `);

    console.log(`[CRON] Удалено истекших купонов: ${result.rowCount}`);
  } catch (err) {
    console.error("[CRON] Ошибка при удалении просроченных купонов:", err);
  }
});
