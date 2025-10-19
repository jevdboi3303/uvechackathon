// ---- injectPanel.js ----
const CSS_TEXT = `
.wn-root{position:fixed;top:16px;right:16px;width:320px;max-height:80vh;background:#fff;
    border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);
    font:14px/1.4 ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;padding:8px 8px 12px;
    color:#111;z-index:2147483647}
    .wn-header{display:flex;align-items:center;gap:8px;margin:4px 4px 8px}
    .wn-title{font-weight:600;flex:1}
    .wn-close,.wn-refresh{border:1px solid #e5e7eb;background:#f9fafb;border-radius:8px;
        cursor:pointer;padding:2px 8px}
        .wn-list{overflow:auto;max-height:65vh;padding:0 4px 4px}
        .wn-card{border:1px solid #eef2f7;border-radius:10px;padding:8px;margin:8px 0;background:#fafbfc}
        .wn-sel{font-style:italic;color:#374151;margin-bottom:4px}
        .wn-note{margin:4px 0}
        .wn-meta{font-size:12px;color:#6b7280}
`;

(function () {
  if (document.getElementById("wn-panel")) return;

  const host = document.createElement("div");
  host.id = "wn-panel";
  const shadow = host.attachShadow({ mode: "open" });

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <style>${CSS_TEXT}
      .wn-form-container{padding:4px 8px;border-bottom:1px solid #e5e7eb;margin-bottom:8px;}
      .wn-form-container input{width:100%;box-sizing:border-box;margin-bottom:8px;padding:6px;border-radius:6px;border:1px solid #ccc;}
      .wn-form-container button{width:100%;padding:6px;border-radius:6px;border:1px solid #999;background:#f0f0f0;cursor:pointer;}
      .wn-form-toggle{font-size:11px;text-align:center;margin-top:8px;cursor:pointer;color:#007bff;}
      .wn-auth-error{font-size:11px;color:red;margin-bottom:8px;text-align:center;}
    </style>
    <div class="wn-root">
      <div class="wn-header">
        <div class="wn-title">Web Notes</div>
        <button class="wn-refresh" title="Refresh">⟳</button>
        <button class="wn-close" title="Hide">×</button>
      </div>
      
      <div id="wn-auth-container">
        <div id="wn-user-info" style="display:none;padding:4px 8px;border-bottom:1px solid #e5e7eb;margin-bottom:8px;">
          <span id="wn-user-email" style="font-size:12px;color:#333;"></span>
          <button id="wn-logout-btn" style="float:right;font-size:11px;cursor:pointer;border:none;background:transparent;color:#555;">Sign out</button>
        </div>

        <div id="wn-signin-view" class="wn-form-container">
          <div id="wn-signin-error" class="wn-auth-error"></div>
          <input type="email" id="wn-signin-email" placeholder="Email">
          <input type="password" id="wn-signin-password" placeholder="Password">
          <button id="wn-signin-btn">Sign In</button>
          <div class="wn-form-toggle" id="wn-show-signup">Need an account? Sign Up</div>
        </div>

        <div id="wn-signup-view" class="wn-form-container" style="display:none;">
          <div id="wn-signup-error" class="wn-auth-error"></div>
          <input type="text" id="wn-signup-username" placeholder="Username (public)">
          <input type="email" id="wn-signup-email" placeholder="Email">
          <input type="password" id="wn-signup-password" placeholder="Password">
          <button id="wn-signup-btn">Sign Up</button>
          <div class="wn-form-toggle" id="wn-show-signin">Have an account? Sign In</div>
        </div>
      </div>
      
      <div class="wn-list">Loading…</div>
    </div>
  `;
  shadow.appendChild(wrapper);
  document.documentElement.appendChild(host);

  // Auth Form Toggle
  shadow.querySelector("#wn-show-signup").addEventListener("click", () => {
    shadow.querySelector("#wn-signin-view").style.display = "none";
    shadow.querySelector("#wn-signup-view").style.display = "block";
  });
  shadow.querySelector("#wn-show-signin").addEventListener("click", () => {
    shadow.querySelector("#wn-signup-view").style.display = "none";
    shadow.querySelector("#wn-signin-view").style.display = "block";
  });

  // Sign In
  shadow.querySelector("#wn-signin-btn").addEventListener("click", async () => {
    const email = shadow.querySelector("#wn-signin-email").value.trim();
    const password = shadow.querySelector("#wn-signin-password").value.trim();
    const errorDiv = shadow.querySelector("#wn-signin-error");
    errorDiv.textContent = "";
    try {
      const { data } = await window.supabase.auth.signInWithPassword({ email, password });
      if (!data?.user) throw new Error("Invalid credentials");
      currentUser = data.user;
      updateAuthUI();
    } catch (err) {
      errorDiv.textContent = err.message;
    }
  });

  // Sign Up
  shadow.querySelector("#wn-signup-btn").addEventListener("click", async () => {
    const username = shadow.querySelector("#wn-signup-username").value.trim();
    const email = shadow.querySelector("#wn-signup-email").value.trim();
    const password = shadow.querySelector("#wn-signup-password").value.trim();
    const errorDiv = shadow.querySelector("#wn-signup-error");
    errorDiv.textContent = "";
    try {
      await signUpNewUser(email, password, username);
    } catch (err) {
      errorDiv.textContent = err.message;
    }
  });

  // Sign Out
  shadow.querySelector("#wn-logout-btn").addEventListener("click", async () => {
    await window.supabase.auth.signOut();
    currentUser = null;
    updateAuthUI();
  });

  // Close & Refresh
  shadow.querySelector(".wn-close").addEventListener("click", () => { host.style.display = "none"; });
  shadow.querySelector(".wn-refresh").addEventListener("click", () => { renderSidebar(); });
})();
