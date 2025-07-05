const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SECRET_KEY = "AUSTIN_IS_A_GOODBOY@gHjkLoIuNGfda"; // Change this to something secret

// 🔐 Simple user login (no bcrypt)
const users = {
  Austin: "austin234@",
  Veltrix: "veltrixpriv@"
};

// ☠️ In-memory ban list + logs
const bannedUsers = new Set();
const banLog = [];

// 🔒 JWT Auth Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// 📦 Log helper
function logAction(action, executor, target) {
  banLog.push({
    action,
    executor,
    target,
    timestamp: new Date().toISOString(),
  });
}

// 🔐 Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const realPassword = users[username];
  if (!realPassword || realPassword !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "2h" });
  res.json({ token });
});

// ✅ Ban route
app.post("/ban", authenticate, (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const clean = username.toLowerCase();
  bannedUsers.add(clean);
  logAction("ban", req.user.username, clean);

  res.json({ success: true, message: `${username} has been banned.` });
});

// 🔓 Unban route
app.post("/unban", authenticate, (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });

  const clean = username.toLowerCase();
  bannedUsers.delete(clean);
  logAction("unban", req.user.username, clean);

  res.json({ success: true, message: `${username} has been unbanned.` });
});

// 🕵️‍♂️ Check ban status (for Roblox)
app.get("/check/:username", (req, res) => {
  const clean = req.params.username.toLowerCase();
  res.json({ banned: bannedUsers.has(clean) });
});

// 📋 Ban list
app.get("/banlist", authenticate, (req, res) => {
  res.json([...bannedUsers]);
});

// 📜 Logs
app.get("/logs", authenticate, (req, res) => {
  res.json(banLog);
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
