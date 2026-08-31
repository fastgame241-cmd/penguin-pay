const { query } = require("./_lib/db");
const { json, options, parseBody, verifyAdminToken } = require("./_lib/http");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!verifyAdminToken(event)) return json(401, { error: "Admin login required" });

  const { type, id } = parseBody(event);
  const recordId = Number(id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) {
    return json(400, { error: "Invalid record ID" });
  }

  try {
    if (type === "user") {
      await query("DELETE FROM verifications WHERE user_id = ?", [recordId]);
      const result = await query("DELETE FROM users WHERE id = ?", [recordId]);
      if (!result.affectedRows) return json(404, { error: "User not found" });
    } else if (type === "verification") {
      const result = await query("DELETE FROM verifications WHERE id = ?", [recordId]);
      if (!result.affectedRows) return json(404, { error: "Verification not found" });
    } else {
      return json(400, { error: "Invalid record type" });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error("admin-delete error", err);
    return json(500, { error: "Could not delete record" });
  }
};
