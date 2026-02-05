const form = document.getElementById("lineage-form");
const jumpButton = document.getElementById("jump-to-form");

function saveLastProfile(profile) {
  try {
    localStorage.setItem("aa_last_profile", JSON.stringify(profile));
  } catch (error) {
    // Ignore storage failures (private mode, disabled storage, etc.).
  }
}

function loadLastProfile() {
  try {
    const raw = localStorage.getItem("aa_last_profile");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

if (jumpButton) {
  jumpButton.addEventListener("click", () => {
    document.getElementById("form").scrollIntoView({ behavior: "smooth" });
  });
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const params = new URLSearchParams();
    const profile = {
      firstName: data.get("firstName").trim(),
      lastName: data.get("lastName").trim(),
      birthTime: data.get("birthTime"),
      tribe: data.get("tribe"),
    };
    params.set("firstName", profile.firstName);
    params.set("lastName", profile.lastName);
    params.set("birthTime", profile.birthTime);
    params.set("tribe", profile.tribe);
    saveLastProfile(profile);
    window.location.href = `results.html?${params.toString()}`;
  });
}

const previewName = document.getElementById("profile-name");
const previewSummary = document.getElementById("profile-summary");
const statTribe = document.getElementById("stat-tribe");
const statStrength = document.getElementById("stat-strength");
const statGuide = document.getElementById("stat-guide");
const statScore = document.getElementById("stat-score");
const traitsRow = document.getElementById("traits-row");
const motifsRow = document.getElementById("motifs-row");
const dailyOutput = document.getElementById("daily-output");
const refreshDaily = document.getElementById("refresh-guidance");
const unlockCta = document.getElementById("unlock-cta");
const copySummary = document.getElementById("copy-summary");
const progressLabel = document.getElementById("progress-label");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");
const progressHint = document.getElementById("progress-hint");
const lockPill = document.getElementById("lock-pill");
const lockedBody = document.getElementById("locked-body");
const downloadCard = document.getElementById("download-card");

const tribeLore = {
  Zulu: {
    guide: "The Lion — courage & leadership",
    strengths: ["Bravery", "Leadership", "Loyalty", "Discipline", "Protection"],
    motifs: ["Lion", "Drum", "River", "Shield", "Thunder"],
    nameStyle: "Ngwana",
  },
  Xhosa: {
    guide: "The Crane — clarity & patience",
    strengths: ["Storytelling", "Patience", "Clarity", "Strategy", "Spirituality"],
    motifs: ["Crane", "Mist", "Calabash", "Blue Bead", "Coast Wind"],
    nameStyle: "Nqana",
  },
  Yoruba: {
    guide: "The Drum — creativity & resilience",
    strengths: ["Creativity", "Resilience", "Charisma", "Ingenuity", "Ritual Craft"],
    motifs: ["Drum", "Bronze", "Palm", "Mask", "Firelight"],
    nameStyle: "Ade",
  },
  Ashanti: {
    guide: "The Stool — honor & legacy",
    strengths: ["Strategy", "Honor", "Regality", "Community", "Wisdom"],
    motifs: ["Gold", "Kente", "Forest", "Stool", "Bell"],
    nameStyle: "Nana",
  },
  Hausa: {
    guide: "The Desert Wind — discernment & focus",
    strengths: ["Discernment", "Trade", "Poise", "Adaptability", "Focus"],
    motifs: ["Wind", "Indigo", "Market", "Sunstone", "Compass"],
    nameStyle: "Amina",
  },
  Shona: {
    guide: "The Mbira — harmony & insight",
    strengths: ["Adaptability", "Harmony", "Insight", "Healing", "Groundedness"],
    motifs: ["Mbira", "Granite", "Rainbird", "Dawn", "Clay"],
    nameStyle: "Tariro",
  },
  Maasai: {
    guide: "The Giraffe — grace & foresight",
    strengths: ["Guardianship", "Courage", "Purpose", "Integrity", "Presence"],
    motifs: ["Giraffe", "Ochre", "Acacia", "Spear", "Horizon"],
    nameStyle: "Naserian",
  },
};

const dailyThemes = [
  "Today, honor the first teacher in your life.",
  "Listen for the quiet advice hidden in routine.",
  "Your lineage grows through steady steps.",
  "Speak one truth you have been carrying.",
  "Choose collaboration over haste.",
  "Return to a place that feels like home.",
  "Let gratitude lead your decisions today.",
];

function pickByTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60 + minutes) % dailyThemes.length;
}

function hashString(input) {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }
  return hash >>> 0;
}

function profileKeyFor({ firstName, lastName, birthTime, tribe }) {
  return `${firstName}|${lastName}|${birthTime}|${tribe}`.toLowerCase();
}

function isUnlocked(profileKey) {
  try {
    return localStorage.getItem(`aa_unlocked_${profileKey}`) === "1";
  } catch {
    return false;
  }
}

function setUnlocked(profileKey) {
  try {
    localStorage.setItem(`aa_unlocked_${profileKey}`, "1");
  } catch {
    // Ignore storage failures.
  }
}

function buildChips(target, list) {
  if (!target) return;
  target.innerHTML = list.map((item) => `<span class="chip">${item}</span>`).join("");
}

function updateDaily(seed) {
  if (dailyOutput) {
    dailyOutput.textContent = dailyThemes[seed];
  }
}

function setProgress({ label, percent, hint }) {
  if (progressLabel) progressLabel.textContent = label;
  if (progressPercent) progressPercent.textContent = `${percent}%`;
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressHint) progressHint.textContent = hint;
}

function setLockState({ unlocked }) {
  if (!lockPill) return;
  lockPill.textContent = unlocked ? "Unlocked" : "Locked";
  lockPill.classList.toggle("unlocked", unlocked);
}

function createShareSvg({ fullName, tribe, score, guide, traits }) {
  const escape = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const traitsLine = traits.slice(0, 5).join(" · ");
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#EAF7FF"/>
        <stop offset="55%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="#E6FFF1"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#64D26F"/>
        <stop offset="100%" stop-color="#36B24F"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#25302f" flood-opacity="0.18"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <g filter="url(#shadow)">
      <rect x="70" y="70" width="1060" height="490" rx="44" fill="#ffffff"/>
      <rect x="70" y="70" width="1060" height="490" rx="44" fill="none" stroke="#64D26F" stroke-opacity="0.25" stroke-width="6"/>
    </g>
    <rect x="120" y="120" width="64" height="64" rx="20" fill=\"url(#accent)\"/>
    <text x="152" y="162" text-anchor="middle" font-family="Manrope, sans-serif" font-size="26" font-weight="800" fill=\"#ffffff\">AA</text>

    <text x="210" y="160" font-family="Manrope, sans-serif" font-size="20" letter-spacing="6" fill=\"#5f6e6b\">AFRICA ANCESTRY</text>
    <text x="120" y="245" font-family="Baloo 2, system-ui, sans-serif" font-size="64" font-weight="700" fill=\"#25302f\">${escape(
      fullName
    )}</text>
    <text x="120" y="305" font-family="Manrope, sans-serif" font-size="28" fill=\"#5f6e6b\">${escape(
      tribe
    )} · Heritage score ${escape(String(score))}%</text>
    <text x="120" y="365" font-family="Manrope, sans-serif" font-size="26" fill=\"#5f6e6b\">${escape(
      guide
    )}</text>
    <text x="120" y="435" font-family="Manrope, sans-serif" font-size="22" fill=\"#5f6e6b\">Traits: ${escape(
      traitsLine
    )}</text>
    <text x="120" y="505" font-family="Manrope, sans-serif" font-size="18" fill=\"#5f6e6b\">africaancestry.org</text>
  </svg>
  `.trim();
}

function downloadSvg(filename, svgText) {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderLockedBody({ unlocked, fullName, tribe, profile, birthTime, score, dailyTheme }) {
  if (!lockedBody) return;
  lockedBody.innerHTML = "";

  if (!unlocked) {
    const p = document.createElement("p");
    p.className = "story-body";
    p.textContent =
      "Unlock to reveal your full ancestral narrative, deeper traits, and a ritual prompt built around your birth time.";
    lockedBody.appendChild(p);

    const ul = document.createElement("ul");
    ul.className = "locked-list";
    ["Lineage story chapter", "Expanded trait map", "Ritual prompt + daily rhythm"].forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    lockedBody.appendChild(ul);
    return;
  }

  const p1 = document.createElement("p");
  p1.className = "story-body";
  p1.textContent = `${fullName}, your lineage points to ${tribe}. This is your full ancestral profile story.`;
  lockedBody.appendChild(p1);

  const p2 = document.createElement("p");
  p2.className = "story-body";
  p2.textContent = `Your spirit guide is ${profile.guide}. Your heritage score is ${score}%.`;
  lockedBody.appendChild(p2);

  const p3 = document.createElement("p");
  p3.className = "story-body";
  p3.textContent = `Ritual prompt: At ${birthTime}, take 60 seconds in silence, then speak one sentence of gratitude.`;
  lockedBody.appendChild(p3);

  const p4 = document.createElement("p");
  p4.className = "story-body";
  p4.textContent = `Daily rhythm: ${dailyTheme}`;
  lockedBody.appendChild(p4);
}

function hydrateResults() {
  if (!previewName) return;
  const params = new URLSearchParams(window.location.search);
  const stored = loadLastProfile();
  const firstName = params.get("firstName") || stored?.firstName || "";
  const lastName = params.get("lastName") || stored?.lastName || "";
  const birthTime = params.get("birthTime") || stored?.birthTime || "06:00";
  const tribe = params.get("tribe") || stored?.tribe || "Zulu";
  const profile = tribeLore[tribe] || tribeLore.Zulu;
  const fullName = `${firstName} ${lastName}`.trim() || "Your profile";
  const key = profileKeyFor({ firstName, lastName, birthTime, tribe });
  const hash = hashString(key);
  const seed = hash % dailyThemes.length;
  let currentDailyIndex = seed;
  const score = 70 + (hash % 30);
  const strengthIndex = hash % profile.strengths.length;
  const rotatedTraits = profile.strengths
    .slice(strengthIndex)
    .concat(profile.strengths.slice(0, strengthIndex));
  const rotatedMotifs = profile.motifs
    .slice(strengthIndex % profile.motifs.length)
    .concat(profile.motifs.slice(0, strengthIndex % profile.motifs.length));
  let unlocked = isUnlocked(key);

  previewName.textContent = `${profile.nameStyle} ${fullName}`;
  previewSummary.textContent = `${fullName}, your lineage points to ${tribe}.`;
  statTribe.textContent = tribe;
  statStrength.textContent = rotatedTraits[0];
  statGuide.textContent = profile.guide;
  statScore.textContent = `${score}%`;
  buildChips(traitsRow, rotatedTraits);
  buildChips(motifsRow, rotatedMotifs);
  updateDaily(seed);
  setLockState({ unlocked });
  setProgress({
    label: unlocked ? "Unlocked" : "Preview",
    percent: unlocked ? 100 : 40,
    hint: unlocked ? "Full profile unlocked. You're all set." : "Unlock to reveal the full profile story.",
  });
  renderLockedBody({
    unlocked,
    fullName,
    tribe,
    profile,
    birthTime,
    score,
    dailyTheme: dailyThemes[currentDailyIndex],
  });

  if (refreshDaily) {
    refreshDaily.addEventListener("click", () => {
      const random = Math.floor(Math.random() * dailyThemes.length);
      currentDailyIndex = random;
      updateDaily(random);
      if (unlocked) {
        renderLockedBody({
          unlocked,
          fullName,
          tribe,
          profile,
          birthTime,
          score,
          dailyTheme: dailyThemes[random],
        });
      }
    });
  }

  if (unlockCta) {
    unlockCta.addEventListener("click", () => {
      setUnlocked(key);
      unlocked = true;
      setLockState({ unlocked: true });
      setProgress({
        label: "Unlocked",
        percent: 100,
        hint: "Full profile unlocked. You're all set.",
      });
      previewSummary.textContent = `${fullName}, your full ancestral profile is unlocked.`;
      renderLockedBody({
        unlocked: true,
        fullName,
        tribe,
        profile,
        birthTime,
        score,
        dailyTheme: dailyThemes[currentDailyIndex],
      });
    });
  }

  if (copySummary) {
    copySummary.addEventListener("click", async () => {
      const summary = `My Africa Ancestry wrap: ${fullName} · ${tribe} · ${profile.guide} · Heritage score ${score}%. africaancestry.org`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
        copySummary.textContent = "Copied";
        setTimeout(() => {
          copySummary.textContent = "Copy preview";
        }, 1500);
      } else {
        window.prompt("Copy preview:", summary);
      }
    });
  }

  if (downloadCard) {
    downloadCard.addEventListener("click", () => {
      const svg = createShareSvg({
        fullName,
        tribe,
        score,
        guide: profile.guide,
        traits: rotatedTraits,
      });
      downloadSvg("africa-ancestry-card.svg", svg);
    });
  }
}

hydrateResults();
