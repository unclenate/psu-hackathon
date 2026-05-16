// web/public/app.js
// Shared client script. Handles both:
//   - the capture page (presence of #text + #submit elements)
//   - the public share page (presence of pre-injected globals CARD + TASKS)

const $ = (sel) => document.querySelector(sel);

const SAMPLE = {
  text:
    "Finally got the webhook working after fighting with the API headers for three hours, ready for staging.",
  caption:
    "Screenshot of a 401 Unauthorized response in a terminal, then a passing curl response in the next pane.",
};

let currentCardId = null;

function isCapturePage() { return !!document.getElementById("submit"); }
function isProofPage()   { return typeof window.CARD !== "undefined" && window.CARD; }

// ---------- shared renderers ----------

function renderProofCard(card) {
  const tags = (card.tech_tags || [])
    .map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`)
    .join("");
  const timeStat =
    card.time_to_resolution_minutes != null
      ? `<div>Time<strong>${formatMinutes(card.time_to_resolution_minutes)}</strong></div>`
      : "";
  const impactStat = card.impact_metric
    ? `<div>Impact<strong>${escapeHtml(card.impact_metric)}</strong></div>`
    : "";
  return `
    <div class="banner theme-${escapeAttr(card.visual_theme)}">
      <div class="meta-row">
        <span class="category-pill">${escapeHtml(card.category)}</span>
        <span>${escapeHtml(card.visual_theme)}</span>
      </div>
      <h3>${escapeHtml(card.title)}</h3>
      <p class="summary">${escapeHtml(card.summary)}</p>
    </div>
    <div class="body">
      <p class="narrative">${escapeHtml(card.narrative)}</p>
      ${(timeStat || impactStat) ? `<div class="stats">${timeStat}${impactStat}</div>` : ""}
      ${tags ? `<div class="tags">${tags}</div>` : ""}
    </div>
  `;
}

function renderAdminTasks(tasks) {
  const inner =
    !tasks || tasks.length === 0
      ? `<p class="empty">No admin tasks extracted from this capture.</p>`
      : `<ul class="task-list">${tasks.map((t) => `
          <li>
            <span class="status-pill ${escapeAttr(t.status)}">${escapeHtml(t.status)}</span>
            <span>${escapeHtml(t.title)}</span>
          </li>`).join("")}</ul>`;
  return `<h2>Admin tasks</h2>${inner}`;
}

// ---------- capture page ----------

async function initCapture() {
  try {
    const h = await fetch("/health").then((r) => r.json());
    $("#provider-pill").textContent = `provider: ${h.provider}`;
  } catch {
    $("#provider-pill").textContent = "provider: ?";
  }
  $("#sample").addEventListener("click", () => {
    $("#text").value = SAMPLE.text;
    $("#caption").value = SAMPLE.caption;
  });
  $("#submit").addEventListener("click", onSubmit);
  $("#share").addEventListener("click", onShare);
}

function setStatus(msg, cls = "") {
  const el = $("#status");
  el.textContent = msg;
  el.className = `status ${cls}`;
  el.classList.toggle("hidden", !msg);
}

async function onSubmit() {
  const text = $("#text").value.trim();
  const caption = $("#caption").value.trim();
  if (!text) {
    setStatus("Need at least a few words about what just happened.", "err");
    return;
  }
  $("#submit").disabled = true;
  setStatus("Processing…");
  const t0 = performance.now();
  try {
    const res = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, image_caption: caption }),
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus(`Provider error: ${json.error}${json.detail ? " — " + json.detail : ""}`, "err");
      return;
    }
    const elapsed = Math.round(performance.now() - t0);
    setStatus(`✓ Generated in ${elapsed}ms via ${json.provider}`, "ok");
    currentCardId = json.id;
    $("#proof").innerHTML = renderProofCard(json.output.proof_card);
    $("#admin").innerHTML = renderAdminTasks(json.output.admin_tasks);
    $("#result").classList.remove("hidden");
    const shareUrl = $("#share-url");
    shareUrl.textContent = "";
    shareUrl.removeAttribute("href");
    $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    setStatus(`Network error: ${e.message}`, "err");
  } finally {
    $("#submit").disabled = false;
  }
}

async function onShare() {
  if (!currentCardId) return;
  $("#share").disabled = true;
  try {
    const res = await fetch(`/api/share/${currentCardId}`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setStatus(`Share failed: ${json.error}`, "err");
      return;
    }
    const shareUrl = $("#share-url");
    shareUrl.textContent = json.url;
    shareUrl.href = json.url;
    try {
      await navigator.clipboard.writeText(json.url);
      setStatus("✓ Public link copied to clipboard", "ok");
    } catch {
      setStatus("✓ Public link generated", "ok");
    }
  } finally {
    $("#share").disabled = false;
  }
}

// ---------- proof share page ----------

function initProof() {
  $("#proof").innerHTML = renderProofCard(window.CARD);
  $("#admin").innerHTML = renderAdminTasks(window.TASKS);
}

// ---------- utils ----------

function formatMinutes(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) {
  return String(s).replace(/[^a-z0-9_-]/gi, "");
}

// ---------- bootstrap ----------

if (isProofPage()) initProof();
else if (isCapturePage()) initCapture();
