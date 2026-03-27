const SB_URL = "https://ykpjmvoyatcrlqyqbgfu.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcGptdm95YXRjcmxxeXFiZ2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzgyNTEsImV4cCI6MjA4OTk1NDI1MX0.LgSbUHB93i5S61jp5d_0sAUWosZzDWWWv7jwoU6X-3Q";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let user = null;
let currentAuthMode = "login";
const POSTS = [
  {
    id: "ai-cage",
    date: "2026.03.27",
    title: "AI and the Lion's Cage — The Last Tool We Build",
    darkFile: "ai-cage-dark.html",
    lightFile: "ai-cage-light.html",
  },
  {
    id: "upcoming",
    date: "2026.xx.xx",
    title: "How Data Reaches You(A first Principles Approach)",
    darkFile: "how-data-reaches-you-dark.html",
    lightFile: "how-data-reaches-you-light.html",
  },
];
let currentActivePost = null;

// --- Auth logic ---
function setAuthMode(mode) {
  currentAuthMode = mode;
  const title = document.getElementById("modal-title");
  const passContainer = document.getElementById("password-container");
  const switchText = document.getElementById("auth-switch-text");
  const forgotLink = document.getElementById("forgot-password-link");
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
  } else {
    title.innerText = "Welcome Back";
    passContainer.classList.remove("hidden");
    forgotLink.classList.remove("hidden");
    switchText.innerHTML = `New here? <span onclick="setAuthMode('signup')">Create account</span>`;
  }
}
async function handleAuth() {
  if (user) {
    await supabaseClient.auth.signOut();
    location.reload();
  } else {
    document.getElementById("auth-modal").classList.remove("hidden");
  }
}
function closeAuthModal() {
  document.getElementById("auth-modal").classList.add("hidden");
}
async function submitAuth() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  let res;
  if (currentAuthMode === "signup")
    res = await supabaseClient.auth.signUp({ email, password });
  else if (currentAuthMode === "reset")
    res = await supabaseClient.auth.resetPasswordForEmail(email);
  else res = await supabaseClient.auth.signInWithPassword({ email, password });
  if (res.error) alert(res.error.message);
  else if (currentAuthMode === "login") location.reload();
}
async function loginWithGoogle() {
  await supabaseClient.auth.signInWithOAuth({ provider: "google" });
}

// --- App logic ---
async function checkUser() {
  const { data } = await supabaseClient.auth.getSession();
  user = data.session?.user;
  document.getElementById("auth-btn").innerText = user ? "LOGOUT" : "LOGIN";
  renderInputArea();
  if (currentActivePost) fetchComments(currentActivePost.id);
}
function renderInputArea() {
  const area = document.getElementById("comment-input-area");
  if (!user) {
    area.innerHTML = `<div class="login-msg">Please <span style="color:var(--accent);cursor:pointer;text-decoration:underline" onclick="handleAuth()">login</span> to join.</div>`;
    return;
  }
  const avatar =
    user.user_metadata.avatar_url ||
    `https://ui-avatars.com/api/?name=${user.email.split("@")[0]}&background=0f2b29&color=00fff5`;
  area.innerHTML = `<div class="comment-box-top"><div class="avatar-box"><img src="${avatar}"></div><div class="input-wrap"><textarea id="c-text" placeholder="Add a comment..."></textarea><button class="btn-post" onclick="postComment()">POST</button></div></div>`;
}
function init() {
  document.getElementById("post-list").innerHTML = POSTS.map(
    (p) =>
      `<div class="feed-item" onclick="loadPost('${p.id}')"><div class="post-date">${p.date}</div><div class="post-title">${p.title}</div></div>`,
  ).join("");
  checkUser();
}

function loadPost(postId) {
  const p = POSTS.find((x) => x.id === postId);
  currentActivePost = p;
  const theme = document.documentElement.getAttribute("data-theme");
  document.body.classList.add("is-reading-mode");
  const brand = document.querySelector(".brand-link");
  brand.classList.add("is-reading");
  brand.setAttribute("title", "Back to Index");
  document.getElementById("main-ui").classList.add("hidden");
  document.getElementById("post-view").classList.remove("hidden");
  document.getElementById("p-content").innerHTML =
    `<div id="loader"></div><iframe id="reader-frame" src="${theme === "dark" ? p.darkFile : p.lightFile}" onload="document.getElementById('loader').classList.add('hidden')"></iframe>`;
  fetchComments(postId);
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const target = currentTheme === "dark" ? "light" : "dark";

  // 1. Update the main blog UI theme
  html.setAttribute("data-theme", target);

  const label = document.getElementById("mode-label");
  if (label) {
    label.innerText = target.charAt(0).toUpperCase() + target.slice(1);
  }

  // 2. Sync the iframe content if an article is open
  if (currentActivePost) {
    const ifr = document.getElementById("reader-frame");
    if (ifr && ifr.contentWindow) {
      // Calculate current scroll percentage before the swap
      const doc = ifr.contentDocument || ifr.contentWindow.document;
      const scrollPos = ifr.contentWindow.pageYOffset;
      const maxScroll =
        doc.documentElement.scrollHeight - ifr.contentWindow.innerHeight;
      const scrollPercent = maxScroll > 0 ? scrollPos / maxScroll : 0;

      // Show loader while switching files
      const loader = document.getElementById("loader");
      if (loader) loader.classList.remove("hidden");

      // Swap the iframe source to the matching theme file
      ifr.src =
        target === "dark"
          ? currentActivePost.darkFile
          : currentActivePost.lightFile;

      // Restore scroll position once the new document is ready
      ifr.onload = () => {
        if (loader) loader.classList.add("hidden");

        // Wait a tiny bit for the browser to calculate the new document height
        const newDoc = ifr.contentDocument || ifr.contentWindow.document;
        const newMaxScroll =
          newDoc.documentElement.scrollHeight - ifr.contentWindow.innerHeight;

        ifr.contentWindow.scrollTo(0, scrollPercent * newMaxScroll);
      };
    }
  }
}

async function fetchComments(pid) {
  const { data } = await supabaseClient
    .from("comments")
    .select("*")
    .eq("post_id", pid)
    .order("created_at", { ascending: false });
  document.getElementById("c-count").innerText =
    `${data ? data.length : 0} Comments`;
  document.getElementById("comments-list").innerHTML = (data || [])
    .map(
      (c) =>
        `<div class="comment-item"><div class="avatar-box">?</div><div class="c-content"><span class="c-user">${c.author}</span><span class="c-meta">${new Date(c.created_at).toLocaleDateString()}</span><div class="c-body">${c.content}</div></div></div>`,
    )
    .join("");
}
function showHome() {
  document.body.classList.remove("is-reading-mode");
  const brand = document.querySelector(".brand-link");
  brand.classList.remove("is-reading");
  brand.removeAttribute("title");
  document.getElementById("main-ui").classList.remove("hidden");
  document.getElementById("post-view").classList.add("hidden");
  currentActivePost = null;
}
init();
