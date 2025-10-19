// ---- injectPanel.js ----
// Creates a sidebar inside a Shadow DOM to avoid CSS conflicts.

// Define CSS first
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
        .wn-highlight{background:#fff3b0;border-radius:3px;box-shadow:inset 0 0 0 1px #fde68a}
        `;

        (function () {
            if (document.getElementById("wn-panel")) return;

            const host = document.createElement("div");
            host.id = "wn-panel";
            const shadow = host.attachShadow({ mode: "open" });

            const wrapper = document.createElement("div");
            wrapper.innerHTML = `
            <style>${CSS_TEXT}</style>
            <div class="wn-root">
            <div class="wn-header">
            <div class="wn-title">Web Notes</div>
            <button class="wn-refresh" title="Refresh">↻</button>
            <button class="wn-close" title="Hide">×</button>
            </div>
            <div class="wn-list">Loading…</div>
            </div>
            `;
            shadow.appendChild(wrapper);
            document.documentElement.appendChild(host);

            // Event handling
            shadow.querySelector(".wn-close").addEventListener("click", () => {
                host.style.display = "none";
            });

            shadow.querySelector(".wn-refresh").addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent("wn-refresh"));
            });

            document.addEventListener("wn-refresh", () => {});
        })();

        // Floating “+ Note” button style (separate from shadow)
        (() => {
            const style = document.createElement("style");
            style.textContent = `
            #wn-fab{
            position:absolute;z-index:2147483647;padding:6px 10px;border-radius:999px;
            border:1px solid #e5e7eb;background:#111;color:#fff;font:13px ui-sans-serif,system-ui;
            cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.18)
            }
            `;
            document.documentElement.appendChild(style);
        })();
