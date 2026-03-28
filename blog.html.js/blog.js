const SB_URL = "https://ykpjmvoyatcrlqyqbgfu.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let user = null;
let currentAuthMode = "login";
let resetPendingEmail = "";
const POSTS = [
  {
    id: "ai-cage",
    date: "03.27.2026",
    title: "AI and the Lion's Cage — The Last Tool We Build",
    darkFile: "ai-cage-dark.html",
    lightFile: "ai-cage-light.html",
  },
  {
    id: "upcoming",
    date: "xx.xx.2026",
    title: "How Data Reaches You(A first Principles Approach)",
    darkFile: "how-data-reaches-you-dark.html",
    lightFile: "how-data-reaches-you-light.html",
  },
];
let currentActivePost = null;
let scrollSaveTimer = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function authorName() {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Anonymous"
  );
}

// ─── Theme ───────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const label = document.getElementById("mode-label");
  if (label) label.innerText = theme.charAt(0).toUpperCase() + theme.slice(1);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const target = current === "dark" ? "light" : "dark";
  applyTheme(target);
  localStorage.setItem("theme", target);

  if (!currentActivePost) return;
  const ifr = document.getElementById("reader-frame");
  if (!ifr || !ifr.contentWindow) return;

  const doc = ifr.contentDocument || ifr.contentWindow.document;
  const scrollPos = ifr.contentWindow.pageYOffset;
  const maxScroll =
    doc.documentElement.scrollHeight - ifr.contentWindow.innerHeight;
  const scrollPercent = maxScroll > 0 ? scrollPos / maxScroll : 0;

  const loader = document.getElementById("loader");
  if (loader) loader.classList.remove("hidden");

  ifr.src =
    target === "dark"
      ? currentActivePost.darkFile
      : currentActivePost.lightFile;

  ifr.onload = () => {
    if (loader) loader.classList.add("hidden");
    const newDoc = ifr.contentDocument || ifr.contentWindow.document;
    const newMax =
      newDoc.documentElement.scrollHeight - ifr.contentWindow.innerHeight;
    ifr.contentWindow.scrollTo(0, scrollPercent * newMax);
    attachScrollSaver(currentActivePost.id);
  };
}

// ─── Scroll persistence ───────────────────────────────────────────────────────

function attachScrollSaver(postId) {
  const ifr = document.getElementById("reader-frame");
  if (!ifr || !ifr.contentWindow) return;
  try {
    ifr.contentWindow.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollSaveTimer);
        scrollSaveTimer = setTimeout(() => {
          const doc = ifr.contentDocument || ifr.contentWindow.document;
          const scrollPos = ifr.contentWindow.pageYOffset;
          const maxScroll =
            doc.documentElement.scrollHeight - ifr.contentWindow.innerHeight;
          const pct = maxScroll > 0 ? scrollPos / maxScroll : 0;
          localStorage.setItem("scroll_" + postId, pct);
        }, 200);
      },
      { passive: true },
    );
  } catch (_) {
    // cross-origin guard
  }
}

function onIframeLoad(postId) {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");

  const saved = localStorage.getItem("scroll_" + postId);
  if (saved !== null) {
    const ifr = document.getElementById("reader-frame");
    if (ifr && ifr.contentWindow) {
      const doc = ifr.contentDocument || ifr.contentWindow.document;
      const maxScroll =
        doc.documentElement.scrollHeight - ifr.contentWindow.innerHeight;
      ifr.contentWindow.scrollTo(0, parseFloat(saved) * maxScroll);
    }
  }
  attachScrollSaver(postId);
}

// ─── Auth — login / signup / reset ───────────────────────────────────────────

async function loginWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
  if (error) alert("Google sign-in error: " + error.message);
}

function showScreen(name) {
  ["screen-main", "screen-otp", "screen-new-pass"].forEach((id) => {
    document.getElementById(id).classList.toggle("hidden", id !== name);
  });
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

  if (mode === "signup") {
    title.innerText = "Create Account";
    passContainer.classList.remove("hidden");
    forgotLink.classList.add("hidden");
    switchText.innerHTML = `Already have an account? <span onclick="setAuthMode('login')">Login</span>`;
  } else if (mode === "reset") {
    title.innerText = "Reset Password";
    passContainer.classList.add("hidden");
    forgotLink.classList.add("hidden");
    switchText.innerHTML = `Remembered it? <span onclick="setAuthMode('login')">Login</span>`;
    document.getElementById("auth-email").value = resetPendingEmail || "";
  } else {
    title.innerText = "Welcome Back";
    passContainer.classList.remove("hidden");
    forgotLink.classList.remove("hidden");
    switchText.innerHTML = `New here? <span onclick="setAuthMode('signup')">Create account</span>`;
  }
}

function handleAuth() {
  if (user) {
    showAccountModal();
  } else {
    document.getElementById("auth-modal").classList.remove("hidden");
  }
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
      res = await supabaseClient.auth.signUp({ email, password });
      if (!res.error)
        alert("Check your inbox at " + email + " for a verification link!");
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
    btn.innerText = "Continue";
    btn.disabled = false;
  }
}

async function submitOtp() {
  const token = document.getElementById("otp-input").value.trim();
  if (!token || token.length < 6) {
    alert("Please enter the full 6-digit code.");
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

  if (error) {
    alert("Invalid or expired code. " + error.message);
    btn.innerText = "Verify Code";
    btn.disabled = false;
  } else {
    // OTP accepted — user now has a session; let them set new password
    setAuthMode("set-password");
    btn.innerText = "Verify Code";
    btn.disabled = false;
  }
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
    // Small delay so the user sees the modal close before the alert
    setTimeout(() => alert("Password updated! You are now logged in."), 200);
  }
}

// ─── Auth — account panel ─────────────────────────────────────────────────────

function showAccountModal() {
  const emailEl = document.getElementById("account-email-display");
  emailEl.innerText = user.email;

  const isOAuth = user.app_metadata?.provider !== "email";
  const pwSection = document.getElementById("change-password-section");
  const oauthNote = document.getElementById("oauth-note");

  if (isOAuth) {
    pwSection.classList.add("hidden");
    oauthNote.classList.remove("hidden");
  } else {
    pwSection.classList.remove("hidden");
    oauthNote.classList.add("hidden");
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

  if (error) {
    alert("Error: " + error.message);
  } else {
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
  renderInputArea();
}

// ─── App ──────────────────────────────────────────────────────────────────────

async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();
  user = data.session?.user || null;
  document.getElementById("auth-btn").innerText = user ? "ACCOUNT" : "LOGIN";
  renderInputArea();
  if (currentActivePost) fetchComments(currentActivePost.id);
}

function renderInputArea() {
  const area = document.getElementById("comment-input-area");
  if (!area) return;
  if (!user) {
    area.innerHTML = `<div class="login-msg">Please <span onclick="handleAuth()">login</span> to join the discussion.</div>`;
    return;
  }
  const avatar =
    user.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName())}&background=0f2b29&color=00fff5`;
  area.innerHTML = `
    <div class="comment-box-top">
      <div class="avatar-box"><img src="${avatar}" alt="avatar"></div>
      <div class="input-wrap">
        <textarea id="c-text" placeholder="Share your thoughts..."></textarea>
        <button class="btn-post" onclick="postComment()">POST</button>
      </div>
    </div>`;
}

function init() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  document.getElementById("post-list").innerHTML = POSTS.map(
    (p) =>
      `<div class="feed-item" onclick="loadPost('${p.id}')">
         <div class="post-date">${p.date}</div>
         <div class="post-title">${p.title}</div>
       </div>`,
  ).join("");

  // Handle OAuth redirect: Supabase fires onAuthStateChange after redirect
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      user = session?.user || null;
      document.getElementById("auth-btn").innerText = user
        ? "ACCOUNT"
        : "LOGIN";
      renderInputArea();
      if (currentActivePost) fetchComments(currentActivePost.id);
    }
  });

  checkUser();

  // URL state: restore post on page refresh
  const postId = new URLSearchParams(window.location.search).get("post");
  if (postId) loadPost(postId, true);
}

function loadPost(postId, isRefresh = false) {
  const p = POSTS.find((x) => x.id === postId);
  if (!p) return;

  currentActivePost = p;
  const theme = document.documentElement.getAttribute("data-theme");
  document.body.classList.add("is-reading-mode");

  const brand = document.querySelector(".brand-link");
  brand.classList.add("is-reading");
  brand.setAttribute("title", "Back to Index");

  document.getElementById("main-ui").classList.add("hidden");
  document.getElementById("post-view").classList.remove("hidden");

  document.getElementById("p-content").innerHTML =
    `<div id="loader"></div><iframe id="reader-frame" src="${
      theme === "dark" ? p.darkFile : p.lightFile
    }" onload="onIframeLoad('${p.id}')"></iframe>`;

  fetchComments(postId);

  if (!isRefresh) {
    const newUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname +
      "?post=" +
      postId;
    window.history.pushState({ path: newUrl }, "", newUrl);
  }
}

function showHome() {
  document.body.classList.remove("is-reading-mode");
  const brand = document.querySelector(".brand-link");
  brand.classList.remove("is-reading");
  brand.removeAttribute("title");
  document.getElementById("main-ui").classList.remove("hidden");
  document.getElementById("post-view").classList.add("hidden");
  currentActivePost = null;

  const newUrl =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname;
  window.history.pushState({ path: newUrl }, "", newUrl);
}

// ─── Comments ─────────────────────────────────────────────────────────────────

async function postComment() {
  const textEl = document.getElementById("c-text");
  const text = textEl?.value.trim();
  if (!text || !user || !currentActivePost) return;

  const btn = document.querySelector(".btn-post");
  if (btn) {
    btn.innerText = "Posting...";
    btn.disabled = true;
  }

  const { error } = await supabaseClient.from("comments").insert({
    post_id: currentActivePost.id,
    content: text,
    author: authorName(),
    user_id: user.id,
  });

  if (error) {
    alert("Error posting comment: " + error.message);
  } else {
    textEl.value = "";
    await fetchComments(currentActivePost.id);
  }

  if (btn) {
    btn.innerText = "POST";
    btn.disabled = false;
  }
}

async function postReply(parentId) {
  const textEl = document.getElementById("reply-text-" + parentId);
  const text = textEl?.value.trim();
  if (!text || !user || !currentActivePost) return;

  const btn = document.querySelector(`#reply-form-${parentId} .btn-post-sm`);
  if (btn) {
    btn.innerText = "Posting...";
    btn.disabled = true;
  }

  const { error } = await supabaseClient.from("comments").insert({
    post_id: currentActivePost.id,
    content: text,
    author: authorName(),
    user_id: user.id,
    parent_id: parentId,
  });

  if (error) {
    alert("Error posting reply: " + error.message);
    if (btn) {
      btn.innerText = "Post Reply";
      btn.disabled = false;
    }
  } else {
    await fetchComments(currentActivePost.id);
  }
}

async function saveEdit(commentId) {
  const textEl = document.getElementById("edit-text-" + commentId);
  const text = textEl?.value.trim();
  if (!text || !user) return;

  const btn = document.querySelector(`#edit-form-${commentId} .btn-post-sm`);
  if (btn) {
    btn.innerText = "Saving...";
    btn.disabled = true;
  }

  const { error } = await supabaseClient
    .from("comments")
    .update({ content: text, is_edited: true })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    alert("Error updating comment: " + error.message);
    if (btn) {
      btn.innerText = "Save";
      btn.disabled = false;
    }
  } else {
    await fetchComments(currentActivePost.id);
  }
}

function toggleReplyForm(commentId) {
  const form = document.getElementById("reply-form-" + commentId);
  form.classList.toggle("hidden");
  if (!form.classList.contains("hidden")) {
    document.getElementById("reply-text-" + commentId)?.focus();
  }
}

function toggleEditForm(commentId) {
  const form = document.getElementById("edit-form-" + commentId);
  const isHidden = form.classList.contains("hidden");
  if (isHidden) {
    const bodyEl = document.getElementById("c-body-" + commentId);
    const ta = document.getElementById("edit-text-" + commentId);
    if (ta && bodyEl) ta.value = bodyEl.textContent;
    form.classList.remove("hidden");
    ta?.focus();
  } else {
    form.classList.add("hidden");
  }
}

function renderComment(c, isReply) {
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author)}&background=0f2b29&color=00fff5`;
  const date = new Date(c.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const isOwn = user && user.id === c.user_id;
  const canReply = user && !isReply;

  const repliesHtml = (c.replies || [])
    .map((r) => renderComment(r, true))
    .join("");

  return `
    <div class="comment-item${isReply ? " comment-reply" : ""}" id="comment-${c.id}">
      <div class="avatar-box"><img src="${avatar}" alt="${escapeHtml(c.author)}"></div>
      <div class="c-content">
        <div class="c-header">
          <span class="c-user">${escapeHtml(c.author)}</span>
          <span class="c-meta">${date}</span>
          ${c.is_edited ? '<span class="edited-tag">edited</span>' : ""}
        </div>
        <div class="c-body" id="c-body-${c.id}">${escapeHtml(c.content)}</div>
        <div class="c-actions">
          ${canReply ? `<button class="c-action-btn" onclick="toggleReplyForm('${c.id}')">Reply</button>` : ""}
          ${isOwn ? `<button class="c-action-btn" onclick="toggleEditForm('${c.id}')">Edit</button>` : ""}
        </div>
        <div id="reply-form-${c.id}" class="inline-form hidden">
          <textarea id="reply-text-${c.id}" placeholder="Write a reply..." rows="3"></textarea>
          <div class="inline-form-actions">
            <button class="btn-cancel" onclick="toggleReplyForm('${c.id}')">Cancel</button>
            <button class="btn-post-sm" onclick="postReply('${c.id}')">Post Reply</button>
          </div>
        </div>
        <div id="edit-form-${c.id}" class="inline-form hidden">
          <textarea id="edit-text-${c.id}" rows="3"></textarea>
          <div class="inline-form-actions">
            <button class="btn-cancel" onclick="toggleEditForm('${c.id}')">Cancel</button>
            <button class="btn-post-sm" onclick="saveEdit('${c.id}')">Save</button>
          </div>
        </div>
        ${repliesHtml ? `<div class="replies-list">${repliesHtml}</div>` : ""}
      </div>
    </div>`;
}

async function fetchComments(pid) {
  const { data } = await supabaseClient
    .from("comments")
    .select("*")
    .eq("post_id", pid)
    .order("created_at", { ascending: true });

  const comments = data || [];

  // Build tree
  const map = {};
  const roots = [];
  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });
  comments.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  document.getElementById("c-count").innerText =
    `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`;

  // Roots newest first, replies oldest first (natural thread order)
  document.getElementById("comments-list").innerHTML = roots
    .reverse()
    .map((c) => renderComment(c, false))
    .join("");
}

init();
