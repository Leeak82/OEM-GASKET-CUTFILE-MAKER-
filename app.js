let PARTS_DB = [];

// ----------------------
// Helpers
// ----------------------
function $(id) {
  return document.getElementById(id);
}

function safeEl(id) {
  const el = $(id);
  if (!el) {
    console.warn(`Missing element: ${id}`);
  }
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

function clearSelect(id, placeholder = "-- Select --") {
  const el = safeEl(id);
  if (!el) return;

  el.innerHTML = "";
  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholder;
  el.appendChild(option);
}

function fillSelect(id, values, placeholder = "-- Select --") {
  const el = safeEl(id);
  if (!el) return;

  clearSelect(id, placeholder);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
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

function clearPartFields() {
  setValue("partNumber", "");
  setValue("width", "");
  setValue("height", "");
  setValue("manualHoles", "");
  const svgOutput = safeEl("svgOutput");
  if (svgOutput) svgOutput.innerHTML = "";
}

function clearDependent(ids) {
  ids.forEach((id) => clearSelect(id));
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

  fillSelect("type", types, "-- Select Gasket Type --");
  clearPartFields();
}

// ----------------------
// Hole pattern handling
// ----------------------
function applyHolePattern(pattern) {
  if (!Array.isArray(pattern) || pattern.length === 0) return false;

  const rows = pattern.map((hole) => `${hole.x},${hole.y},${hole.r || 5}`);
  setValue("manualHoles", rows.join("\n"));
  return true;
}

function generateAutoHoles(count) {
  const width = parseFloat(getValue("width"));
  const height = parseFloat(getValue("height"));

  if (!width || !height || !count) {
    setValue("manualHoles", "");
    return;
  }

  const holes = [];
  const radius = 5;
  const padding = 16;

  if (count <= 4) {
    holes.push(`${padding},${padding},${radius}`);
    holes.push(`${width - padding},${padding},${radius}`);
    holes.push(`${padding},${height - padding},${radius}`);
    holes.push(`${width - padding},${height - padding},${radius}`);
  } else {
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
        points.push(`${x.toFixed(1)},${y.toFixed(1)},${radius}`);
      }

      return points;
    }

    holes.push(...edgePoints(topCount, padding, padding, width - padding, padding));
    holes.push(...edgePoints(rightCount, width - padding, padding, width - padding, height - padding));
    holes.push(...edgePoints(bottomCount, width - padding, height - padding, padding, height - padding));
    holes.push(...edgePoints(leftCount, padding, height - padding, padding, padding));
  }

  setValue("manualHoles", [...new Set(holes)].join("\n"));
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

  setValue("partNumber", part.partNumber);
  setValue("width", part.geometry.width);
  setValue("height", part.geometry.height);

  const usedPattern = applyHolePattern(part.geometry.holePattern);
  if (!usedPattern) {
    generateAutoHoles(part.geometry.holes || 0);
  }

  renderSVG();
}

// ----------------------
// SVG render
// ----------------------
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

  const outerRadius = 20;

  const holesMarkup = holes.map((hole) => {
    return `<circle cx="${hole.x}" cy="${hole.y}" r="${hole.r}" fill="white" stroke="black" stroke-width="1" />`;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect
        x="2"
        y="2"
        width="${width - 4}"
        height="${height - 4}"
        rx="${outerRadius}"
        ry="${outerRadius}"
        fill="none"
        stroke="black"
        stroke-width="3"
      />
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
      populateMakes();
      clearPartFields();
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
}

// ----------------------
// Init
// ----------------------
async function initApp() {
  attachEvents();
  createHiddenImportInput();
  await loadDatabaseFile();
}

document.addEventListener("DOMContentLoaded", initApp);
