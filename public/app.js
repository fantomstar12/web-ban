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
    showToast("✅ Logged in!");
    navigate("/dashboard");
  } else {
    showToast("❌ " + data.error);
  }
};

function logout() {
  token = "";
  localStorage.clear();
  showToast("Logged out");
}

function navigate(path) {
  history.pushState({}, "", path);
  route();
}

function showPage(pageId) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(pageId + "Page").classList.remove("hidden");
}

function route() {
  const path = window.location.pathname;
  token = localStorage.getItem("token");

  if (path === "/dashboard") {
    if (!token) return navigate("/login");
    document.getElementById("userDisplay").innerHTML = `
      <strong>${localStorage.getItem("username")}</strong><br>
      <small>${localStorage.getItem("rank")}</small>
    `;
    showPage("dashboard");
    loadLogs();
  } else {
    showPage("login");
  }
}

async function banUser() {
  const username = document.getElementById("targetUser").value;
  const res = await fetch("/ban", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username })
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
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username })
  });
  const data = await res.json();
  showToast(data.message || data.error);
  loadLogs();
}

async function loadLogs() {
  const res = await fetch("/logs", {
    headers: { "Authorization": "Bearer " + token }
  });
  const data = await res.json();
  const table = document.getElementById("logTable");
  table.innerHTML = "<tr><th>Action</th><th>Target</th><th>By</th><th>Time</th></tr>";
  data.forEach(log => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${log.action}</td>
      <td>${log.target}</td>
      <td>${log.executor}</td>
      <td>${new Date(log.timestamp).toLocaleString()}</td>
    `;
    table.appendChild(row);
  });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}

window.addEventListener("popstate", route);
window.addEventListener("load", route);
