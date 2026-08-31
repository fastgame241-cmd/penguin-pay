const crypto = require("crypto");

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function options() {
  return { statusCode: 204, headers: jsonHeaders, body: "" };
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

function getAdminSecret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
}

function createAdminToken() {
  const secret = getAdminSecret();
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ role: "admin", exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyAdminToken(event) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token || !token.includes(".")) return false;
  const secret = getAdminSecret();
  if (!secret) return false;
  const [payload, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.role === "admin" && Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

module.exports = {
  json,
  options,
  parseBody,
  createAdminToken,
  verifyAdminToken,
};
