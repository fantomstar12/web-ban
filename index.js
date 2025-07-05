const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SECRET_KEY = "BANPANEL_SECRET";

const users = {
  veltrix: { password: "1234", rank: "Co-Founder", canBan: true, canKick: true },
  austin: { password: "mod123", rank: "Moderator", canBan: false, canKick: true },
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
  if (!user || user.password !== password)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({
    username,
    rank: user.rank,
    canBan: user.canBan,
    canKick: user.canKick
  }, SECRET_KEY, { expiresIn: "2h" });

  res.json({ token, username, rank: user.rank, canBan: user.canBan, canKick: user.canKick });
});

app.get("/check/:username", (req, res) => {
  res.json({ banned: bannedUsers.has(req.params.username.toLowerCase()) });
});

app.post("/ban", authenticate, (req, res) => {
  if (!req.user.canBan) return res.status(403).json({ error: "Permission denied" });
  const username = req.body.username?.toLowerCase();
  if (!username) return res.status(400).json({ error: "Missing username" });

  bannedUsers.add(username);
  logs.push({ action: "Ban", target: username, executor: req.user.username, time: Date.now() });
  res.json({ success: true, message: `${username} banned.` });
});

app.post("/unban", authenticate, (req, res) => {
  const username = req.body.username?.toLowerCase();
  bannedUsers.delete(username);
  logs.push({ action: "Unban", target: username, executor: req.user.username, time: Date.now() });
  res.json({ success: true, message: `${username} unbanned.` });
});

app.post("/kick", authenticate, (req, res) => {
  if (!req.user.canKick) return res.status(403).json({ error: "Permission denied" });
  const username = req.body.username?.toLowerCase();
  logs.push({ action: "Kick", target: username, executor: req.user.username, time: Date.now() });
  res.json({ success: true, message: `${username} kicked.` });
});

app.get("/logs", authenticate, (req, res) => {
  res.json(logs);
});

app.get("/banlist", authenticate, (req, res) => {
  res.json([...bannedUsers]);
});

// Serve pages
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("*", (req, res) => res.redirect("/login"));

app.listen(3000, () => console.log("🔥 Ban Panel running on http://localhost:3000"));
