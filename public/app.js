let token = "";

document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (res.ok) {
    token = data.token;
    toast("✅ Logged in!");
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadBanList();
    loadLogs();
  } else {
    toast("❌ " + data.error);
  }
});

async function banUser() {
  const username = document.getElementById("targetUser").value.trim();
  if (!username) return toast("⚠️ Enter a username to ban!");

  const res = await fetch("/ban", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ username })
  });

  const data = await res.json();
  toast(res.ok ? "✅ " + data.message : "❌ " + data.error);
  loadBanList();
  loadLogs();
}

async function unbanUser() {
  const username = document.getElementById("targetUser").value.trim();
  if (!username) return toast("⚠️ Enter a username to unban!");

  const res = await fetch("/unban", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ username })
  });

  const data = await res.json();
  toast(res.ok ? "✅ " + data.message : "❌ " + data.error);
  loadBanList();
  loadLogs();
}

function logout() {
  token = "";
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
  toast("👋 Logged out!");
}

function loadBanList() {
  fetch("/banlist", {
    headers: { Authorization: "Bearer " + token }
  })
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("banList");
      list.innerHTML = "";
      data.forEach(name => {
        const li = document.createElement("li");
        li.textContent = name;
        list.appendChild(li);
      });
    });
}

function loadLogs() {
  fetch("/logs", {
    headers: { Authorization: "Bearer " + token }
  })
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("logTable");
      table.innerHTML = "<tr><th>Action</th><th>User</th><th>By</th><th>Time</th></tr>";
      data.forEach(log => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${log.action}</td>
          <td>${log.target}</td>
          <td>${log.executor}</td>
          <td>${new Date(log.timestamp).toLocaleString()}</td>`;
        table.appendChild(row);
      });
    });
}

function toast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}
