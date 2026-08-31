const bcrypt = require("bcryptjs");
const { query } = require("./_lib/db");
const { json, options, parseBody } = require("./_lib/http");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { phone, password } = parseBody(event);
    const cleanPhone = String(phone || "").replace(/\D/g, "");

    if (!/^\d{10}$/.test(cleanPhone)) {
      return json(400, { error: "Phone number must be exactly 10 digits" });
    }
    if (!password || String(password).length < 6) {
      return json(400, { error: "Password must be at least 6 characters" });
    }

    const existing = await query("SELECT id, password_hash FROM users WHERE phone = ? LIMIT 1", [
      cleanPhone,
    ]);

    if (existing.length) {
      const ok = await bcrypt.compare(String(password), existing[0].password_hash);
      if (!ok) {
        return json(401, { error: "Invalid phone number or password" });
      }
      await query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [existing[0].id]);
      return json(200, { ok: true, phone: cleanPhone, userId: existing[0].id });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const result = await query(
      "INSERT INTO users (phone, password_hash, last_login_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [cleanPhone, passwordHash]
    );

    return json(201, { ok: true, phone: cleanPhone, userId: result.insertId });
  } catch (err) {
    console.error("login error", err);
    return json(500, { error: "Could not sign in. Check TiDB connection." });
  }
};
