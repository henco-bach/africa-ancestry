const form = document.getElementById("lineage-form");
const previewOutput = document.getElementById("preview-output");
const profileOutput = document.getElementById("profile-output");
const dailyOutput = document.getElementById("daily-output");
const unlockButton = document.getElementById("unlock-button");
const copySummary = document.getElementById("copy-summary");
const scrollCta = document.getElementById("scroll-cta");

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

function buildPreview({ name, tribe, motif, region }) {
  return `
    <p><strong>${name}</strong></p>
    <p class="micro">${tribe} lineage · ${region}</p>
    <p>${name.split(" ")[0]} holds the ${tribe} echo of the ${motif}.</p>
  `;
}

function buildFullProfile({ name, tribe, profile, motif, birthTime }) {
  return `
    <p><strong>${name}</strong>, you carry the ${tribe} lineage of ${profile.region}.</p>
    <p class="micro">Lineage mantra: “${profile.motto}”</p>
    <p>Primary strengths: ${profile.strengths.join(", ")}.</p>
    <p>Signature symbols: ${profile.symbols.join(", ")}.</p>
    <p>Lineage motif: ${motif}.</p>
    <p>Ritual prompt: Step outside at ${birthTime} and speak gratitude for those before you.</p>
  `;
}

scrollCta.addEventListener("click", () => {
  document.getElementById("form-card").scrollIntoView({ behavior: "smooth" });
});

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
  const fullName = `${firstName} ${lastName}`.trim();

  previewOutput.innerHTML = buildPreview({
    name: fullName,
    tribe,
    motif,
    region: profile.region,
  });

  profileOutput.innerHTML = `
    <p class="placeholder">Purchase to unlock your complete ancestral profile.</p>
  `;

  dailyOutput.innerHTML = `
    <p>${daily}</p>
    <p class="micro">Ritual prompt: Light a candle or step outside at ${birthTime} to honor your timing.</p>
  `;

  unlockButton.onclick = () => {
    profileOutput.innerHTML = buildFullProfile({
      name: fullName,
      tribe,
      profile,
      motif,
      birthTime,
    });
  };

  copySummary.onclick = async () => {
    const summary = `${fullName} · ${tribe} lineage · ${motif}. Mantra: ${profile.motto}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary);
      copySummary.textContent = "Copied";
      setTimeout(() => {
        copySummary.textContent = "Copy preview";
      }, 1500);
    } else {
      window.prompt("Copy summary:", summary);
    }
  };
});
