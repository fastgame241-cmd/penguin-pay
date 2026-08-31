const { query } = require("./_lib/db");
const { json, options, verifyAdminToken } = require("./_lib/http");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

  if (!verifyAdminToken(event)) {
    return json(401, { error: "Admin login required" });
  }

  try {
    const users = await query(
      `SELECT id, phone, created_at, last_login_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 200`
    );
    const verifications = await query(
      `SELECT id, user_id, phone, full_name, problem, experience, created_at
       FROM verifications
       ORDER BY created_at DESC
       LIMIT 200`
    );

    return json(200, {
      users,
      verifications,
      counts: { users: users.length, verifications: verifications.length },
    });
  } catch (err) {
    console.error("admin-records error", err);
    return json(500, { error: "Could not load records. Check TiDB connection." });
  }
};
