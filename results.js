/* ─────────────────────────────────────────────────────────────────────────────
   Africa Ancestry — Results Page
   Handles: preview rendering, auth modal, Yoco checkout, entitlement polling,
            full report rendering, PDF download.
───────────────────────────────────────────────────────────────────────────── */

const API_BASE =
  window.AA_BACKEND_URL ||
  localStorage.getItem("aa_api_base") ||
  "http://localhost:3000";

const PREVIEW_KEY = "aa_preview";
const INPUT_KEY = "aa_ancestry_input";
const TOKEN_KEY = "aa_token";
const EMAIL_KEY = "aa_user_email";

// ── DOM references ────────────────────────────────────────────────────────────
const profileName = document.getElementById("profile-name");
const profileSummary = document.getElementById("profile-summary");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");
const progressHint = document.getElementById("progress-hint");
const statTribe = document.getElementById("stat-tribe");
const statStrength = document.getElementById("stat-strength");
const statGuide = document.getElementById("stat-guide");
const statScore = document.getElementById("stat-score");
const traitsRow = document.getElementById("traits-row");
const motifsRow = document.getElementById("motifs-row");
const dailyOutput = document.getElementById("daily-output");

const ctaPanel = document.getElementById("cta-panel");
const lockedSection = document.getElementById("locked-section");
const unlockCta = document.getElementById("unlock-cta");
const copySummary = document.getElementById("copy-summary");

const unlockLoading = document.getElementById("unlock-loading");
const unlockStatus = document.getElementById("unlock-status");

const authModal = document.getElementById("auth-modal");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authError = document.getElementById("auth-error");
const modalClose = document.getElementById("modal-close");

const fullReport = document.getElementById("full-report");
const narrativeSections = document.getElementById("narrative-sections");
const sourcesWrap = document.getElementById("sources-wrap");
const sourcesList = document.getElementById("sources-list");
const downloadPdfBtn = document.getElementById("download-pdf");
const emailNotice = document.getElementById("email-notice");

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtConfidence(score) {
  return `${(score * 100).toFixed(0)}%`;
}

function makeChip(text) {
  const span = document.createElement("span");
  span.className = "chip";
  span.textContent = text;
  return span;
}

function apiBearerHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

function setUnlockLoading(visible, message) {
  if (unlockLoading) unlockLoading.hidden = !visible;
  if (unlockStatus && message) unlockStatus.textContent = message;
  if (ctaPanel) ctaPanel.hidden = visible;
  if (lockedSection) lockedSection.hidden = visible;
}

// ── Render preview data ───────────────────────────────────────────────────────
function renderPreview(preview) {
  const person = preview?.ancestryProfile?.person ?? {};
  const hierarchy = preview?.ancestryProfile?.hierarchy ?? {};
  const confidence = preview?.confidenceBreakdown ?? {};
  const sections = preview?.narrativeSections ?? [];

  const fullName = person.fullName || "Your Profile";
  const family = hierarchy.family?.display_name || hierarchy.family?.name || "—";
  const kingdom = hierarchy.kingdomNation?.display_name || hierarchy.kingdomNation?.name || "—";
  const clan = hierarchy.clanLineage?.display_name || hierarchy.clanLineage?.name || "Untraced";
  const composite = confidence.composite || 0;

  if (profileName) profileName.textContent = fullName;
  if (profileSummary) {
    const familyText = family !== "—" ? ` — ${family} lineage` : "";
    profileSummary.textContent = `Your ancestral preview is ready${familyText}.`;
  }

  const pct = Math.round(composite * 100);
  if (progressPercent) progressPercent.textContent = `${pct}%`;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressHint) progressHint.textContent = "Unlock to reveal your full ancestry story.";

  if (statTribe) statTribe.textContent = kingdom;
  if (statStrength) statStrength.textContent = fmtConfidence(confidence.family || composite);
  if (statGuide) statGuide.textContent = clan;
  if (statScore) statScore.textContent = fmtConfidence(composite);

  // Ethno-linguistic chips
  if (traitsRow) {
    traitsRow.innerHTML = "";
    [family, kingdom].filter((v) => v && v !== "—").forEach((label) => {
      traitsRow.appendChild(makeChip(label));
    });
  }

  // Sections summary chips for motifs row (will be populated with regions on full unlock)
  if (motifsRow) {
    motifsRow.innerHTML = "";
    const lang = preview?.ancestryProfile?.input?.language;
    if (lang) motifsRow.appendChild(makeChip(lang));
  }

  // Preview narrative (first 1-2 sections)
  if (dailyOutput && sections.length > 0) {
    dailyOutput.textContent = sections[0].body;
  }
}

// ── Render full report ────────────────────────────────────────────────────────
function renderFullReport(profile) {
  const sections = profile?.narrativeSections ?? [];
  const sources = profile?.ancestryProfile?.sources ?? [];
  const regions = profile?.ancestryProfile?.regions ?? [];
  const person = profile?.ancestryProfile?.person ?? {};
  const hierarchy = profile?.ancestryProfile?.hierarchy ?? {};
  const confidence = profile?.confidenceBreakdown ?? {};

  // Update header
  const fullName = person.fullName || "Your Profile";
  if (profileName) profileName.textContent = fullName;
  if (profileSummary) profileSummary.textContent = "Your full ancestral profile is unlocked.";

  const composite = confidence.composite || 0;
  const pct = Math.round(composite * 100);
  if (progressPercent) progressPercent.textContent = `${pct}%`;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressHint) progressHint.textContent = "Full profile unlocked.";

  // Update stats
  const kingdom = hierarchy.kingdomNation?.display_name || hierarchy.kingdomNation?.name || "—";
  const clan = hierarchy.clanLineage?.display_name || hierarchy.clanLineage?.name || "Untraced";
  if (statTribe) statTribe.textContent = kingdom;
  if (statStrength) statStrength.textContent = fmtConfidence(confidence.family || composite);
  if (statGuide) statGuide.textContent = clan;
  if (statScore) statScore.textContent = fmtConfidence(composite);

  // Update regions chips
  if (motifsRow) {
    motifsRow.innerHTML = "";
    regions.slice(0, 6).forEach((r) => {
      motifsRow.appendChild(makeChip(r.display_name || r.name));
    });
  }

  // Narrative sections
  if (narrativeSections) {
    narrativeSections.innerHTML = "";
    sections.forEach((section) => {
      const div = document.createElement("div");
      div.className = "narrative-section";
      div.innerHTML = `
        <p class="section-label">${section.title}</p>
        <p class="section-body">${section.body}</p>
        <span class="confidence-badge">Confidence: ${fmtConfidence(section.confidence)}</span>
      `;
      narrativeSections.appendChild(div);
    });
  }

  // Sources
  if (sources.length > 0 && sourcesWrap && sourcesList) {
    sourcesWrap.hidden = false;
    sourcesList.innerHTML = "";
    sources.forEach((s) => {
      const li = document.createElement("li");
      const year = s.publication_year ? ` (${s.publication_year})` : "";
      const citation = s.citation ? ` — ${s.citation}` : "";
      li.innerHTML = `<strong>${s.title}</strong> · ${s.source_type}${year}${citation}`;
      sourcesList.appendChild(li);
    });
  }

  // Show full report, hide locked
  if (ctaPanel) ctaPanel.hidden = true;
  if (lockedSection) lockedSection.hidden = true;
  if (fullReport) fullReport.hidden = false;

  // Show email notice
  if (emailNotice) emailNotice.hidden = false;
}

// ── Auth: register or login ───────────────────────────────────────────────────
async function registerOrLogin(email, password) {
  // Try register
  const regRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (regRes.ok) {
    const data = await regRes.json();
    return data.token;
  }

  if (regRes.status === 409) {
    // Already exists — try login
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      return data.token;
    }

    const err = await loginRes.json().catch(() => ({}));
    throw new Error(err.error || "Login failed. Check your password and try again.");
  }

  const err = await regRes.json().catch(() => ({}));
  throw new Error(err.error || "Registration failed. Please try again.");
}

// ── Checkout: redirect to Yoco ────────────────────────────────────────────────
async function startCheckout(token, successUrl, cancelUrl) {
  const res = await fetch(`${API_BASE}/api/payments/yoco/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ successUrl, cancelUrl })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Payment setup failed. Please try again.");
  }

  const data = await res.json();
  if (!data.redirectUrl) throw new Error("No redirect URL from payment provider.");
  return data.redirectUrl;
}

// ── Poll for entitlement ──────────────────────────────────────────────────────
async function pollEntitlement(token, maxAttempts = 20, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`${API_BASE}/api/ancestry/entitlement`, {
      headers: { authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.entitled) return true;
    }
  }
  return false;
}

// ── Fetch full profile ────────────────────────────────────────────────────────
async function fetchFullProfile(token, input) {
  const res = await fetch(`${API_BASE}/api/ancestry/profile`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load full profile.");
  }

  return res.json();
}

// ── Download PDF ──────────────────────────────────────────────────────────────
async function downloadPdf(input) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  if (downloadPdfBtn) {
    downloadPdfBtn.textContent = "Generating PDF...";
    downloadPdfBtn.classList.add("pdf-btn-loading");
  }

  try {
    const res = await fetch(`${API_BASE}/api/ancestry/pdf`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify(input)
    });

    if (!res.ok) throw new Error("PDF generation failed.");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "africa-ancestry-report.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("PDF download failed. Please try again.");
  } finally {
    if (downloadPdfBtn) {
      downloadPdfBtn.textContent = "Download PDF Certificate";
      downloadPdfBtn.classList.remove("pdf-btn-loading");
    }
  }
}

// ── Auth modal ────────────────────────────────────────────────────────────────
function showAuthModal() {
  if (authModal) authModal.hidden = false;
  if (authEmail) authEmail.focus();
}

function hideAuthModal() {
  if (authModal) authModal.hidden = true;
  if (authError) authError.textContent = "";
}

if (modalClose) {
  modalClose.addEventListener("click", hideAuthModal);
}

if (authModal) {
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) hideAuthModal();
  });
}

if (authSubmit) {
  authSubmit.addEventListener("click", async () => {
    const email = authEmail?.value.trim();
    const password = authPassword?.value;

    if (!email || !password) {
      if (authError) authError.textContent = "Please enter your email and password.";
      return;
    }
    if (password.length < 8) {
      if (authError) authError.textContent = "Password must be at least 8 characters.";
      return;
    }

    authSubmit.disabled = true;
    authSubmit.textContent = "Setting up...";
    if (authError) authError.textContent = "";

    try {
      const token = await registerOrLogin(email, password);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(EMAIL_KEY, email);

      hideAuthModal();
      setUnlockLoading(true, "Redirecting to payment...");

      const currentUrl = window.location.href.split("?")[0];
      const successUrl = `${currentUrl}?payment=success`;
      const cancelUrl = `${currentUrl}?payment=cancelled`;

      const redirectUrl = await startCheckout(token, successUrl, cancelUrl);
      window.location.href = redirectUrl;
    } catch (err) {
      if (authError) authError.textContent = err.message || "Something went wrong. Please try again.";
      authSubmit.disabled = false;
      authSubmit.textContent = "Unlock for R299";
    }
  });
}

// ── Unlock CTA ────────────────────────────────────────────────────────────────
if (unlockCta) {
  unlockCta.addEventListener("click", () => {
    showAuthModal();
  });
}

// ── Copy summary ──────────────────────────────────────────────────────────────
if (copySummary) {
  copySummary.addEventListener("click", async () => {
    const text = dailyOutput?.textContent || "";
    if (!text) return;
    await navigator.clipboard.writeText(text).catch(() => {});
    copySummary.textContent = "Copied!";
    setTimeout(() => { copySummary.textContent = "Copy preview"; }, 2000);
  });
}

// ── Download PDF button ───────────────────────────────────────────────────────
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener("click", () => {
    const input = JSON.parse(localStorage.getItem(INPUT_KEY) || "null");
    if (!input) { alert("Profile input not found. Please complete the form again."); return; }
    downloadPdf(input);
  });
}

// ── Handle payment return ─────────────────────────────────────────────────────
async function handlePaymentReturn() {
  const token = localStorage.getItem(TOKEN_KEY);
  const input = JSON.parse(localStorage.getItem(INPUT_KEY) || "null");

  if (!token || !input) {
    setUnlockLoading(false);
    return;
  }

  setUnlockLoading(true, "Verifying your payment...");

  const entitled = await pollEntitlement(token);

  if (!entitled) {
    setUnlockLoading(false);
    if (unlockCta) unlockCta.textContent = "Retry payment";
    return;
  }

  setUnlockLoading(true, "Generating your full report...");

  try {
    const profile = await fetchFullProfile(token, input);
    localStorage.setItem("aa_full_profile", JSON.stringify(profile));
    setUnlockLoading(false);
    renderFullReport(profile);
  } catch (err) {
    setUnlockLoading(false);
    alert("Failed to load full report. Please refresh the page.");
  }
}

// ── Check if already unlocked ─────────────────────────────────────────────────
async function checkAlreadyUnlocked() {
  const token = localStorage.getItem(TOKEN_KEY);
  const input = JSON.parse(localStorage.getItem(INPUT_KEY) || "null");
  if (!token || !input) return false;

  const res = await fetch(`${API_BASE}/api/ancestry/entitlement`, {
    headers: { authorization: `Bearer ${token}` }
  }).catch(() => null);

  if (!res || !res.ok) return false;
  const data = await res.json();
  if (!data.entitled) return false;

  // Load cached full profile or re-fetch
  const cached = localStorage.getItem("aa_full_profile");
  if (cached) {
    renderFullReport(JSON.parse(cached));
    return true;
  }

  try {
    const profile = await fetchFullProfile(token, input);
    localStorage.setItem("aa_full_profile", JSON.stringify(profile));
    renderFullReport(profile);
    return true;
  } catch {
    return false;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  const preview = JSON.parse(localStorage.getItem(PREVIEW_KEY) || "null");
  if (preview) renderPreview(preview);

  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get("payment");

  if (paymentStatus === "success") {
    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);
    await handlePaymentReturn();
    return;
  }

  if (paymentStatus === "cancelled") {
    window.history.replaceState({}, "", window.location.pathname);
    // No action needed — stay on preview
  }

  // Check if user already paid in a previous session
  await checkAlreadyUnlocked();
})();
