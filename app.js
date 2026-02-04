const form = document.getElementById("lineage-form");
const profileOutput = document.getElementById("profile-output");
const lineageList = document.getElementById("lineage-list");
const dailyOutput = document.getElementById("daily-output");

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
    strengths: ["adaptability", "ancestral insight", "harmonizing"] ,
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

  profileOutput.innerHTML = `
    <p><strong>${firstName} ${lastName}</strong>, you carry the ${tribe} lineage of ${profile.region}.</p>
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
});
