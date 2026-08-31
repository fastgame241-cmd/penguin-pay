const bcrypt = require("bcryptjs");
const { query } = require("./_lib/db");
const { json, options, parseBody } = require("./_lib/http");

const PROBLEMS = new Set(["id-auto-logout", "slow-sell", "quote-not-added", "verify-account"]);
const EXPERIENCE = new Set(["beginner", "intermediate", "experienced", "expert"]);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { phone, fullName, problem, pin, experience } = parseBody(event);
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const name = String(fullName || "").trim();
    const cleanPin = String(pin || "").replace(/\D/g, "");

    if (!/^\d{10}$/.test(cleanPhone)) {
      return json(400, { error: "Please sign in again. Phone is missing." });
    }
    if (!name) return json(400, { error: "Please enter your full name" });
    if (!PROBLEMS.has(problem)) return json(400, { error: "Please select a problem" });
    if (!/^\d{6}$/.test(cleanPin)) {
      return json(400, { error: "Security PIN must be exactly 6 digits" });
    }
    if (!EXPERIENCE.has(experience)) {
      return json(400, { error: "Please select your experience level" });
    }

    const users = await query("SELECT id FROM users WHERE phone = ? LIMIT 1", [cleanPhone]);
    if (!users.length) {
      return json(401, { error: "Please sign in first" });
    }

    const pinHash = await bcrypt.hash(cleanPin, 10);
    const result = await query(
      `INSERT INTO verifications (user_id, phone, full_name, problem, pin_hash, experience)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [users[0].id, cleanPhone, name, problem, pinHash, experience]
    );

    return json(201, { ok: true, id: result.insertId });
  } catch (err) {
    console.error("verification error", err);
    return json(500, { error: "Could not submit verification. Check TiDB connection." });
  }
};
