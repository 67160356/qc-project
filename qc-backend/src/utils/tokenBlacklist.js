// เก็บ token ที่ logout แล้วไว้ใน memory (เดโม/โปรเจกต์นิสิต — ถ้า production จริง ควรใช้ Redis แทน)
const blacklist = new Set();

function blacklistToken(token) {
  blacklist.add(token);
}

function isBlacklisted(token) {
  return blacklist.has(token);
}

module.exports = { blacklistToken, isBlacklisted };
