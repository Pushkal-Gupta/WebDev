// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL = "https://ykpjmvoyatcrlqyqbgfu.supabase.co";
const SB_KEY =
  "sb_publishable__qbY0vXkNpH_rLhb4GYkAA_efhWihBH";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let user = null;
let currentAuthMode = "login";
let resetPendingEmail = "";

// ─── Theme ────────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const label = document.getElementById("mode-label");
  if (label) label.innerText = theme.charAt(0).toUpperCase() + theme.slice(1);
}

function toggleTheme() {
  const next =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "light"
      : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function loginWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
  if (error) alert("Google sign-in error: " + error.message);
}

async function loginWithGithub() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: window.location.href },
  });
  if (error) alert("GitHub sign-in error: " + error.message);
}

function togglePassVis(btn, inputId) {
  const input = document.getElementById(inputId);
  const showing = input.type === "password";
  input.type = showing ? "text" : "password";
  btn.setAttribute("aria-label", showing ? "Hide password" : "Show password");
  btn.innerHTML = showing
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function showScreen(name) {
  ["screen-main", "screen-otp", "screen-new-pass"].forEach((id) =>
    document.getElementById(id).classList.toggle("hidden", id !== name),
  );
}

function setAuthMode(mode) {
  currentAuthMode = mode;
  const title = document.getElementById("modal-title");
  const passContainer = document.getElementById("password-container");
  const switchText = document.getElementById("auth-switch-text");
  const forgotLink = document.getElementById("forgot-password-link");

  if (mode === "otp") {
    title.innerText = "Check Your Email";
    document.getElementById("otp-email-display").innerText = resetPendingEmail;
    document.getElementById("otp-input").value = "";
    showScreen("screen-otp");
    setTimeout(() => document.getElementById("otp-input")?.focus(), 50);
    return;
  }
  if (mode === "set-password") {
    title.innerText = "New Password";
    document.getElementById("reset-new-pass").value = "";
    document.getElementById("reset-confirm-pass").value = "";
    showScreen("screen-new-pass");
    setTimeout(() => document.getElementById("reset-new-pass")?.focus(), 50);
    return;
  }

  showScreen("screen-main");
  const sub = document.getElementById("modal-subtitle");
  const submitBtn = document.getElementById("submit-auth-btn");

  if (mode === "signup") {
    title.innerText = "Create your account";
    sub.innerText = "A few details and you're in";
    submitBtn.innerText = "Create account";
    passContainer.classList.remove("hidden");
    forgotLink.classList.add("hidden");
    switchText.innerHTML = `Already have an account? <span onclick="setAuthMode('login')">Sign in</span>`;
  } else if (mode === "reset") {
    title.innerText = "Reset password";
    sub.innerText = "We'll email you a recovery code";
    submitBtn.innerText = "Send code";
    passContainer.classList.add("hidden");
    forgotLink.classList.add("hidden");
    switchText.innerHTML = `Remembered it? <span onclick="setAuthMode('login')">Sign in</span>`;
    document.getElementById("auth-email").value = resetPendingEmail || "";
  } else {
    title.innerText = "Welcome back";
    sub.innerText = "Enter your credentials to continue";
    submitBtn.innerText = "Sign in";
    passContainer.classList.remove("hidden");
    forgotLink.classList.remove("hidden");
    switchText.innerHTML = `New here? <span onclick="setAuthMode('signup')">Create account</span>`;
  }
}

function handleAuth() {
  if (user) showAccountModal();
  else document.getElementById("auth-modal").classList.remove("hidden");
}

function closeAuthModal() {
  document.getElementById("auth-modal").classList.add("hidden");
  setAuthMode("login");
}

async function submitAuth() {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const btn = document.getElementById("submit-auth-btn");

  if (!email || (currentAuthMode !== "reset" && !password)) {
    alert("Please fill in all fields.");
    return;
  }

  btn.innerText = "Connecting...";
  btn.disabled = true;

  try {
    let res;
    if (currentAuthMode === "signup") {
      res = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (!res.error) {
        if (res.data?.session) {
          closeAuthModal();
          await checkUser();
        } else {
          alert("Check your inbox at " + email + " for a verification link!");
        }
      }
    } else if (currentAuthMode === "reset") {
      res = await supabaseClient.auth.resetPasswordForEmail(email);
      if (!res.error) {
        resetPendingEmail = email;
        setAuthMode("otp");
      }
    } else {
      res = await supabaseClient.auth.signInWithPassword({ email, password });
      if (!res.error) {
        closeAuthModal();
        await checkUser();
      }
    }
    if (res?.error) alert("Error: " + res.error.message);
  } catch (err) {
    alert("System error: " + err.message);
  } finally {
    btn.innerText =
      currentAuthMode === "signup"
        ? "Create account"
        : currentAuthMode === "reset"
          ? "Send code"
          : "Sign in";
    btn.disabled = false;
  }
}

async function submitOtp() {
  const token = document.getElementById("otp-input").value.trim();
  if (!token || token.length < 8) {
    alert("Please enter the full 8-digit code.");
    return;
  }
  const btn = document.getElementById("submit-otp-btn");
  btn.innerText = "Verifying...";
  btn.disabled = true;

  const { error } = await supabaseClient.auth.verifyOtp({
    email: resetPendingEmail,
    token,
    type: "recovery",
  });

  btn.innerText = "Verify Code";
  btn.disabled = false;

  if (error) alert("Invalid or expired code. " + error.message);
  else setAuthMode("set-password");
}

async function submitNewPassword() {
  const newPass = document.getElementById("reset-new-pass").value;
  const confirmPass = document.getElementById("reset-confirm-pass").value;

  if (!newPass || newPass.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }
  if (newPass !== confirmPass) {
    alert("Passwords don't match.");
    return;
  }

  const btn = document.getElementById("submit-newpass-btn");
  btn.innerText = "Saving...";
  btn.disabled = true;

  const { error } = await supabaseClient.auth.updateUser({ password: newPass });

  if (error) {
    alert("Error: " + error.message);
    btn.innerText = "Set Password";
    btn.disabled = false;
  } else {
    resetPendingEmail = "";
    closeAuthModal();
    await checkUser();
    setTimeout(() => alert("Password updated! You are now logged in."), 200);
  }
}

function showAccountModal() {
  document.getElementById("account-email-display").innerText = user.email;
  const isOAuth = user.app_metadata?.provider !== "email";
  if (isOAuth) {
    const provider = user.app_metadata?.provider || "OAuth";
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    document.getElementById("oauth-note").innerText =
      `Signed in with ${providerName} — password change not available.`;
  }
  document
    .getElementById("change-password-section")
    .classList.toggle("hidden", isOAuth);
  document.getElementById("oauth-note").classList.toggle("hidden", !isOAuth);
  if (!isOAuth) {
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
  }
  document.getElementById("account-modal").classList.remove("hidden");
}

function closeAccountModal() {
  document.getElementById("account-modal").classList.add("hidden");
}

async function changePassword() {
  const newPass = document.getElementById("new-password").value;
  const confirmPass = document.getElementById("confirm-password").value;

  if (!newPass || newPass.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }
  if (newPass !== confirmPass) {
    alert("Passwords don't match.");
    return;
  }

  const btn = document.getElementById("change-pass-btn");
  btn.innerText = "Updating...";
  btn.disabled = true;

  const { error } = await supabaseClient.auth.updateUser({ password: newPass });
  if (error) alert("Error: " + error.message);
  else {
    alert("Password updated successfully!");
    closeAccountModal();
  }

  btn.innerText = "Update Password";
  btn.disabled = false;
}

async function handleLogout() {
  closeAccountModal();
  await supabaseClient.auth.signOut();
  user = null;
  document.getElementById("auth-btn").innerText = "LOGIN";
}

async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();
  user = data.session?.user || null;
  document.getElementById("auth-btn").innerText = user ? "ACCOUNT" : "LOGIN";
}

// ─── Projects ─────────────────────────────────────────────────────────────────
// featured: true  — shown as large cards at the top
// featured: false — shown as compact list rows below
// status: "progress" | "done" | "update"

const PROJECTS = [
  {
    featured: true,
    name: "PG.Blog",
    desc: "Essays on tech, systems, and ideas. Read, comment, and join the discussion.",
    date: "Mar 2026",
    status: "done",
    url: "../blog/blog.html",
  },
  {
    featured: true,
    name: "PG.Hub",
    desc: "Your all-in-one coding hub — follow a visual DSA roadmap, solve LeetCode-style problems, enter contests, run code in the built-in compiler, learn ML concepts, and explore interactive visualizations.",
    date: "Jun 2026",
    status: "done",
    url: "../PGHub/dist/index.html",
  },
  {
    featured: true,
    name: "PG.Play",
    desc: "A small arcade for short breaks — play alone or with a friend.",
    date: "Apr 2026",
    status: "update",
    url: "../PG.Play/dist/index.html",
  },
  {
    featured: true,
    name: "PG.Chess",
    desc: "Real-time multiplayer chess with online rooms, live chat, AI engine, eval bar, and opening detection.",
    date: "Mar 2026",
    status: "update",
    url: "../onlineChess/dist/index.html",
  },
  {
    featured: false,
    name: "PG.Chess2P",
    desc: "",
    date: "Jun 2024",
    status: "done",
    url: "../chess/p3.html",
  },
  {
    featured: false,
    name: "PG.Web Basics",
    desc: "",
    date: "Feb 2024",
    status: "done",
    url: "../PG.Web_Basics/index.html",
  },
  {
    featured: false,
    name: "PG.Employee System",
    desc: "",
    date: "Jun 2024",
    status: "update",
    url: "../employeeSystem/p2.html",
  },
  {
    featured: false,
    name: "PG.Student System",
    desc: "",
    date: "Mar 2024",
    status: "done",
    url: "../studentSystem/p1.html",
  },
  {
    featured: false,
    name: "PG.Quiz",
    desc: "",
    date: "Oct 2023",
    status: "update",
    url: "../PG.Quiz/Quiz.html",
  },
];

const STATUS_LABEL = {
  progress: "In Progress",
  done: "Completed",
  update: "Update Required",
};
const STATUS_CLASS = {
  progress: "s-progress",
  done: "s-done",
  update: "s-update",
};

// ─── Render ───────────────────────────────────────────────────────────────────

function renderProjects() {
  const featured = PROJECTS.filter((p) => p.featured);
  const others = PROJECTS.filter((p) => !p.featured);

  const featuredHtml = featured
    .map(
      (p) => `
      <div class="feat-card" onclick="window.location.href='${p.url}'">
        <span class="feat-status ${STATUS_CLASS[p.status]}">${STATUS_LABEL[p.status]}</span>
        <div class="feat-name">${p.name}</div>
        <div class="feat-desc">${p.desc}</div>
        <div class="feat-footer">
          <span class="feat-date">${p.date}</span>
          <button class="visit-btn" onclick="event.stopPropagation();window.location.href='${p.url}'">Visit →</button>
        </div>
      </div>`,
    )
    .join("");

  const othersHtml = others
    .map(
      (p) => `
      <div class="other-item" onclick="window.location.href='${p.url}'">
        <span class="other-name">${p.name}</span>
        <span class="other-status ${STATUS_CLASS[p.status]}">${STATUS_LABEL[p.status]}</span>
        <span class="other-date">${p.date}</span>
        <button class="other-visit" onclick="event.stopPropagation();window.location.href='${p.url}'">Visit →</button>
      </div>`,
    )
    .join("");

  document.getElementById("display").innerHTML = `
    <div class="pg-wrap page-body">
      <p class="section-label">Featured</p>
      <div class="featured-grid">${featuredHtml}</div>
      <p class="section-label">More</p>
      <div class="other-list">${othersHtml}</div>
    </div>`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  applyTheme(localStorage.getItem("theme") || "dark");

  renderProjects();

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      user = session?.user || null;
      document.getElementById("auth-btn").innerText = user
        ? "ACCOUNT"
        : "LOGIN";
    }
  });

  checkUser();
}

init();
