const mysql = require("mysql2/promise");

let pool;
let schemaReady = false;

function getPool() {
  if (!pool) {
    const host = process.env.TIDB_HOST;
    const user = process.env.TIDB_USER;
    const password = process.env.TIDB_PASSWORD;
    const database = process.env.TIDB_DATABASE || "penguin_pay";
    const port = Number(process.env.TIDB_PORT || 4000);

    if (!host || !user || !password) {
      const err = new Error("TiDB environment variables are not configured");
      err.statusCode = 500;
      throw err;
    }

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 5,
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    });
  }
  return pool;
}

async function ensureSchema() {
  if (schemaReady) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      phone VARCHAR(10) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS verifications (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      phone VARCHAR(10) NOT NULL,
      full_name VARCHAR(120) NOT NULL,
      problem VARCHAR(64) NOT NULL,
      pin_hash VARCHAR(255) NOT NULL,
      experience VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_verifications_created (created_at)
    )
  `);
  schemaReady = true;
}

async function query(sql, params = []) {
  await ensureSchema();
  const db = getPool();
  const [rows] = await db.query(sql, params);
  return rows;
}

module.exports = { query };
