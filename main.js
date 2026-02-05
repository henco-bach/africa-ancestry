const form = document.getElementById("lineage-form");
const jumpButton = document.getElementById("jump-to-form");

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
    params.set("firstName", data.get("firstName").trim());
    params.set("lastName", data.get("lastName").trim());
    params.set("birthTime", data.get("birthTime"));
    params.set("tribe", data.get("tribe"));
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

const tribeLore = {
  Zulu: {
    guide: "The Lion",
    strengths: ["Bravery", "Community", "Ritual"],
    motifs: ["Lion", "Drum", "River"],
    nameStyle: "Ngwana",
  },
  Xhosa: {
    guide: "The Crane",
    strengths: ["Storytelling", "Patience", "Wisdom"],
    motifs: ["Crane", "Mist", "Calabash"],
    nameStyle: "Nqana",
  },
  Yoruba: {
    guide: "The Drum",
    strengths: ["Creativity", "Resilience", "Artistry"],
    motifs: ["Drum", "Bronze", "Palm"],
    nameStyle: "Ade",
  },
  Ashanti: {
    guide: "The Stool",
    strengths: ["Strategy", "Honor", "Leadership"],
    motifs: ["Gold", "Kente", "Forest"],
    nameStyle: "Nana",
  },
  Hausa: {
    guide: "The Desert Wind",
    strengths: ["Discernment", "Trade", "Poise"],
    motifs: ["Wind", "Indigo", "Market"],
    nameStyle: "Amina",
  },
  Shona: {
    guide: "The Mbira",
    strengths: ["Adaptability", "Harmony", "Insight"],
    motifs: ["Mbira", "Granite", "Rainbird"],
    nameStyle: "Tariro",
  },
  Maasai: {
    guide: "The Giraffe",
    strengths: ["Guardianship", "Courage", "Purpose"],
    motifs: ["Giraffe", "Ochre", "Acacia"],
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

function buildChips(target, list) {
  target.innerHTML = list.map((item) => `<span class="chip">${item}</span>`).join("");
}

function updateDaily(seed) {
  if (dailyOutput) {
    dailyOutput.textContent = dailyThemes[seed];
  }
}

function hydrateResults() {
  if (!previewName) return;
  const params = new URLSearchParams(window.location.search);
  const firstName = params.get("firstName") || "";
  const lastName = params.get("lastName") || "";
  const birthTime = params.get("birthTime") || "06:00";
  const tribe = params.get("tribe") || "Zulu";
  const profile = tribeLore[tribe] || tribeLore.Zulu;
  const fullName = `${firstName} ${lastName}`.trim() || "Your profile";
  const seed = pickByTime(birthTime);

  previewName.textContent = `${profile.nameStyle} ${fullName}`;
  previewSummary.textContent = `${fullName}, your lineage points to ${tribe}.`;
  statTribe.textContent = tribe;
  statStrength.textContent = profile.strengths[0];
  statGuide.textContent = profile.guide;
  statScore.textContent = `${72 + seed}%`;
  buildChips(traitsRow, profile.strengths);
  buildChips(motifsRow, profile.motifs);
  updateDaily(seed);

  if (refreshDaily) {
    refreshDaily.addEventListener("click", () => {
      const random = Math.floor(Math.random() * dailyThemes.length);
      updateDaily(random);
    });
  }

  if (unlockCta) {
    unlockCta.addEventListener("click", () => {
      previewSummary.textContent = `${fullName}, your full ancestral profile is unlocked.`;
    });
  }

  if (copySummary) {
    copySummary.addEventListener("click", async () => {
      const summary = `${fullName} · ${tribe} · ${profile.guide} · Heritage score ${72 + seed}%`;
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
}

hydrateResults();
