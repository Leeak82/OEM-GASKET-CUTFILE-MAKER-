let PARTS_DB = [];
let CURRENT_PART = null;

// ----------------------
// Pattern library
// ----------------------
const FASTENER_PATTERNS = {
  vc_smallblock_8: {
    name: "Valve Cover 8-Bolt",
    source: "Fastener Pattern Library",
    type: "custom",
    width: 365,
    height: 120,
    holes: [
      { x: 28, y: 22, r: 5 },
      { x: 112, y: 18, r: 5 },
      { x: 252, y: 18, r: 5 },
      { x: 337, y: 22, r: 5 },
      { x: 28, y: 98, r: 5 },
      { x: 112, y: 102, r: 5 },
      { x: 252, y: 102, r: 5 },
      { x: 337, y: 98, r: 5 }
    ]
  },

  vc_stamped_14: {
    name: "Valve Cover 14-Bolt",
    source: "Fastener Pattern Library",
    type: "custom",
    width: 430,
    height: 135,
    holes: [
      { x: 28, y: 20, r: 5 },
      { x: 88, y: 18, r: 5 },
      { x: 148, y: 16, r: 5 },
      { x: 215, y: 15, r: 5 },
      { x: 282, y: 16, r: 5 },
      { x: 342, y: 18, r: 5 },
      { x: 402, y: 20, r: 5 },
      { x: 28, y: 115, r: 5 },
      { x: 88, y: 117, r: 5 },
      { x: 148, y: 119, r: 5 },
      { x: 215, y: 120, r: 5 },
      { x: 282, y: 119, r: 5 },
      { x: 342, y: 117, r: 5 },
      { x: 402, y: 115, r: 5 }
    ]
  },

  oilpan_perimeter_18: {
    name: "Oil Pan 18-Bolt",
    source: "Fastener Pattern Library",
    type: "perimeter",
    count: 18,
    padding: 16,
    radius: 5
  },

  oilpan_perimeter_20: {
    name: "Oil Pan 20-Bolt",
    source: "Fastener Pattern Library",
    type: "perimeter",
    count: 20,
    padding: 16,
    radius: 5
  },

  head_6bolt_basic: {
    name: "Head Gasket 6-Bolt",
    source: "Fastener Pattern Library",
    type: "custom",
    width: 285,
    height: 195,
    holes: [
      { x: 28, y: 28, r: 6 },
      { x: 142.5, y: 22, r: 6 },
      { x: 257, y: 28, r: 6 },
      { x: 28, y: 167, r: 6 },
      { x: 142.5, y: 173, r: 6 },
      { x: 257, y: 167, r: 6 }
    ]
  }
};

// ----------------------
// User-friendly labels
// ----------------------
const GASKET_TYPE_LABELS = {
  oil_pan: "Oil Pan",
  valve_cover: "Valve Cover",
  head_gasket: "Head Gasket",
  intake_manifold: "Intake Manifold",
  exhaust_manifold: "Exhaust Manifold",
  timing_cover: "Timing Cover",
  transmission_pan: "Transmission Pan"
  valve_cover_left: "Valve Cover Left",
  valve_cover_right: "Valve Cover Right",
  timing_cover_right: "Timing Cover Right"
};

// ----------------------
// Helpers
// ----------------------
function $(id) {
  return document.getElementById(id);
}

function safeEl(id) {
  const el = $(id);
  if (!el) console.warn(`Missing element: ${id}`);
  return el;
}

function getValue(id) {
  const el = safeEl(id);
  return el ? el.value : "";
}

function setValue(id, value) {
  const el = safeEl(id);
  if (el) el.value = value ?? "";
}

function setText(id, value) {
  const el = safeEl(id);
  if (el) el.textContent = value ?? "--";
}

function clearSelect(id, placeholder = "-- Select --") {
  const el = safeEl(id);
  if (!el) return;

  el.innerHTML = "";
  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholder;
  el.appendChild(option);
}

function fillSelect(id, values, placeholder = "-- Select --", formatLabel = null) {
  const el = safeEl(id);
  if (!el) return;

  clearSelect(id, placeholder);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = formatLabel ? formatLabel(value) : value;
    el.appendChild(option);
  });
}

function getUnique(field, filters = {}) {
  return [...new Set(
    PARTS_DB
      .filter((part) =>
        Object.keys(filters).every((key) => part[key] === filters[key])
      )
      .map((part) => part[field])
  )].sort((a, b) => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
  });
}

function findPart(filters) {
  return PARTS_DB.find((part) =>
    Object.keys(filters).every((key) => part[key] === filters[key])
  );
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function clearInfoPanel() {
  setText("infoBrand", "--");
  setText("infoPartNumber", "--");
  setText("infoPatternName", "--");
  setText("infoPatternSource", "--");
}

function clearSearchResults() {
  const container = safeEl("searchResults");
  if (container) container.innerHTML = "";
}

function setSearchMeta(message) {
  const el = safeEl("searchMeta");
  if (el) el.textContent = message;
}

function clearSearchUI() {
  setValue("partSearch", "");
  clearSearchResults();
  setSearchMeta("Type to search parts");
}

function clearPartFields() {
  CURRENT_PART = null;
  setValue("partNumber", "");
  setValue("width", "");
  setValue("height", "");
  setValue("manualHoles", "");
  clearInfoPanel();

  const svgOutput = safeEl("svgOutput");
  if (svgOutput) svgOutput.innerHTML = "";
}

function clearDependent(ids) {
  ids.forEach((id) => clearSelect(id));
}

function gasketTypeLabel(value) {
  return GASKET_TYPE_LABELS[value] || value;
}

// ----------------------
// Dropdown population
// ----------------------
function populateMakes() {
  fillSelect("make", getUnique("make"), "-- Select Make --");
  clearDependent(["model", "year", "engine", "type"]);
  clearPartFields();
}

function populateModels() {
  const make = getValue("make");
  fillSelect("model", make ? getUnique("model", { make }) : [], "-- Select Model --");
  clearDependent(["year", "engine", "type"]);
  clearPartFields();
}

function populateYears() {
  const make = getValue("make");
  const model = getValue("model");

  const years = make && model ? getUnique("year", { make, model }) : [];
  fillSelect("year", years, "-- Select Year --");
  clearDependent(["engine", "type"]);
  clearPartFields();
}

function populateEngines() {
  const make = getValue("make");
  const model = getValue("model");
  const year = Number(getValue("year"));

  const engines = make && model && year
    ? getUnique("engine", { make, model, year })
    : [];

  fillSelect("engine", engines, "-- Select Engine --");
  clearDependent(["type"]);
  clearPartFields();
}

function populateTypes() {
  const make = getValue("make");
  const model = getValue("model");
  const year = Number(getValue("year"));
  const engine = getValue("engine");

  const types = make && model && year && engine
    ? getUnique("gasketType", { make, model, year, engine })
    : [];

  fillSelect("type", types, "-- Select Gasket Type --", gasketTypeLabel);
  clearPartFields();
}

// ----------------------
// Search
// ----------------------
function buildSearchText(part) {
  return [
    part.brand,
    part.partNumber,
    part.make,
    part.model,
    part.year,
    part.engine,
    part.gasketType,
    gasketTypeLabel(part.gasketType)
  ].join(" ").toLowerCase();
}

function searchParts(query) {
  const q = normalizeText(query);
  if (!q) return [];
  return PARTS_DB.filter((part) => buildSearchText(part).includes(q)).slice(0, 12);
}

function renderSearchResults(results) {
  const container = safeEl("searchResults");
  if (!container) return;

  if (!results.length) {
    container.innerHTML = `<div class="search-empty">No matching parts found.</div>`;
    setSearchMeta("0 results");
    return;
  }

  const resultLabel = results.length === 1 ? "result" : "results";
  setSearchMeta(`${results.length} ${resultLabel}`);

  container.innerHTML = results.map((part, index) => `
    <div class="search-result-item" data-index="${index}">
      <div class="search-result-title">
        ${part.partNumber || "No Part Number"} • ${gasketTypeLabel(part.gasketType)}
      </div>
      <div class="search-result-meta">
        ${part.brand || "Unknown Brand"}<br>
        ${part.make} ${part.model} ${part.year} • ${part.engine}
      </div>
    </div>
  `).join("");

  const items = container.querySelectorAll(".search-result-item");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      const index = Number(item.dataset.index);
      const part = results[index];
      selectPartFromSearch(part);
    });
  });
}

function handleSearchInput() {
  const query = getValue("partSearch");

  if (!query.trim()) {
    clearSearchResults();
    setSearchMeta("Type to search parts");
    return;
  }

  const results = searchParts(query);
  renderSearchResults(results);
}

function selectPartFromSearch(part) {
  if (!part) return;

  setValue("make", part.make);
  populateModels();

  setValue("model", part.model);
  populateYears();

  setValue("year", String(part.year));
  populateEngines();

  setValue("engine", part.engine);
  populateTypes();

  setValue("type", part.gasketType);
  loadSelectedGasket();

  setValue("partSearch", `${part.partNumber} - ${part.make} ${part.model} ${part.year}`);
  setSearchMeta("1 part selected");
  clearSearchResults();
}

// ----------------------
// Hole / pattern logic
// ----------------------
function applyHolePattern(pattern) {
  if (!Array.isArray(pattern) || pattern.length === 0) return false;
  const rows = pattern.map((hole) => `${hole.x},${hole.y},${hole.r || 5}`);
  setValue("manualHoles", rows.join("\n"));
  return true;
}

function generatePerimeterHoles(width, height, count, padding = 16, radius = 5) {
  const holes = [];

  const topCount = Math.ceil(count / 4);
  const rightCount = Math.floor(count / 4);
  const bottomCount = Math.ceil((count - topCount - rightCount) / 2);
  const leftCount = count - topCount - rightCount - bottomCount;

  function edgePoints(num, x1, y1, x2, y2) {
    const points = [];
    if (num <= 0) return points;

    for (let i = 0; i < num; i++) {
      const t = num === 1 ? 0.5 : i / (num - 1);
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      points.push({
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        r: radius
      });
    }
    return points;
  }

  holes.push(...edgePoints(topCount, padding, padding, width - padding, padding));
  holes.push(...edgePoints(rightCount, width - padding, padding, width - padding, height - padding));
  holes.push(...edgePoints(bottomCount, width - padding, height - padding, padding, height - padding));
  holes.push(...edgePoints(leftCount, padding, height - padding, padding, padding));

  const seen = new Set();
  return holes.filter((h) => {
    const key = `${h.x}-${h.y}-${h.r}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolvePatternInfo(part) {
  if (!part?.geometry?.patternRef) {
    return {
      name: "Exact Hole Data",
      source: "Direct Part Geometry"
    };
  }

  const pattern = FASTENER_PATTERNS[part.geometry.patternRef];
  if (!pattern) {
    return {
      name: part.geometry.patternRef,
      source: "Unknown Pattern Source"
    };
  }

  return {
    name: pattern.name || part.geometry.patternRef,
    source: pattern.source || "Pattern Library"
  };
}

function resolvePatternHoles(part) {
  if (!part?.geometry) return [];

  if (Array.isArray(part.geometry.holePattern) && part.geometry.holePattern.length > 0) {
    return part.geometry.holePattern;
  }

  const ref = part.geometry.patternRef;
  if (!ref || !FASTENER_PATTERNS[ref]) return [];

  const pattern = FASTENER_PATTERNS[ref];
  const width = Number(part.geometry.width);
  const height = Number(part.geometry.height);

  if (pattern.type === "custom") {
    return pattern.holes || [];
  }

  if (pattern.type === "perimeter") {
    return generatePerimeterHoles(
      width,
      height,
      pattern.count,
      pattern.padding ?? 16,
      pattern.radius ?? 5
    );
  }

  return [];
}

function parseManualHoles() {
  const raw = getValue("manualHoles").trim();
  if (!raw) return [];

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [x, y, r] = line.split(",").map((v) => parseFloat(v.trim()));
      if ([x, y, r].some((v) => Number.isNaN(v))) return null;
      return { x, y, r };
    })
    .filter(Boolean);
}

// ----------------------
// Outline handling
// ----------------------
function getDefaultOutlinePath(width, height) {
  const r = 20;
  return [
    `M ${r} 2`,
    `L ${width - r} 2`,
    `Q ${width - 2} 2 ${width - 2} ${r}`,
    `L ${width - 2} ${height - r}`,
    `Q ${width - 2} ${height - 2} ${width - r} ${height - 2}`,
    `L ${r} ${height - 2}`,
    `Q 2 ${height - 2} 2 ${height - r}`,
    `L 2 ${r}`,
    `Q 2 2 ${r} 2`,
    `Z`
  ].join(" ");
}

// ----------------------
// Info panel update
// ----------------------
function updateInfoPanel(part) {
  if (!part) {
    clearInfoPanel();
    return;
  }

  const patternInfo = resolvePatternInfo(part);

  setText("infoBrand", part.brand || "--");
  setText("infoPartNumber", part.partNumber || "--");
  setText("infoPatternName", patternInfo.name || "--");
  setText("infoPatternSource", patternInfo.source || "--");
}

// ----------------------
// Load selected gasket
// ----------------------
function loadSelectedGasket() {
  const make = getValue("make");
  const model = getValue("model");
  const year = Number(getValue("year"));
  const engine = getValue("engine");
  const gasketType = getValue("type");

  if (!make || !model || !year || !engine || !gasketType) return;

  const part = findPart({ make, model, year, engine, gasketType });

  if (!part) {
    clearPartFields();
    alert("No matching gasket found.");
    return;
  }

  CURRENT_PART = part;

  setValue("partNumber", part.partNumber || "");
  setValue("width", part.geometry.width);
  setValue("height", part.geometry.height);
  updateInfoPanel(part);

  const resolvedHoles = resolvePatternHoles(part);

  if (resolvedHoles.length > 0) {
    applyHolePattern(resolvedHoles);
  } else if (part.geometry.holes) {
    const fallback = generatePerimeterHoles(
      Number(part.geometry.width),
      Number(part.geometry.height),
      Number(part.geometry.holes),
      16,
      5
    );
    applyHolePattern(fallback);
    setText("infoPatternName", "Fallback Perimeter Layout");
    setText("infoPatternSource", "Automatic Fallback");
  } else {
    setValue("manualHoles", "");
  }

  renderSVG();
}

// ----------------------
// SVG render
// ----------------------
function renderSVG() {
  const width = parseFloat(getValue("width"));
  const height = parseFloat(getValue("height"));
  const holes = parseManualHoles();
  const svgOutput = safeEl("svgOutput");

  if (!svgOutput) return;
  if (!width || !height) {
    svgOutput.innerHTML = "";
    return;
  }

  const outlinePath =
    CURRENT_PART?.geometry?.outlinePath?.trim() ||
    getDefaultOutlinePath(width, height);

  const holesMarkup = holes.map((hole) => {
    return `<circle cx="${hole.x}" cy="${hole.y}" r="${hole.r}" fill="white" stroke="black" stroke-width="1.5" />`;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="${outlinePath}" fill="none" stroke="black" stroke-width="3" />
      ${holesMarkup}
    </svg>
  `;

  svgOutput.innerHTML = svg;
}

function downloadSVG() {
  const svgOutput = safeEl("svgOutput");
  if (!svgOutput || !svgOutput.innerHTML.trim()) {
    alert("No SVG available to download.");
    return;
  }

  const blob = new Blob([svgOutput.innerHTML], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${getValue("partNumber") || "gasket"}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// ----------------------
// Database import/export
// ----------------------
function exportDatabase() {
  const blob = new Blob([JSON.stringify(PARTS_DB, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "gasket_database.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function importDatabaseFromFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);

      if (!Array.isArray(parsed)) {
        throw new Error("Database must be an array.");
      }

      PARTS_DB = parsed;
      CURRENT_PART = null;
      populateMakes();
      clearPartFields();
      clearSearchUI();
      alert(`Imported ${PARTS_DB.length} parts.`);
    } catch (error) {
      console.error(error);
      alert("Invalid JSON file.");
    }
  };

  reader.readAsText(file);
}

function createHiddenImportInput() {
  let input = document.getElementById("hiddenJsonImport");
  if (input) return input;

  input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.id = "hiddenJsonImport";
  input.style.display = "none";

  input.addEventListener("change", (event) => {
    importDatabaseFromFile(event.target.files[0]);
    event.target.value = "";
  });

  document.body.appendChild(input);
  return input;
}

// ----------------------
// Load starter database
// ----------------------
async function loadDatabaseFile() {
  try {
    const response = await fetch("gasket_database.json");
    if (!response.ok) {
      throw new Error(`Failed to load database: ${response.status}`);
    }

    PARTS_DB = await response.json();
    populateMakes();
  } catch (error) {
    console.error(error);
    alert("Could not load gasket_database.json");
  }
}

// ----------------------
// Event listeners
// ----------------------
function attachEvents() {
  safeEl("make")?.addEventListener("change", populateModels);
  safeEl("model")?.addEventListener("change", populateYears);
  safeEl("year")?.addEventListener("change", populateEngines);
  safeEl("engine")?.addEventListener("change", populateTypes);
  safeEl("type")?.addEventListener("change", loadSelectedGasket);

  safeEl("generateBtn")?.addEventListener("click", renderSVG);
  safeEl("downloadSvgBtn")?.addEventListener("click", downloadSVG);
  safeEl("exportBtn")?.addEventListener("click", exportDatabase);
  safeEl("importBtn")?.addEventListener("click", () => {
    createHiddenImportInput().click();
  });

  safeEl("partSearch")?.addEventListener("input", handleSearchInput);
  safeEl("clearSearchBtn")?.addEventListener("click", clearSearchUI);
}

// ----------------------
// Init
// ----------------------
async function initApp() {
  attachEvents();
  createHiddenImportInput();
  clearInfoPanel();
  clearSearchUI();
  await loadDatabaseFile();
}

document.addEventListener("DOMContentLoaded", initApp);
