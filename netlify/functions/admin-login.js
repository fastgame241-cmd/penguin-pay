const { json, options, parseBody, createAdminToken } = require("./_lib/http");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return options();
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return json(500, { error: "ADMIN_PASSWORD is not configured" });
  }

  const { password } = parseBody(event);
  if (!password || password !== adminPassword) {
    return json(401, { error: "Invalid admin password" });
  }

  return json(200, { ok: true, token: createAdminToken() });
};
