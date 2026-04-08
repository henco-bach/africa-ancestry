const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const Handlebars = require("handlebars");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { pathToFileURL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const TEMPLATES_DIR = path.join(ROOT_DIR, "templates");
const TEMPLATE_FILE = path.join(TEMPLATES_DIR, "heritage-template.hbs");
const GENERATED_DIR = path.join(ROOT_DIR, "generated");
const DATABASE_DIR = path.join(ROOT_DIR, "database");
const CERT_DB_FILE = path.join(DATABASE_DIR, "certificates.json");
const MAPS_DIR = path.join(ROOT_DIR, "Image Assets", "Region Maps");
const PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || "";

const REQUIRED_FIELDS = [
  "fullName",
  "birthDate",
  "birthPlace",
  "nation",
  "ethnolinguisticGroup",
  "classification",
  "clanName"
];

const nationContexts = {
  zulu: "The Zulu nation developed a highly structured social and military order in Southern Africa, becoming one of the most influential state formations of the nineteenth century.",
  yoruba: "The Yoruba civilization is rooted in a network of historic city-states known for governance traditions, sacred arts, and enduring linguistic continuity across West Africa.",
  igbo: "Igbo historical development reflects decentralized community governance, extensive trade pathways, and resilient cultural institutions centered on kinship and title systems.",
  akan: "Akan societies established influential gold-trade polities in West Africa and cultivated deeply symbolic systems of leadership, philosophy, and oral heritage.",
  amhara: "Amhara historical identity is intertwined with long-standing highland kingdoms, manuscript culture, and legal-religious traditions across the Horn of Africa."
};

const regionKeyToMapFile = {
  zulu: "zulu.svg",
  xhosa: "xhosa.svg",
  ndebele: "southern-africa.svg",
  swazi: "swazi.svg",
  basotho: "basotho.svg",
  batswana: "batswana.svg",
  bapedi: "bapedi.svg",
  tsonga_shangaan: "tsonga_shangaan.svg",
  venda: "venda.svg",
  shona_ndebele_zw: "southern-africa.svg",
  chewa_ngoni: "southern-africa.svg",
  ovambo_herero: "southern-africa.svg",
  khoisan: "southern-africa.svg",
  mozambique_coastal: "southern-africa.svg"
};

const regionKeyToLabel = {
  zulu: "Zulu",
  xhosa: "Xhosa",
  ndebele: "Ndebele",
  swazi: "Swazi",
  basotho: "Basotho",
  batswana: "Batswana",
  bapedi: "Bapedi",
  tsonga_shangaan: "Tsonga / Shangaan",
  venda: "Venda",
  shona_ndebele_zw: "Shona / Ndebele (Zimbabwe)",
  chewa_ngoni: "Chewa / Ngoni",
  ovambo_herero: "Ovambo / Herero",
  khoisan: "Khoisan Communities",
  mozambique_coastal: "Mozambique Coastal Lineages"
};

// Allow frontend access even when hosted on a different local origin (e.g. Live Server).
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "2mb" }));
app.use("/assets", express.static(path.join(ROOT_DIR, "assets")));
app.use("/generated", express.static(GENERATED_DIR));
app.use("/Image Assets", express.static(path.join(ROOT_DIR, "Image Assets")));

app.get("/favicon.png", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "favicon.png"));
});

app.get("/favicon.ico", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "favicon.png"));
});

app.get(["/", "/index.html"], (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get(["/questionnaire", "/questionnaire.html"], (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "questionnaire.html"));
});

app.get("/styles.css", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "styles.css"));
});

app.get("/questionnaire.css", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "questionnaire.css"));
});

app.get("/main.js", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "main.js"));
});

app.get("/questionnaire.js", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "questionnaire.js"));
});

async function ensureDirectories() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  await fs.mkdir(DATABASE_DIR, { recursive: true });

  try {
    await fs.access(CERT_DB_FILE);
  } catch {
    await fs.writeFile(CERT_DB_FILE, "[]", "utf8");
  }
}

function validatePayload(payload) {
  const missing = REQUIRED_FIELDS.filter((field) => {
    return typeof payload[field] !== "string" || payload[field].trim() === "";
  });

  if (missing.length) {
    return `Missing or invalid required fields: ${missing.join(", ")}`;
  }

  const parsedBirthDate = new Date(payload.birthDate);
  if (Number.isNaN(parsedBirthDate.getTime())) {
    return "Invalid birthDate. Use an ISO date string or a date parseable by JavaScript.";
  }

  return null;
}

function toNiceDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function getSouthernSeasonDetails(birthDate) {
  const month = new Date(birthDate).getMonth() + 1;

  if (month === 12 || month === 1 || month === 2) {
    return {
      season: "Summer",
      symbolism:
        "In Southern Hemisphere summer, life force and visibility peak, symbolizing expression, confidence, and communal vitality."
    };
  }

  if (month >= 3 && month <= 5) {
    return {
      season: "Autumn",
      symbolism:
        "Southern Hemisphere autumn symbolizes harvest and transition, marking a period of reflection, gratitude, and stewardship."
    };
  }

  if (month >= 6 && month <= 8) {
    return {
      season: "Winter",
      symbolism:
        "Southern Hemisphere winter represents restoration and continuity, emphasizing endurance, wisdom, and ancestral grounding."
    };
  }

  return {
    season: "Spring",
    symbolism:
      "Southern Hemisphere spring is associated with renewal and emergence, symbolizing growth, creative momentum, and new beginnings."
  };
}

function getHistoricalContext(nation) {
  return (
    nationContexts[nation.toLowerCase()] ||
    "This nation carries layered histories shaped by language, migration, ecological adaptation, and intergenerational knowledge systems."
  );
}

function parseSelectedRegions(classification = "") {
  return String(classification)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => /^[a-z_]+$/.test(value));
}

function formatSelectedRegionsLabel(regionKeys) {
  if (!Array.isArray(regionKeys) || regionKeys.length === 0) return "Unspecified";
  const labels = regionKeys.map((key) => regionKeyToLabel[key] || key.replaceAll("_", " "));
  return Array.from(new Set(labels)).join(", ");
}

async function getRegionMapPath(regionKeys) {
  const firstRegion = Array.isArray(regionKeys) && regionKeys.length > 0 ? regionKeys[0] : "";
  const mapFile = regionKeyToMapFile[firstRegion] || "southern-africa.svg";
  const absoluteMapPath = path.join(MAPS_DIR, mapFile);

  try {
    await fs.access(absoluteMapPath);
    return pathToFileURL(absoluteMapPath).href;
  } catch {
    return pathToFileURL(path.join(MAPS_DIR, "southern-africa.svg")).href;
  }
}

function buildClanContext(clanName, nation) {
  return `The ${clanName} lineage is recognized within ${nation} heritage memory as a social anchor for kinship identity, oral continuity, and intergenerational obligations.`;
}

function buildNameMeaningParagraph(fullName) {
  return `${fullName} is affirmed in this certificate as a bearer of memory and continuity, linking personal identity to ancestral narratives, place, and linguistic heritage.`;
}

async function readCertificates() {
  const raw = await fs.readFile(CERT_DB_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveCertificateMetadata(metadata) {
  const certificates = await readCertificates();
  certificates.push(metadata);
  await fs.writeFile(CERT_DB_FILE, JSON.stringify(certificates, null, 2), "utf8");
}

let compiledTemplate = null;
async function getCompiledTemplate() {
  if (compiledTemplate) {
    return compiledTemplate;
  }

  const source = await fs.readFile(TEMPLATE_FILE, "utf8");
  compiledTemplate = Handlebars.compile(source);
  return compiledTemplate;
}

app.post("/generate-certificate", async (req, res) => {
  const error = validatePayload(req.body || {});
  if (error) {
    return res.status(400).json({ error });
  }

  const {
    fullName,
    birthDate,
    birthPlace,
    nation,
    ethnolinguisticGroup,
    classification,
    clanName
  } = req.body;

  const certificateID = uuidv4();
  const issueDate = toNiceDate(new Date());
  const seasonData = getSouthernSeasonDetails(birthDate);
  const historicalContext = getHistoricalContext(nation);
  const selectedRegions = parseSelectedRegions(classification);
  const selectedRegionsLabel = formatSelectedRegionsLabel(selectedRegions);
  const regionMapPath = await getRegionMapPath(selectedRegions);
  const qrVerificationUrl = `https://yourdomain.com/verify/${certificateID}`;

  let browser;

  try {
    const qrCodePath = await QRCode.toDataURL(qrVerificationUrl);
    const template = await getCompiledTemplate();

    const resolvedClassification = `${classification} (${seasonData.season})`;

    const html = template({
      fullName,
      birthDate: toNiceDate(new Date(birthDate)),
      birthPlace,
      nation,
      ethnolinguisticGroup,
      classification: resolvedClassification,
      selectedRegionsLabel,
      certificateID,
      issueDate,
      historicalContext,
      clanContext: buildClanContext(clanName, nation),
      seasonalSymbolism: seasonData.symbolism,
      nameMeaningParagraph: buildNameMeaningParagraph(fullName),
      regionMapPath,
      qrCodePath
    });

    const pdfFilePath = path.join(GENERATED_DIR, `${certificateID}.pdf`);

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    };

    if (PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = PUPPETEER_EXECUTABLE_PATH;
    } else {
      launchOptions.channel = "chrome";
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
      path: pdfFilePath,
      format: "A4",
      printBackground: true
    });

    await saveCertificateMetadata({
      certificateID,
      fullName,
      nation,
      selectedRegions: selectedRegionsLabel,
      issueDate
    });

    return res.download(pdfFilePath, `${certificateID}.pdf`);
  } catch (generationError) {
    console.error("Certificate generation failed:", generationError);
    return res.status(500).json({
      error: "Failed to generate certificate PDF"
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.get("/verify/:certificateID", async (req, res) => {
  const { certificateID } = req.params;

  try {
    const certificates = await readCertificates();
    const match = certificates.find(
      (certificate) => certificate.certificateID === certificateID
    );

    if (!match) {
      return res.status(404).json({
        verified: false,
        message: "Certificate not found"
      });
    }

    return res.status(200).json({
      verified: true,
      certificate: match
    });
  } catch (error) {
    console.error("Verification failed:", error);
    return res.status(500).json({ error: "Failed to verify certificate" });
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

ensureDirectories()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Certificate service running on http://localhost:${PORT}`);
    });
  })
  .catch((startupError) => {
    console.error("Startup failed:", startupError);
    process.exit(1);
  });
