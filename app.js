const form = document.getElementById("lineage-form");
const ancestralName = document.getElementById("ancestral-name");
const tribeValue = document.getElementById("tribe-value");
const guideValue = document.getElementById("guide-value");
const traitsRow = document.getElementById("traits-row");
const dailyOutput = document.getElementById("daily-output");
const unlockButton = document.getElementById("unlock-button");
const copySummary = document.getElementById("copy-summary");
const refreshDaily = document.getElementById("refresh-daily");

const tribeLore = {
  Zulu: {
    guide: "The Lion, symbolizing courage and leadership.",
    strengths: ["Bravery", "Community", "Ritual"],
    nameStyle: "Ngwana",
  },
  Xhosa: {
    guide: "The Crane, symbolizing clarity and patience.",
    strengths: ["Storytelling", "Patience", "Wisdom"],
    nameStyle: "Nqana",
  },
  Yoruba: {
    guide: "The Drum, symbolizing creativity and resilience.",
    strengths: ["Creativity", "Resilience", "Artistry"],
    nameStyle: "Ade",
  },
  Ashanti: {
    guide: "The Stool, symbolizing regal presence and honor.",
    strengths: ["Strategy", "Honor", "Leadership"],
    nameStyle: "Nana",
  },
  Hausa: {
    guide: "The Desert Wind, symbolizing discernment.",
    strengths: ["Discernment", "Trade", "Poise"],
    nameStyle: "Amina",
  },
  Shona: {
    guide: "The Mbira, symbolizing harmony and insight.",
    strengths: ["Adaptability", "Harmony", "Insight"],
    nameStyle: "Tariro",
  },
  Maasai: {
    guide: "The Giraffe, symbolizing grace and foresight.",
    strengths: ["Guardianship", "Courage", "Purpose"],
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

function buildChips(list) {
  traitsRow.innerHTML = list.map((trait) => `<span class="chip">${trait}</span>`).join("");
}

function updateDaily(seed) {
  dailyOutput.textContent = dailyThemes[seed];
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const firstName = data.get("firstName").trim();
  const lastName = data.get("lastName").trim();
  const birthTime = data.get("birthTime");
  const tribe = data.get("tribe");

  if (!tribeLore[tribe]) return;

  const profile = tribeLore[tribe];
  const seed = pickByTime(birthTime);
  const fullName = `${firstName} ${lastName}`.trim();

  ancestralName.textContent = `${profile.nameStyle} ${fullName}`;
  tribeValue.textContent = tribe;
  guideValue.textContent = profile.guide;
  buildChips(profile.strengths);
  updateDaily(seed);

  unlockButton.onclick = () => {
    guideValue.textContent = `${profile.guide} Full ancestral profile unlocked.`;
  };

  copySummary.onclick = async () => {
    const summary = `${fullName} · ${tribe} lineage · ${profile.guide}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary);
      copySummary.textContent = "Copied";
      setTimeout(() => {
        copySummary.textContent = "Copy preview";
      }, 1500);
    } else {
      window.prompt("Copy preview:", summary);
    }
  };
});

refreshDaily.addEventListener("click", () => {
  const random = Math.floor(Math.random() * dailyThemes.length);
  updateDaily(random);
});
