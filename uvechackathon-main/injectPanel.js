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
    .wn-add-btn{background:#111;color:#fff;border:none;border-radius:6px;
        cursor:pointer;padding:2px 10px;font-weight:600;font-size: 16px;line-height: 1.2;}
    .wn-close,.wn-refresh{border:1px solid #e5e7eb;background:#f9fafb;border-radius:8px;
        cursor:pointer;padding:2px 8px}
        .wn-list{overflow:auto;max-height:65vh;padding:0 4px 4px}
        .wn-card{border:1px solid #eef2f7;border-radius:10px;padding:8px;margin:8px 0;background:#fafbfc}
        .wn-sel{
            font-style:italic;color:#374151;margin-bottom:4px;
            word-break: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        .wn-note{margin:4px 0}
        .wn-meta{font-size:12px;color:#6b7280; margin-bottom: 8px;}
        
        /* --- ADD THESE NEW STYLES --- */
        .wn-card-footer {
            display: flex;
            align-items: center;
            gap: 6px;
            border-top: 1px solid #eef2f7;
            padding-top: 8px;
            margin-top: 8px;
        }
        .wn-like-btn {
            background: none;
            border: 1px solid #ccc;
            border-radius: 6px;
            padding: 2px 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .wn-like-btn:hover {
            background: #f0f0f0;
        }
        .wn-like-btn:disabled {
            background: #e0f0ff;
            cursor: not-allowed;
            opacity: 0.7;
        }
        .wn-like-count {
            font-size: 13px;
            color: #555;
            font-weight: 500;
        }
        /* --- END NEW STYLES --- */
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
            <button class="wn-add-btn" id="wn-add-note" title="Add Note">+</button>
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
                document.dispatchEvent(new CustomEvent("wn-close"));
            });

            shadow.querySelector(".wn-refresh").addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent("wn-refresh"));
            });

            shadow.querySelector("#wn-add-note").addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent("wn-add-note"));
            });
        })();