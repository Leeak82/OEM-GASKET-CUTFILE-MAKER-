let PARTS_DB = [];
let CURRENT_PART = null;
let CAMERA_STREAM = null;
let LAST_SCAN_RESULT = null;

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
  timing_cover_right: "Timing Cover Right",
  transmission_pan: "Transmission Pan",
  valve_cover_left: "Valve Cover Left",
  valve_cover_right: "Valve Cover Right"
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

function setScanStatus(message) {
  setText("scanStatus", message);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
    LAST_SCAN_RESULT?.outlinePath?.trim() ||
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
// Scan utilities
// ----------------------
function getSourceCanvas() {
  return safeEl("sourceCanvas");
}

function getProcessedCanvas() {
  return safeEl("processedCanvas");
}

function ensureCanvasSize(canvas, width, height) {
  if (!canvas) return;
  canvas.width = width;
  canvas.height = height;
}

async function startCamera() {
  const video = safeEl("cameraPreview");
  if (!video) return;

  try {
    CAMERA_STREAM = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = CAMERA_STREAM;
    setScanStatus("Camera started");
  } catch (error) {
    console.error(error);
    setScanStatus("Camera access failed");
    alert("Could not access camera. Try image upload instead.");
  }
}

function stopCamera() {
  if (CAMERA_STREAM) {
    CAMERA_STREAM.getTracks().forEach(track => track.stop());
    CAMERA_STREAM = null;
  }

  const video = safeEl("cameraPreview");
  if (video) {
    video.srcObject = null;
  }

  setScanStatus("Camera stopped");
}

function capturePhoto() {
  const video = safeEl("cameraPreview");
  const canvas = getSourceCanvas();
  if (!video || !canvas) return;

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  ensureCanvasSize(canvas, width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, width, height);

  setScanStatus("Photo captured");
}

function loadUploadedImage(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = getSourceCanvas();
      if (!canvas) return;

      const maxWidth = 1000;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      ensureCanvasSize(canvas, width, height);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      setScanStatus("Image loaded");
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function makeBinaryMask(imageData, threshold) {
  const { data, width, height } = imageData;
  const mask = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // assume darker gasket on lighter background
    mask[i] = gray < threshold ? 1 : 0;
  }

  return { mask, width, height };
}

function countNeighbors(mask, width, height, x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (mask[ny * width + nx]) count++;
    }
  }
  return count;
}

function denoiseMask(maskObj) {
  const { mask, width, height } = maskObj;
  const out = new Uint8Array(mask.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const neighbors = countNeighbors(mask, width, height, x, y);
      if (mask[idx]) {
        out[idx] = neighbors >= 2 ? 1 : 0;
      } else {
        out[idx] = neighbors >= 6 ? 1 : 0;
      }
    }
  }

  return { mask: out, width, height };
}

function findBoundingBox(maskObj) {
  const { mask, width, height } = maskObj;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x]) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) return null;

  return { minX, minY, maxX, maxY };
}

function connectedComponents(mask, width, height, targetValue = 1) {
  const visited = new Uint8Array(mask.length);
  const components = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx] || mask[idx] !== targetValue) continue;

      const queue = [[x, y]];
      visited[idx] = 1;

      let pixels = [];
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;

      while (queue.length) {
        const [cx, cy] = queue.pop();
        pixels.push([cx, cy]);

        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (visited[nIdx] || mask[nIdx] !== targetValue) continue;
          visited[nIdx] = 1;
          queue.push([nx, ny]);
        }
      }

      components.push({
        pixels,
        area: pixels.length,
        minX,
        minY,
        maxX,
        maxY,
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        width: maxX - minX + 1,
        height: maxY - minY + 1
      });
    }
  }

  return components;
}

function detectHoles(maskObj, bbox, minHoleArea) {
  const { mask, width, height } = maskObj;
  const inverse = new Uint8Array(mask.length);

  for (let i = 0; i < mask.length; i++) {
    inverse[i] = mask[i] ? 0 : 1;
  }

  const components = connectedComponents(inverse, width, height, 1);

  return components
    .filter((comp) => {
      const inside =
        comp.minX > bbox.minX &&
        comp.maxX < bbox.maxX &&
        comp.minY > bbox.minY &&
        comp.maxY < bbox.maxY;

      const notTouchingEdge =
        comp.minX > 2 &&
        comp.minY > 2 &&
        comp.maxX < width - 3 &&
        comp.maxY < height - 3;

      const areaOk = comp.area >= minHoleArea;
      const ratio = comp.width / Math.max(1, comp.height);
      const shapeOk = ratio > 0.35 && ratio < 2.8;

      return inside && notTouchingEdge && areaOk && shapeOk;
    })
    .map((comp) => {
      const radius = Math.max(3, Math.round((comp.width + comp.height) / 4));
      return {
        x: comp.cx - bbox.minX,
        y: comp.cy - bbox.minY,
        r: radius
      };
    });
}

function buildOutlinePathFromMask(maskObj, bbox) {
  const { mask, width } = maskObj;
  const localWidth = bbox.maxX - bbox.minX + 1;
  const localHeight = bbox.maxY - bbox.minY + 1;

  let topPoints = [];
  let bottomPoints = [];

  const step = Math.max(1, Math.floor(localWidth / 60));

  for (let lx = 0; lx < localWidth; lx += step) {
    const x = bbox.minX + lx;
    let topY = null;
    let bottomY = null;

    for (let y = bbox.minY; y <= bbox.maxY; y++) {
      if (mask[y * width + x]) {
        topY = y;
        break;
      }
    }

    for (let y = bbox.maxY; y >= bbox.minY; y--) {
      if (mask[y * width + x]) {
        bottomY = y;
        break;
      }
    }

    if (topY !== null) {
      topPoints.push([x - bbox.minX, topY - bbox.minY]);
    }
    if (bottomY !== null) {
      bottomPoints.push([x - bbox.minX, bottomY - bbox.minY]);
    }
  }

  if (topPoints.length < 3 || bottomPoints.length < 3) {
    return getDefaultOutlinePath(localWidth, localHeight);
  }

  const pathParts = [];
  const first = topPoints[0];
  pathParts.push(`M ${first[0]} ${first[1]}`);

  for (let i = 1; i < topPoints.length; i++) {
    pathParts.push(`L ${topPoints[i][0]} ${topPoints[i][1]}`);
  }

  for (let i = bottomPoints.length - 1; i >= 0; i--) {
    pathParts.push(`L ${bottomPoints[i][0]} ${bottomPoints[i][1]}`);
  }

  pathParts.push("Z");
  return pathParts.join(" ");
}

function drawProcessedMask(maskObj, bbox, holes) {
  const canvas = getProcessedCanvas();
  if (!canvas) return;

  const { mask, width, height } = maskObj;
  ensureCanvasSize(canvas, width, height);
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, height);

  for (let i = 0; i < mask.length; i++) {
    const value = mask[i] ? 20 : 240;
    image.data[i * 4] = value;
    image.data[i * 4 + 1] = value;
    image.data[i * 4 + 2] = value;
    image.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  if (bbox) {
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      bbox.minX,
      bbox.minY,
      bbox.maxX - bbox.minX,
      bbox.maxY - bbox.minY
    );

    ctx.fillStyle = "#ef4444";
    holes.forEach((hole) => {
      ctx.beginPath();
      ctx.arc(bbox.minX + hole.x, bbox.minY + hole.y, hole.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function processScan() {
  const sourceCanvas = getSourceCanvas();
  if (!sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) {
    setScanStatus("Load or capture an image first");
    return;
  }

  const ctx = sourceCanvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

  const threshold = Number(getValue("scanThreshold")) || 160;
  const pxPerUnit = Math.max(1, Number(getValue("scanScale")) || 4);
  const minHoleArea = Math.max(10, Number(getValue("scanMinHoleSize")) || 80);

  let maskObj = makeBinaryMask(imageData, threshold);
  maskObj = denoiseMask(maskObj);

  const bbox = findBoundingBox(maskObj);
  if (!bbox) {
    setScanStatus("No gasket shape found");
    drawProcessedMask(maskObj, null, []);
    return;
  }

  const holes = detectHoles(maskObj, bbox, minHoleArea);
  const outlinePath = buildOutlinePathFromMask(maskObj, bbox);

  const widthUnits = Number(((bbox.maxX - bbox.minX + 1) / pxPerUnit).toFixed(1));
  const heightUnits = Number(((bbox.maxY - bbox.minY + 1) / pxPerUnit).toFixed(1));

  const scaledHoles = holes.map((hole) => ({
    x: Number((hole.x / pxPerUnit).toFixed(1)),
    y: Number((hole.y / pxPerUnit).toFixed(1)),
    r: Number((hole.r / pxPerUnit).toFixed(1))
  }));

  const scaledOutlinePath = scalePathString(
    outlinePath,
    1 / pxPerUnit
  );

  LAST_SCAN_RESULT = {
    width: widthUnits,
    height: heightUnits,
    holePattern: scaledHoles,
    outlinePath: scaledOutlinePath
  };

  drawProcessedMask(maskObj, bbox, holes);
  setScanStatus(`Scan complete: ${widthUnits} x ${heightUnits}, ${scaledHoles.length} holes detected`);
}

function scalePathString(path, scale) {
  return path.replace(/-?\d+(\.\d+)?/g, (match) => {
    return Number((parseFloat(match) * scale).toFixed(1)).toString();
  });
}

function applyScanResult() {
  if (!LAST_SCAN_RESULT) {
    setScanStatus("No scan result to apply");
    return;
  }

  setValue("width", LAST_SCAN_RESULT.width);
  setValue("height", LAST_SCAN_RESULT.height);
  applyHolePattern(LAST_SCAN_RESULT.holePattern || []);

  CURRENT_PART = null;
  setText("infoBrand", "Scan Capture");
  setText("infoPartNumber", "SCAN-ONLY");
  setText("infoPatternName", "Image Detected");
  setText("infoPatternSource", "Camera / Upload");

  renderSVG();
  setScanStatus("Scan applied to SVG");
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

  safeEl("startCameraBtn")?.addEventListener("click", startCamera);
  safeEl("stopCameraBtn")?.addEventListener("click", stopCamera);
  safeEl("captureBtn")?.addEventListener("click", capturePhoto);
  safeEl("processScanBtn")?.addEventListener("click", processScan);
  safeEl("applyScanBtn")?.addEventListener("click", applyScanResult);

  safeEl("imageUpload")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    loadUploadedImage(file);
    event.target.value = "";
  });
}

// ----------------------
// Init
// ----------------------
async function initApp() {
  attachEvents();
  createHiddenImportInput();
  clearInfoPanel();
  clearSearchUI();
  setScanStatus("Ready to scan");
  await loadDatabaseFile();
}

document.addEventListener("DOMContentLoaded", initApp);
