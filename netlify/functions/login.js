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

    const existing = await query("SELECT id, password FROM users WHERE phone = ? LIMIT 1", [
      cleanPhone,
    ]);

    if (existing.length) {
      const ok = String(password) === String(existing[0].password);
      if (!ok) {
        return json(401, { error: "Invalid phone number or password" });
      }
      await query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [existing[0].id]);
      return json(200, { ok: true, phone: cleanPhone, userId: existing[0].id });
    }
     return json(401, { error: "Invalid phone number or password" });
  } catch (error) {
    console.error("login error", error);
    return json(500, { error: "Could not sign in. Check TiDB connection." });
  }
};
