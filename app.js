const form = document.getElementById("lineage-form");
const profileOutput = document.getElementById("profile-output");
const lineageList = document.getElementById("lineage-list");
const dailyOutput = document.getElementById("daily-output");
const scheduleList = document.getElementById("schedule-list");
const shareCard = document.getElementById("share-card");
const downloadCard = document.getElementById("download-card");
const copySummary = document.getElementById("copy-summary");

const tribeLore = {
  Zulu: {
    motto: "Umhlaba uyakhuluma, hamba ngokuzwakalayo.",
    region: "KwaZulu-Natal",
    strengths: ["bravery", "community leadership", "ritual precision"],
    symbols: ["lion", "storm drum", "river clay"],
  },
  Xhosa: {
    motto: "Imbali iyasibiza, siyiphendula ngentlonipho.",
    region: "Eastern Cape",
    strengths: ["storytelling", "strategic patience", "spiritual clarity"],
    symbols: ["blue bead", "early mist", "calabash"],
  },
  Yoruba: {
    motto: "Ase fun gbogbo oro, ase fun gbogbo eniyan.",
    region: "Southwestern Nigeria",
    strengths: ["creativity", "resilience", "sacred artistry"],
    symbols: ["talking drum", "bronze mask", "palm frond"],
  },
  Ashanti: {
    motto: "Nsa baako nkura adesoa.",
    region: "Ashanti Region",
    strengths: ["strategic wisdom", "regal presence", "collective honor"],
    symbols: ["golden stool", "kente weave", "forest path"],
  },
  Hausa: {
    motto: "Hankali ya fi karfi.",
    region: "Northern Nigeria",
    strengths: ["discernment", "trade mastery", "quiet power"],
    symbols: ["desert wind", "indigo dye", "market bell"],
  },
  Shona: {
    motto: "Chisarudzo chakanaka chinosimbisa mhuri.",
    region: "Zimbabwe",
    strengths: ["adaptability", "ancestral insight", "harmonizing"],
    symbols: ["mbira", "granite hill", "rainbird"],
  },
  Maasai: {
    motto: "Enkanyit, ormaa, olchani.",
    region: "Kenya & Tanzania",
    strengths: ["guardianship", "courage", "clear purpose"],
    symbols: ["red ochre", "acacia", "warrior chant"],
  },
};

const dailyThemes = [
  "The ancestors ask you to listen before you speak.",
  "Lean into the ritual of small steps today.",
  "Your name carries a promise. Keep it close.",
  "Take the long road. It will teach you.",
  "Your lineage thrives when you choose collaboration.",
  "Stillness will reveal the answer you are chasing.",
  "Be the steady drumbeat in a noisy room.",
];

const lineageMotifs = [
  "guardian of water routes",
  "keeper of sacred markets",
  "story-bearer of the hill clans",
  "weaver of intergenerational counsel",
  "healer aligned with dawn ceremonies",
  "peacekeeper of the southern plains",
  "archivist of ancestral names",
];

function pickByTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const seed = (hours * 60 + minutes) % dailyThemes.length;
  return {
    daily: dailyThemes[seed],
    motif: lineageMotifs[seed],
  };
}

function buildHighlights(name, tribe, motif) {
  return [
    `${name} carries the ${tribe} echo of the ${motif}.`,
    `Your lineage map centers on ${tribeLore[tribe].symbols[0]} energy.`,
    `Ancestral strength: ${tribeLore[tribe].strengths.join(", ")}.`,
  ];
}

function buildSchedule(seedIndex) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() + index);
    const theme = dailyThemes[(seedIndex + index) % dailyThemes.length];
    return {
      date: day.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      theme,
    };
  });
}

function buildShareCard({ name, tribe, motif, mantra }) {
  shareCard.innerHTML = `
    <p class="share-title">African Ancestry</p>
    <p class="share-name">${name}</p>
    <p class="share-tribe">${tribe} lineage · ${motif}</p>
    <p class="share-tribe">Mantra: ${mantra}</p>
  `;
}

function createShareSvg({ name, tribe, motif, mantra }) {
  const escaped = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f1b97a" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="60" y="90" font-family="Manrope, sans-serif" font-size="20" letter-spacing="6" fill="#5f5f5f">AFRICAN ANCESTRY</text>
      <text x="60" y="170" font-family="DM Serif Display, serif" font-size="54" fill="#151515">${escaped(
        name
      )}</text>
      <text x="60" y="240" font-family="Manrope, sans-serif" font-size="22" fill="#5f5f5f">${escaped(
        `${tribe} lineage · ${motif}`
      )}</text>
      <text x="60" y="300" font-family="Manrope, sans-serif" font-size="20" fill="#5f5f5f">${escaped(
        `Mantra: ${mantra}`
      )}</text>
    </svg>
  `;
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const firstName = data.get("firstName").trim();
  const lastName = data.get("lastName").trim();
  const birthTime = data.get("birthTime");
  const tribe = data.get("tribe");

  if (!tribeLore[tribe]) return;

  const { daily, motif } = pickByTime(birthTime);
  const profile = tribeLore[tribe];
  const fullName = `${firstName} ${lastName}`;

  profileOutput.innerHTML = `
    <p><strong>${fullName}</strong>, you carry the ${tribe} lineage of ${profile.region}.</p>
    <p class="spacer">Lineage mantra: “${profile.motto}”</p>
    <p>Primary strengths: ${profile.strengths.join(", ")}.</p>
    <p>Signature symbols: ${profile.symbols.join(", ")}.</p>
  `;

  const highlights = buildHighlights(firstName, tribe, motif);
  lineageList.innerHTML = highlights
    .map((line) => `<li>${line}</li>`)
    .join("");

  dailyOutput.innerHTML = `
    <p>${daily}</p>
    <p class="spacer">Ritual prompt: Light a candle or step outside at ${birthTime} to honor your timing.</p>
  `;

  const schedule = buildSchedule(dailyThemes.indexOf(daily));
  scheduleList.innerHTML = schedule
    .map(
      (item) =>
        `<li><span class="schedule-date">${item.date}</span><span class="schedule-note">${item.theme}</span></li>`
    )
    .join("");

  buildShareCard({
    name: fullName,
    tribe,
    motif,
    mantra: profile.motto,
  });

  const svgText = createShareSvg({
    name: fullName,
    tribe,
    motif,
    mantra: profile.motto,
  });

  downloadCard.onclick = () => downloadSvg("african-ancestry-card.svg", svgText);
  copySummary.onclick = async () => {
    const summary = `${fullName} · ${tribe} lineage · ${motif}. Mantra: ${profile.motto}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary);
      copySummary.textContent = "Copied";
      setTimeout(() => {
        copySummary.textContent = "Copy summary";
      }, 1500);
    } else {
      window.prompt("Copy summary:", summary);
    }
  };
});
