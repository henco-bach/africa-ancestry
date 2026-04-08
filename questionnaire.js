const form = document.querySelector("#ancestry-form");
const steps = Array.from(document.querySelectorAll("[data-step]"));
const stepPills = Array.from(document.querySelectorAll("[data-step-pill]"));
const backBtn = document.querySelector("[data-back-btn]");
const nextBtn = document.querySelector("[data-next-btn]");
const submitBtn = document.querySelector("[data-submit-btn]");
const formError = document.querySelector("[data-form-error]");
const startOverBtn = document.querySelector("[data-start-over]");
const flowPanels = Array.from(document.querySelectorAll("[data-flow-state]"));
const gatheringTasks = Array.from(document.querySelectorAll(".gathering-list [data-task]"));
const loadingProgress = document.querySelector("[data-loading-progress]");
const loadingStatus = document.querySelector("[data-loading-status]");
const dateOfBirthInput = document.querySelector('input[name="dateOfBirth"]');
const birthPlaceInput = document.querySelector('input[name="birthPlace"]');
const birthPlaceMenu = document.querySelector("[data-birth-place-menu]");
const birthPlacePlaceIdInput = document.querySelector('input[name="birthPlacePlaceId"]');
const birthPlaceLatitudeInput = document.querySelector('input[name="birthPlaceLatitude"]');
const birthPlaceLongitudeInput = document.querySelector('input[name="birthPlaceLongitude"]');
const regionChips = Array.from(document.querySelectorAll("[data-region-chip]"));
const genderInput = document.querySelector('input[name="gender"]');
const genderButtons = Array.from(document.querySelectorAll("[data-gender-choice]"));
const downloadLink = document.querySelector("[data-download-link]");

const resultName = document.querySelector("[data-result-name]");
const resultSummary = document.querySelector("[data-result-summary]");
const resultFullName = document.querySelector("[data-result-full-name]");
const resultNation = document.querySelector("[data-result-nation]");
const resultCertificateId = document.querySelector("[data-result-certificate-id]");
const resultVerifyStatus = document.querySelector("[data-result-verify-status]");
const resultSource = document.querySelector("[data-result-source]");

let activeStep = 1;
let activeDownloadUrl = "";
let selectedBirthPlaceLabel = "";
let birthPlaceDebounceTimer = null;
let birthPlaceAbortController = null;
const birthPlaceOptionMap = new Map();
const southernAfricanCountries = new Set([
  "angola",
  "botswana",
  "comoros",
  "eswatini",
  "lesotho",
  "madagascar",
  "malawi",
  "mauritius",
  "mozambique",
  "namibia",
  "seychelles",
  "south africa",
  "zambia",
  "zimbabwe"
]);
const defaultApiBase = "http://localhost:3000";
const configuredApiBase = window.AA_BACKEND_URL || localStorage.getItem("aa_api_base");
const apiBase = configuredApiBase || defaultApiBase;

const stepFields = {
  1: ["givenNames", "surname", "gender", "dateOfBirth", "birthPlace"],
  2: []
};

const regionToNationMap = {
  zulu: "Zulu",
  xhosa: "Xhosa",
  ndebele: "Ndebele",
  swazi: "Swazi",
  basotho: "Basotho",
  batswana: "Batswana",
  bapedi: "Bapedi",
  tsonga_shangaan: "Tsonga",
  venda: "Venda",
  shona_ndebele_zw: "Shona",
  chewa_ngoni: "Chewa",
  ovambo_herero: "Ovambo",
  khoisan: "Khoisan",
  mozambique_coastal: "Mozambique Coastal"
};

const chipToLanguage = {
  zulu: "isiZulu",
  xhosa: "isiXhosa",
  ndebele: "isiNdebele",
  swazi: "siSwati",
  basotho: "Sesotho",
  batswana: "Setswana",
  bapedi: "Sepedi",
  tsonga_shangaan: "Xitsonga",
  venda: "Tshivenda",
  shona_ndebele_zw: "Shona",
  chewa_ngoni: "Chichewa",
  ovambo_herero: "Oshiwambo",
  khoisan: "Khoekhoegowab",
  mozambique_coastal: "Emakhuwa"
};

const southernAfricaFallbackMap = "Image Assets/Region Maps/southern-africa.svg";

const regionalMapByChip = {
  zulu: {
    title: "Zulu",
    mapUrl: "Image Assets/Region Maps/zulu.svg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Zulu_language"
  },
  xhosa: {
    title: "Xhosa",
    mapUrl: "Image Assets/Region Maps/xhosa.svg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Xhosa_language"
  },
  ndebele: {
    title: "Ndebele",
    mapUrl: southernAfricaFallbackMap,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Southern_Ndebele_language"
  },
  swazi: {
    title: "Swazi",
    mapUrl: "Image Assets/Region Maps/swazi.svg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Swazi_language"
  },
  basotho: {
    title: "Basotho",
    mapUrl: "Image Assets/Region Maps/basotho.svg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Sotho_language"
  },
  batswana: {
    title: "Batswana",
    mapUrl: "Image Assets/Region Maps/batswana.svg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Tswana_language"
  },
  bapedi: {
    title: "Bapedi",
    mapUrl: "Image Assets/Region Maps/bapedi.svg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Northern_Sotho_language"
  },
  tsonga_shangaan: {
    title: "Tsonga / Shangaan",
    mapUrl: "Image Assets/Region Maps/tsonga_shangaan.svg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Tsonga_language"
  },
  venda: {
    title: "Venda",
    mapUrl: "Image Assets/Region Maps/venda.svg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Venda_language"
  },
  shona_ndebele_zw: {
    title: "Shona / Ndebele (Zimbabwe)",
    mapUrl: southernAfricaFallbackMap,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Shona_language"
  },
  chewa_ngoni: {
    title: "Chewa / Ngoni",
    mapUrl: southernAfricaFallbackMap,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Chewa_language"
  },
  ovambo_herero: {
    title: "Ovambo / Herero",
    mapUrl: southernAfricaFallbackMap,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Herero_people"
  },
  khoisan: {
    title: "Khoisan Communities",
    mapUrl: southernAfricaFallbackMap,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Khoisan"
  },
  mozambique_coastal: {
    title: "Mozambique Coastal Lineages",
    mapUrl: southernAfricaFallbackMap,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Demographics_of_Mozambique"
  }
};

function parseDateOfBirthToISO(value) {
  const match = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(String(value || ""));
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  const valid =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  if (!valid) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (parsed.getTime() > todayUtc) return null;

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateOfBirthInput(rawValue) {
  const digitsOnly = String(rawValue || "").replace(/\D/g, "").slice(0, 8);
  const day = digitsOnly.slice(0, 2);
  const month = digitsOnly.slice(2, 4);
  const year = digitsOnly.slice(4, 8);

  if (digitsOnly.length <= 2) return day;
  if (digitsOnly.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

function setFlowState(state) {
  flowPanels.forEach((panel) => {
    panel.hidden = panel.getAttribute("data-flow-state") !== state;
  });
}

function syncStepUI() {
  steps.forEach((step) => {
    const stepNum = Number(step.getAttribute("data-step"));
    step.classList.toggle("active", stepNum === activeStep);
  });

  stepPills.forEach((pill) => {
    const stepNum = Number(pill.getAttribute("data-step-pill"));
    pill.classList.toggle("active", stepNum === activeStep);
  });

  if (backBtn) backBtn.hidden = activeStep === 1;
  if (nextBtn) nextBtn.hidden = activeStep === steps.length;
  if (submitBtn) submitBtn.hidden = activeStep !== steps.length;
}

function validateStep(stepNumber) {
  if (!form) return false;
  const names = stepFields[stepNumber] || [];

  for (const name of names) {
    const field = form.elements[name];
    if (!field) continue;

    if (name === "gender" && !field.value) {
      formError.textContent = "Please select a gender before continuing.";
      return false;
    }

    if (!field.value || !field.checkValidity()) {
      formError.textContent = "Please complete all required fields before continuing.";
      field.reportValidity();
      return false;
    }

    if (name === "dateOfBirth") {
      const isoDob = parseDateOfBirthToISO(field.value);
      if (!isoDob) {
        formError.textContent = "Please enter Date Of Birth in dd/mm/yyyy format.";
        return false;
      }
    }

    if (name === "birthPlace") {
      const hasSelectedPlace =
        Boolean(birthPlacePlaceIdInput?.value) &&
        field.value.trim().toLowerCase() === selectedBirthPlaceLabel.trim().toLowerCase();
      if (!hasSelectedPlace) {
        formError.textContent = "Please choose a valid place from the suggestions.";
        return false;
      }
    }
  }

  if (stepNumber === 2 && getSelectedRegions().length === 0) {
    formError.textContent = "Please pick at least one heritage button before continuing.";
    return false;
  }

  formError.textContent = "";
  return true;
}

function getSelectedRegions() {
  return regionChips
    .filter((chip) => chip.classList.contains("selected"))
    .map((chip) => chip.getAttribute("data-region-chip"))
    .filter(Boolean);
}

function resolveNation(selectedRegions) {
  if (selectedRegions.length > 0) {
    const first = selectedRegions[0];
    return regionToNationMap[first] || first;
  }

  return "Unspecified";
}

function collectCertificatePayload() {
  if (!form) return null;

  const formData = new FormData(form);
  const isoDateOfBirth = parseDateOfBirthToISO(formData.get("dateOfBirth"));
  if (!isoDateOfBirth) return null;

  const givenNames = (formData.get("givenNames") || "").toString().trim();
  const surname = (formData.get("surname") || "").toString().trim();
  const selectedRegions = getSelectedRegions();
  const primaryRegionKey = selectedRegions[0] || "";
  const primaryRegion = primaryRegionKey ? (regionToNationMap[primaryRegionKey] || primaryRegionKey) : "Unspecified";

  const fullName = `${givenNames} ${surname}`.trim();
  const nation = resolveNation(selectedRegions);
  const classification = selectedRegions.length > 0 ? selectedRegions.join(", ") : "General Lineage";

  return {
    fullName,
    birthDate: isoDateOfBirth,
    birthPlace: (formData.get("birthPlace") || "").toString().trim(),
    nation,
    ethnolinguisticGroup: primaryRegion,
    classification,
    clanName: "Unspecified"
  };
}

function collectAncestryInput() {
  if (!form) return null;

  const formData = new FormData(form);
  const isoDateOfBirth = parseDateOfBirthToISO(formData.get("dateOfBirth"));
  if (!isoDateOfBirth) return null;

  const givenNames = (formData.get("givenNames") || "").toString().trim();
  const surname = (formData.get("surname") || "").toString().trim();
  const gender = (formData.get("gender") || "").toString().trim();
  const birthPlace = (formData.get("birthPlace") || "").toString().trim();
  const selectedRegions = getSelectedRegions();
  const primaryChip = selectedRegions[0] || "";
  const language = chipToLanguage[primaryChip] || primaryChip || "isiZulu";

  return {
    givenNames,
    surname,
    gender,
    dateOfBirth: isoDateOfBirth,
    language,
    birthPlace,
    timeOfBirth: null,
    photo: null
  };
}

async function requestPreview(input) {
  const response = await fetch(`${apiBase}/api/ancestry/profile/preview`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || "Unable to generate ancestry preview.");
  }

  return response.json();
}

function clearBirthPlaceSelection() {
  selectedBirthPlaceLabel = "";
  if (birthPlacePlaceIdInput) birthPlacePlaceIdInput.value = "";
  if (birthPlaceLatitudeInput) birthPlaceLatitudeInput.value = "";
  if (birthPlaceLongitudeInput) birthPlaceLongitudeInput.value = "";
}

function renderBirthPlaceSuggestions(items) {
  if (!birthPlaceMenu) return;
  birthPlaceMenu.innerHTML = "";
  birthPlaceOptionMap.clear();

  if (items.length === 0) {
    birthPlaceMenu.hidden = true;
    return;
  }

  items.forEach((item) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "place-suggestion-btn";
    option.textContent = item.label;
    option.addEventListener("click", () => {
      if (!birthPlaceInput) return;
      birthPlaceInput.value = item.label;
      selectedBirthPlaceLabel = item.label;
      if (birthPlacePlaceIdInput) birthPlacePlaceIdInput.value = item.placeId;
      if (birthPlaceLatitudeInput) birthPlaceLatitudeInput.value = item.latitude;
      if (birthPlaceLongitudeInput) birthPlaceLongitudeInput.value = item.longitude;
      birthPlaceMenu.hidden = true;
      formError.textContent = "";
    });

    birthPlaceMenu.appendChild(option);
    birthPlaceOptionMap.set(item.label.toLowerCase(), item);
  });

  birthPlaceMenu.hidden = false;
}

async function fetchBirthPlaceSuggestions(query) {
  if (!birthPlaceMenu) return;
  if (birthPlaceAbortController) birthPlaceAbortController.abort();
  birthPlaceAbortController = new AbortController();

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("bbox", "8,-36,52,-8");

  try {
    const response = await fetch(url.toString(), { signal: birthPlaceAbortController.signal });
    if (!response.ok) return;

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    const items = features
      .map((feature) => {
        const props = feature?.properties || {};
        const name = String(props.name || "").trim();
        const city = String(props.city || "").trim();
        const state = String(props.state || "").trim();
        const country = String(props.country || "").trim();
        if (!southernAfricanCountries.has(country.toLowerCase())) return null;
        const labelParts = [name, city, state, country].filter((part, idx, arr) => part && arr.indexOf(part) === idx);
        const label = labelParts.join(", ");
        if (!label) return null;
        const coords = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
        return {
          label,
          placeId: String(props.osm_id || ""),
          longitude: Number.isFinite(coords[0]) ? String(coords[0]) : "",
          latitude: Number.isFinite(coords[1]) ? String(coords[1]) : ""
        };
      })
      .filter(Boolean);

    renderBirthPlaceSuggestions(items.slice(0, 6));
  } catch (error) {
    if (error?.name === "AbortError") return;
    renderBirthPlaceSuggestions([]);
  }
}

function runGatheringAnimation() {
  const statusMessages = [
    "Preparing your details...",
    "Searching ancestry records...",
    "Matching linguistic heritage...",
    "Tracing clan and lineage connections...",
    "Building your ancestral preview..."
  ];

  gatheringTasks.forEach((task) => task.classList.remove("done"));

  return new Promise((resolve) => {
    let progress = 0;
    let doneTasks = 0;

    if (loadingProgress) loadingProgress.textContent = "0%";
    if (loadingStatus) loadingStatus.textContent = statusMessages[0];

    const timer = window.setInterval(() => {
      progress += 2;
      const clamped = Math.min(progress, 100);

      if (loadingProgress) loadingProgress.textContent = `${clamped}%`;

      const targetTasks = Math.floor((clamped / 100) * gatheringTasks.length);
      while (doneTasks < targetTasks) {
        gatheringTasks[doneTasks]?.classList.add("done");
        doneTasks += 1;
      }

      const statusIndex = Math.min(statusMessages.length - 1, Math.floor((clamped / 100) * statusMessages.length));
      if (loadingStatus) loadingStatus.textContent = statusMessages[statusIndex];

      if (clamped >= 100) {
        window.clearInterval(timer);
        resolve();
      }
    }, 85);
  });
}

function readCertificateIdFromHeaders(headers) {
  const disposition = headers.get("content-disposition") || "";
  const filenameMatch = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(disposition);

  if (!filenameMatch) return "";

  const filename = decodeURIComponent(filenameMatch[1]).replace(/\"/g, "").trim();
  const idMatch = /^([a-f0-9-]{36})\.pdf$/i.exec(filename);
  return idMatch ? idMatch[1] : "";
}

async function requestCertificate(payload) {
  const response = await fetch(`${apiBase}/generate-certificate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || "Unable to generate certificate.");
  }

  const blob = await response.blob();
  const certificateID = readCertificateIdFromHeaders(response.headers);
  const pdfUrl = URL.createObjectURL(blob);

  return {
    certificateID,
    pdfUrl,
    filename: certificateID ? `${certificateID}.pdf` : "heritage-certificate.pdf"
  };
}

async function verifyCertificate(certificateID) {
  if (!certificateID) {
    return {
      verified: false,
      message: "Certificate generated, but ID could not be parsed from response headers."
    };
  }

  const response = await fetch(`${apiBase}/verify/${encodeURIComponent(certificateID)}`);

  if (response.status === 404) {
    return { verified: false, message: "Certificate not found in verification database." };
  }

  if (!response.ok) {
    throw new Error("Verification request failed.");
  }

  const data = await response.json();
  return {
    verified: Boolean(data?.verified),
    message: data?.verified ? "Verified and stored in local certificate database." : "Verification failed."
  };
}

function setDownloadLink(downloadUrl, filename) {
  if (!downloadLink) return;
  downloadLink.href = downloadUrl;
  downloadLink.setAttribute("download", filename);
  downloadLink.hidden = false;
}

function autoDownload(downloadUrl, filename) {
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function renderResult(result) {
  if (resultName) resultName.textContent = "Heritage Certificate";
  if (resultSummary) resultSummary.textContent = result.summary;
  if (resultFullName) resultFullName.textContent = result.fullName;
  if (resultNation) resultNation.textContent = result.nation;
  if (resultCertificateId) resultCertificateId.textContent = result.certificateID || "Unavailable";
  if (resultVerifyStatus) resultVerifyStatus.textContent = result.verifyStatus;
  if (resultSource) resultSource.textContent = result.source;
}

function resetDownloadLink() {
  if (downloadLink) {
    downloadLink.hidden = true;
    downloadLink.removeAttribute("href");
    downloadLink.removeAttribute("download");
  }

  if (activeDownloadUrl) {
    URL.revokeObjectURL(activeDownloadUrl);
    activeDownloadUrl = "";
  }
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (!validateStep(activeStep)) return;
    activeStep = Math.min(steps.length, activeStep + 1);
    syncStepUI();
  });
}

if (dateOfBirthInput) {
  dateOfBirthInput.addEventListener("input", () => {
    dateOfBirthInput.value = formatDateOfBirthInput(dateOfBirthInput.value);
  });
}

if (birthPlaceInput) {
  birthPlaceInput.addEventListener("input", () => {
    const query = birthPlaceInput.value.trim();

    if (!query || query.toLowerCase() !== selectedBirthPlaceLabel.trim().toLowerCase()) {
      clearBirthPlaceSelection();
    }

    if (query.length < 3) {
      renderBirthPlaceSuggestions([]);
      return;
    }

    if (birthPlaceDebounceTimer) window.clearTimeout(birthPlaceDebounceTimer);
    birthPlaceDebounceTimer = window.setTimeout(() => {
      fetchBirthPlaceSuggestions(query);
    }, 220);
  });

  const confirmBirthPlaceSelection = () => {
    const match = birthPlaceOptionMap.get(birthPlaceInput.value.trim().toLowerCase());
    if (!match) return;
    selectedBirthPlaceLabel = match.label;
    if (birthPlacePlaceIdInput) birthPlacePlaceIdInput.value = match.placeId;
    if (birthPlaceLatitudeInput) birthPlaceLatitudeInput.value = match.latitude;
    if (birthPlaceLongitudeInput) birthPlaceLongitudeInput.value = match.longitude;
    if (birthPlaceMenu) birthPlaceMenu.hidden = true;
  };

  birthPlaceInput.addEventListener("change", confirmBirthPlaceSelection);
  birthPlaceInput.addEventListener("blur", confirmBirthPlaceSelection);
}

document.addEventListener("click", (event) => {
  if (!birthPlaceMenu || !birthPlaceInput) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const clickedInsideInput = target === birthPlaceInput || birthPlaceInput.contains(target);
  const clickedInsideMenu = birthPlaceMenu.contains(target);
  if (!clickedInsideInput && !clickedInsideMenu) birthPlaceMenu.hidden = true;
});

if (genderButtons.length > 0 && genderInput) {
  genderButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.getAttribute("data-gender-choice");
      if (!value) return;

      genderButtons.forEach((node) => {
        const selected = node === button;
        node.classList.toggle("selected", selected);
        node.setAttribute("aria-pressed", selected ? "true" : "false");
      });

      genderInput.value = value;
      formError.textContent = "";
    });
  });
}

if (regionChips.length > 0) {
  regionChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const selecting = !chip.classList.contains("selected");

      chip.classList.toggle("selected", selecting);
      chip.setAttribute("aria-pressed", selecting ? "true" : "false");
      formError.textContent = "";
    });
  });
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    formError.textContent = "";
    activeStep = Math.max(1, activeStep - 1);
    syncStepUI();
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateStep(activeStep)) return;

    const input = collectAncestryInput();
    if (!input) {
      formError.textContent = "Please enter Date Of Birth in dd/mm/yyyy format.";
      return;
    }

    formError.textContent = "";
    setFlowState("gathering");

    try {
      const [preview] = await Promise.all([requestPreview(input), runGatheringAnimation()]);

      localStorage.setItem("aa_preview", JSON.stringify(preview));
      localStorage.setItem("aa_ancestry_input", JSON.stringify(input));

      window.location.href = "results.html";
    } catch (error) {
      setFlowState("form");
      const message = error instanceof Error ? error.message : "Unable to generate ancestry preview.";
      if (message === "Failed to fetch") {
        formError.textContent =
          "Cannot reach the ancestry service. Please check your connection and try again.";
        return;
      }
      formError.textContent = message;
    }
  });
}

if (startOverBtn) {
  startOverBtn.addEventListener("click", () => {
    if (form) form.reset();

    genderButtons.forEach((button) => {
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    });

    if (genderInput) genderInput.value = "";
    clearBirthPlaceSelection();
    renderBirthPlaceSuggestions([]);

    regionChips.forEach((chip) => {
      chip.classList.remove("selected");
      chip.setAttribute("aria-pressed", "false");
    });

    resetDownloadLink();
    formError.textContent = "";
    activeStep = 1;
    syncStepUI();
    setFlowState("form");
  });
}

syncStepUI();
setFlowState("form");
