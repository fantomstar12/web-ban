let token = "";

document.getElementById("loginBtn").onclick = async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (res.ok) {
    token = data.token;
    localStorage.setItem("token", token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("rank", data.rank);
    localStorage.setItem("canBan", data.canBan);
    localStorage.setItem("canKick", data.canKick);

    document.getElementById("userDisplay").innerHTML = `
      <strong>${data.username}</strong><br>
      <small>${data.rank}</small>
    `;
    route("/dashboard");
  } else {
    showToast("❌ " + data.error);
  }
};

function logout() {
  token = "";
  localStorage.clear();
  showToast("Logged out.");
  route("/login");
}

function route(path = window.location.pathname) {
  const token = localStorage.getItem("token");

  if (path === "/dashboard") {
    if (!token) return route("/login");
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("dashboardPage").classList.remove("hidden");
    loadLogs();

    document.getElementById("userDisplay").innerHTML = `
      <strong>${localStorage.getItem("username")}</strong><br>
      <small>${localStorage.getItem("rank")}</small>
    `;
  } else {
    document.getElementById("dashboardPage").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
  }

  history.pushState({}, "", path);
}

window.addEventListener("load", () => route());
window.addEventListener("popstate", () => route());

async function banUser() {
  if (localStorage.getItem("canBan") !== "true") return showToast("No permission to ban");
  const username = document.getElementById("targetUser").value;
  const res = await fetch("/ban", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  showToast(data.message || data.error);
  loadLogs();
}

async function unbanUser() {
  const username = document.getElementById("targetUser").value;
  const res = await fetch("/unban", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  showToast(data.message || data.error);
  loadLogs();
}

async function kickUser() {
  if (localStorage.getItem("canKick") !== "true") return showToast("No permission to kick");
  const username = document.getElementById("targetUser").value;
  const res = await fetch("/kick", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  showToast(data.message || data.error);
  loadLogs();
}

async function loadLogs() {
  const res = await fetch("/logs", {
    headers: { Authorization: "Bearer " + token },
  });
  const logs = await res.json();
  const table = document.getElementById("logTable");
  table.innerHTML = "<tr><th>Action</th><th>User</th><th>By</th><th>Time</th></tr>";
  logs.reverse().forEach(log => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${log.action}</td>
      <td>${log.target}</td>
      <td>${log.executor}</td>
      <td>${new Date(log.time).toLocaleString()}</td>
    `;
    table.appendChild(row);
  });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}
