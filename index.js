const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SECRET_KEY = "banpanel_secret_key";

// ✅ Users with rank
const users = {
  veltrix: { password: "1234", rank: "Co-Founder" },
  austin: { password: "mod123", rank: "Moderator" },
};

const bannedUsers = new Set();
const logs = [];

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ username, rank: user.rank }, SECRET_KEY, { expiresIn: "2h" });
  res.json({ token, username, rank: user.rank });
});

app.get("/check/:username", (req, res) => {
  const uname = req.params.username.toLowerCase();
  res.json({ banned: bannedUsers.has(uname) });
});

app.post("/ban", authenticate, (req, res) => {
  const uname = req.body.username?.toLowerCase();
  if (!uname) return res.status(400).json({ error: "Missing username" });

  bannedUsers.add(uname);
  logs.push({ action: "Banned", target: uname, executor: req.user.username, timestamp: Date.now() });
  res.json({ success: true, message: `${uname} has been banned.` });
});

app.post("/unban", authenticate, (req, res) => {
  const uname = req.body.username?.toLowerCase();
  if (!uname) return res.status(400).json({ error: "Missing username" });

  bannedUsers.delete(uname);
  logs.push({ action: "Unbanned", target: uname, executor: req.user.username, timestamp: Date.now() });
  res.json({ success: true, message: `${uname} has been unbanned.` });
});

app.get("/logs", authenticate, (req, res) => res.json(logs));
app.get("/banlist", authenticate, (req, res) => res.json([...bannedUsers]));

// ✅ Route frontend URLs
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("*", (req, res) => res.redirect("/login"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
