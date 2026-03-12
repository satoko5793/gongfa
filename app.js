(() => {
  const state = {
    files: [],
    slices: [],
    clusters: [],
    ocrEnabled: true,
  };

  const dom = {
    fileInput: document.getElementById("fileInput"),
    fileSummary: document.getElementById("fileSummary"),
    status: document.getElementById("status"),
    gridPreviewBtn: document.getElementById("gridPreviewBtn"),
    extractBtn: document.getElementById("extractBtn"),
    exportBtn: document.getElementById("exportBtn"),
    presetBackpackBtn: document.getElementById("presetBackpackBtn"),
    ocrToggle: document.getElementById("ocrToggle"),
    gridCanvas: document.getElementById("gridCanvas"),
    sliceGrid: document.getElementById("sliceGrid"),
    shopGrid: document.getElementById("shopGrid"),
    resultSummary: document.getElementById("resultSummary"),
    itemTpl: document.getElementById("itemTpl"),
    sortSelect: document.getElementById("sortSelect"),
    tabs: Array.from(document.querySelectorAll(".tab")),
    previewTab: document.getElementById("previewTab"),
    shopTab: document.getElementById("shopTab"),
  };

  const rarityOrder = {
    unknown: 0,
    green: 1,
    blue: 2,
    purple: 3,
    orange: 4,
    red: 5,
    gold: 6,
  };

  const rarityLabel = {
    unknown: "unknown",
    green: "green",
    blue: "blue",
    purple: "purple",
    orange: "orange",
    red: "red",
    gold: "gold",
  };

  function setStatus(text) {
    dom.status.textContent = text;
  }

  function cfg() {
    const readNum = (id) => Number(document.getElementById(id).value);
    return {
      cols: readNum("cols"),
      rows: readNum("rows"),
      startX: readNum("startX"),
      startY: readNum("startY"),
      slotW: readNum("slotW"),
      slotH: readNum("slotH"),
      gapX: readNum("gapX"),
      gapY: readNum("gapY"),
      emptyThreshold: readNum("emptyThreshold"),
      mergeThreshold: readNum("mergeThreshold"),
    };
  }

  function setCfg(next) {
    const writeNum = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = String(value);
    };
    writeNum("cols", next.cols);
    writeNum("rows", next.rows);
    writeNum("startX", next.startX);
    writeNum("startY", next.startY);
    writeNum("slotW", next.slotW);
    writeNum("slotH", next.slotH);
    writeNum("gapX", next.gapX);
    writeNum("gapY", next.gapY);
    if (typeof next.emptyThreshold === "number") writeNum("emptyThreshold", next.emptyThreshold);
    if (typeof next.mergeThreshold === "number") writeNum("mergeThreshold", next.mergeThreshold);
  }

  async function fileToImage(file) {
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function drawGridOverlay(img, c) {
    const ctx = dom.gridCanvas.getContext("2d");
    dom.gridCanvas.width = img.width;
    dom.gridCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(194,79,43,0.85)";

    for (let r = 0; r < c.rows; r += 1) {
      for (let col = 0; col < c.cols; col += 1) {
        const x = c.startX + col * (c.slotW + c.gapX);
        const y = c.startY + r * (c.slotH + c.gapY);
        ctx.strokeRect(x, y, c.slotW, c.slotH);
      }
    }
  }

  function sliceCanvas(img, x, y, w, h, outSize = 120) {
    const cv = document.createElement("canvas");
    cv.width = outSize;
    cv.height = outSize;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, x, y, w, h, 0, 0, outSize, outSize);
    return cv;
  }

  function sliceCanvasRect(img, x, y, w, h) {
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w));
    cv.height = Math.max(1, Math.round(h));
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, x, y, w, h, 0, 0, cv.width, cv.height);
    return cv;
  }

  function grayscaleStd(cv) {
    const ctx = cv.getContext("2d");
    const { data } = ctx.getImageData(0, 0, cv.width, cv.height);
    let n = 0;
    let mean = 0;
    let sumSq = 0;

    for (let i = 0; i < data.length; i += 12) {
      const g = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      n += 1;
      mean += g;
      sumSq += g * g;
    }

    mean /= n;
    return Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  }

  function dHash(cv) {
    const tiny = document.createElement("canvas");
    tiny.width = 9;
    tiny.height = 8;
    const ctx = tiny.getContext("2d");
    ctx.drawImage(cv, 0, 0, 9, 8);
    const { data } = ctx.getImageData(0, 0, 9, 8);

    let bits = "";
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const i1 = (y * 9 + x) * 4;
        const i2 = (y * 9 + x + 1) * 4;
        const g1 = data[i1] * 0.299 + data[i1 + 1] * 0.587 + data[i1 + 2] * 0.114;
        const g2 = data[i2] * 0.299 + data[i2 + 1] * 0.587 + data[i2 + 2] * 0.114;
        bits += g1 > g2 ? "1" : "0";
      }
    }
    return bits;
  }

  function hamming(a, b) {
    let dist = 0;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) dist += 1;
    }
    return dist;
  }

  function rgbToHsv(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = (bn - rn) / delta + 2;
      else h = (rn - gn) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : delta / max;
    return { h, s, v: max };
  }

  function detectRarity(cv) {
    const ctx = cv.getContext("2d");
    const { data } = ctx.getImageData(0, 0, cv.width, cv.height);
    const m = Math.floor(cv.width * 0.1);
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;

    for (let y = 0; y < cv.height; y += 2) {
      for (let x = 0; x < cv.width; x += 2) {
        const border = x < m || y < m || x >= cv.width - m || y >= cv.height - m;
        if (!border) continue;
        const idx = (y * cv.width + x) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        n += 1;
      }
    }

    if (!n) return "unknown";
    r /= n;
    g /= n;
    b /= n;

    const hsv = rgbToHsv(r, g, b);
    if (hsv.v < 0.2 || hsv.s < 0.12) return "unknown";
    if (hsv.h >= 45 && hsv.h < 70 && hsv.s > 0.35) return "gold";
    if (hsv.h < 18 || hsv.h >= 344) return "red";
    if (hsv.h >= 18 && hsv.h < 45) return "orange";
    if (hsv.h >= 70 && hsv.h < 170) return "green";
    if (hsv.h >= 170 && hsv.h < 255) return "blue";
    if (hsv.h >= 255 && hsv.h < 340) return "purple";
    return "unknown";
  }

  function saveName(hash, name) {
    localStorage.setItem(`inventory-name:${hash}`, name);
  }

  function loadName(hash) {
    return localStorage.getItem(`inventory-name:${hash}`);
  }

  function renderSlices() {
    dom.sliceGrid.innerHTML = "";
    if (!state.slices.length) {
      dom.sliceGrid.innerHTML = "<p>No slices</p>";
      return;
    }

    const max = Math.min(state.slices.length, 300);
    for (let i = 0; i < max; i += 1) {
      const slice = state.slices[i];
      const node = document.createElement("article");
      node.className = "slice";
      const extra = [slice.typeText, slice.valueText, slice.attackText, slice.healthText].filter(Boolean).join(" | ");
      node.innerHTML = `<img src="${slice.dataUrl}" alt="slice" /><span>${slice.source} ${slice.slot}${extra ? ` · ${extra}` : ""}</span>`;
      dom.sliceGrid.appendChild(node);
    }
  }

  function sortClusters(list) {
    const mode = dom.sortSelect.value;
    if (mode === "count-asc") return [...list].sort((a, b) => a.count - b.count);
    if (mode === "rarity") {
      return [...list].sort((a, b) => {
        const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
        return rarityDiff || b.count - a.count;
      });
    }
    return [...list].sort((a, b) => b.count - a.count);
  }

  function renderShop() {
    dom.shopGrid.innerHTML = "";
    if (!state.clusters.length) {
      dom.shopGrid.innerHTML = "<p>No inventory</p>";
      dom.resultSummary.textContent = "No result";
      return;
    }

    const sorted = sortClusters(state.clusters);
    dom.resultSummary.textContent = `${sorted.length} card types / ${state.slices.length} total cards`;

    for (const entry of sorted) {
      const card = dom.itemTpl.content.firstElementChild.cloneNode(true);
      card.querySelector(".thumb").src = entry.preview;
      card.querySelector(".count").textContent = `x${entry.count}`;
      const input = card.querySelector(".name");
      input.value = entry.name;
      input.addEventListener("change", () => {
        entry.name = input.value.trim() || entry.name;
        saveName(entry.hash, entry.name);
      });
      card.querySelector(".type").textContent = entry.typeText || "未识别";
      card.querySelector(".value").textContent = entry.valueText || "未识别";
      card.querySelector(".attack").textContent = entry.attackText || "未识别";
      card.querySelector(".health").textContent = entry.healthText || "未识别";
      card.querySelector(".qi").textContent = entry.qiText || "未识别";
      card.querySelector(".zhou").textContent = entry.zhouText || "未识别";
      card.querySelector(".tags").textContent = entry.tagsText || "未识别";
      card.querySelector(".rarity-text").textContent = entry.rarityText || "未识别";
      card.querySelector(".rarity").textContent = rarityLabel[entry.rarity];
      card.querySelector(".hash").textContent = entry.hash.slice(0, 8);
      dom.shopGrid.appendChild(card);
    }
  }

  function clusterSlices() {
    const threshold = cfg().mergeThreshold;
    const clusters = [];

    for (const slice of state.slices) {
      let bestIdx = -1;
      let bestDist = Infinity;

      for (let i = 0; i < clusters.length; i += 1) {
        const dist = hamming(slice.hash, clusters[i].hash);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0 && bestDist <= threshold) {
        const c = clusters[bestIdx];
        c.count += 1;
        c.members.push({ source: slice.source, slot: slice.slot });
        c.rarityVotes[slice.rarity] = (c.rarityVotes[slice.rarity] || 0) + 1;
        if (slice.typeText) c.typeVotes[slice.typeText] = (c.typeVotes[slice.typeText] || 0) + 1;
        if (slice.valueText) c.valueVotes[slice.valueText] = (c.valueVotes[slice.valueText] || 0) + 1;
        if (slice.attackText) c.attackVotes[slice.attackText] = (c.attackVotes[slice.attackText] || 0) + 1;
        if (slice.healthText) c.healthVotes[slice.healthText] = (c.healthVotes[slice.healthText] || 0) + 1;
        if (slice.qiText) c.qiVotes[slice.qiText] = (c.qiVotes[slice.qiText] || 0) + 1;
        if (slice.zhouText) c.zhouVotes[slice.zhouText] = (c.zhouVotes[slice.zhouText] || 0) + 1;
        if (slice.tagsText) c.tagsVotes[slice.tagsText] = (c.tagsVotes[slice.tagsText] || 0) + 1;
        if (slice.rarityText) c.rarityTextVotes[slice.rarityText] = (c.rarityTextVotes[slice.rarityText] || 0) + 1;
      } else {
        clusters.push({
          hash: slice.hash,
          preview: slice.dataUrl,
          count: 1,
          members: [{ source: slice.source, slot: slice.slot }],
          rarityVotes: { [slice.rarity]: 1 },
          typeVotes: slice.typeText ? { [slice.typeText]: 1 } : {},
          valueVotes: slice.valueText ? { [slice.valueText]: 1 } : {},
          attackVotes: slice.attackText ? { [slice.attackText]: 1 } : {},
          healthVotes: slice.healthText ? { [slice.healthText]: 1 } : {},
          qiVotes: slice.qiText ? { [slice.qiText]: 1 } : {},
          zhouVotes: slice.zhouText ? { [slice.zhouText]: 1 } : {},
          tagsVotes: slice.tagsText ? { [slice.tagsText]: 1 } : {},
          rarityTextVotes: slice.rarityText ? { [slice.rarityText]: 1 } : {},
        });
      }
    }

    state.clusters = clusters.map((c, idx) => {
      const rarity = Object.entries(c.rarityVotes).sort((a, b) => b[1] - a[1])[0][0];
      const typeText = Object.keys(c.typeVotes).length
        ? Object.entries(c.typeVotes).sort((a, b) => b[1] - a[1])[0][0]
        : "";
      const valueText = Object.keys(c.valueVotes).length
        ? Object.entries(c.valueVotes).sort((a, b) => b[1] - a[1])[0][0]
        : "";
      const attackText = Object.keys(c.attackVotes).length
        ? Object.entries(c.attackVotes).sort((a, b) => b[1] - a[1])[0][0]
        : "";
      const healthText = Object.keys(c.healthVotes).length
        ? Object.entries(c.healthVotes).sort((a, b) => b[1] - a[1])[0][0]
        : "";
      const qiText = Object.keys(c.qiVotes).length
        ? Object.entries(c.qiVotes).sort((a, b) => b[1] - a[1])[0][0]
        : "";
      const zhouText = Object.keys(c.zhouVotes).length
        ? Object.entries(c.zhouVotes).sort((a, b) => b[1] - a[1])[0][0]
        : "";
      const tagsText = Object.keys(c.tagsVotes).length
        ? Object.entries(c.tagsVotes).sort((a, b) => b[1] - a[1])[0][0]
        : "";
      const rarityText = Object.keys(c.rarityTextVotes).length
        ? Object.entries(c.rarityTextVotes).sort((a, b) => b[1] - a[1])[0][0]
        : "";
      return {
        ...c,
        name: loadName(c.hash) || `Card ${idx + 1}`,
        rarity,
        typeText,
        valueText,
        attackText,
        healthText,
        qiText,
        zhouText,
        tagsText,
        rarityText,
      };
    });
  }

  function ensureOcrAvailable() {
    if (!state.ocrEnabled) return false;
    if (typeof window.Tesseract === "undefined") {
      setStatus("OCR 未加载");
      return false;
    }
    return true;
  }

  function cropCanvas(src, x, y, w, h) {
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w));
    cv.height = Math.max(1, Math.round(h));
    const ctx = cv.getContext("2d");
    ctx.drawImage(src, x, y, w, h, 0, 0, cv.width, cv.height);
    return cv;
  }

  function scaleCanvas(src, scale) {
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(src.width * scale));
    cv.height = Math.max(1, Math.round(src.height * scale));
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, cv.width, cv.height);
    return cv;
  }

  function thresholdCanvas(src) {
    const cv = document.createElement("canvas");
    cv.width = src.width;
    cv.height = src.height;
    const ctx = cv.getContext("2d");
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
    const { data } = img;
    for (let i = 0; i < data.length; i += 4) {
      const g = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const v = g > 140 ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  function computeOtsuThreshold(gray) {
    const hist = new Array(256).fill(0);
    for (let i = 0; i < gray.length; i += 1) hist[gray[i]] += 1;
    const total = gray.length;
    let sum = 0;
    for (let i = 0; i < 256; i += 1) sum += i * hist[i];
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 128;
    for (let i = 0; i < 256; i += 1) {
      wB += hist[i];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;
      sumB += i * hist[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = i;
      }
    }
    return threshold;
  }

  function prepareOcrCanvas(src, scale) {
    const scaled = scaleCanvas(src, scale);
    const cv = document.createElement("canvas");
    cv.width = scaled.width;
    cv.height = scaled.height;
    const ctx = cv.getContext("2d");
    ctx.drawImage(scaled, 0, 0);
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
    const { data } = img;
    const gray = new Uint8ClampedArray(cv.width * cv.height);
    let gSum = 0;
    for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
      const g = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      gray[j] = g;
      gSum += g;
    }
    const threshold = computeOtsuThreshold(gray);
    let whiteCount = 0;
    for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
      const v = gray[j] > threshold ? 255 : 0;
      if (v === 255) whiteCount += 1;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    const whiteRatio = whiteCount / gray.length;
    if (whiteRatio < 0.5) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  function rotateCanvas90(src) {
    const cv = document.createElement("canvas");
    cv.width = src.height;
    cv.height = src.width;
    const ctx = cv.getContext("2d");
    ctx.translate(cv.width / 2, cv.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);
    return cv;
  }

  async function recognizeText(canvas, lang, options) {
    const result = await window.Tesseract.recognize(canvas, lang, options || {});
    return result.data.text || "";
  }

  function cleanTypeText(text) {
    return text.replace(/\s+/g, "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
  }

  function cleanValueText(text) {
    return text.replace(/\s+/g, "").replace(/[^0-9+\-万亿.%点]/g, "");
  }

  function cleanNumberText(text) {
    return text.replace(/\s+/g, "").replace(/[^0-9+\-万亿.%~\-]/g, "");
  }

  function cleanTagText(text) {
    return text.replace(/\s+/g, "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
  }

  async function recognizeSliceText(rawCanvas) {
    const w = rawCanvas.width;
    const h = rawCanvas.height;
    const valueRegion = cropCanvas(rawCanvas, w * 0.06, h * 0.66, w * 0.9, h * 0.3);
    const typeRegion = cropCanvas(rawCanvas, w * 0.72, h * 0.16, w * 0.24, h * 0.58);
    const attackRegion = cropCanvas(rawCanvas, w * 0.06, h * 0.72, w * 0.88, h * 0.12);
    const healthRegion = cropCanvas(rawCanvas, w * 0.06, h * 0.84, w * 0.88, h * 0.12);
    const tagsRegion = cropCanvas(rawCanvas, w * 0.08, h * 0.5, w * 0.84, h * 0.14);
    const qiRegion = cropCanvas(rawCanvas, w * 0.03, h * 0.52, w * 0.22, h * 0.18);
    const zhouRegion = cropCanvas(rawCanvas, w * 0.75, h * 0.52, w * 0.22, h * 0.18);
    const rarityRegion = cropCanvas(rawCanvas, w * 0.03, h * 0.04, w * 0.3, h * 0.16);
    const valuePrep = prepareOcrCanvas(valueRegion, 3);
    const typePrep = prepareOcrCanvas(rotateCanvas90(typeRegion), 3);
    const attackPrep = prepareOcrCanvas(attackRegion, 4);
    const healthPrep = prepareOcrCanvas(healthRegion, 4);
    const tagsPrep = prepareOcrCanvas(tagsRegion, 3);
    const qiPrep = prepareOcrCanvas(qiRegion, 4);
    const zhouPrep = prepareOcrCanvas(zhouRegion, 4);
    const rarityPrep = prepareOcrCanvas(rarityRegion, 4);
    const valueText = cleanValueText(
      await recognizeText(valuePrep, "chi_sim+eng", {
        tessedit_char_whitelist: "0123456789+-万亿.%点攻防血生力",
        tessedit_pageseg_mode: "6",
      })
    );
    const attackLine = cleanValueText(
      await recognizeText(attackPrep, "chi_sim+eng", {
        tessedit_char_whitelist: "0123456789+-万亿.%点攻击",
        tessedit_pageseg_mode: "7",
      })
    );
    const healthLine = cleanValueText(
      await recognizeText(healthPrep, "chi_sim+eng", {
        tessedit_char_whitelist: "0123456789+-万亿.%点血量",
        tessedit_pageseg_mode: "7",
      })
    );
    const typeText = cleanTypeText(
      await recognizeText(typePrep, "chi_sim+eng", { tessedit_pageseg_mode: "6" })
    );
    const tagsText = cleanTagText(
      await recognizeText(tagsPrep, "chi_sim+eng", { tessedit_pageseg_mode: "6" })
    );
    const qiText = cleanNumberText(
      await recognizeText(qiPrep, "chi_sim+eng", {
        tessedit_char_whitelist: "0123456789%+-~.",
        tessedit_pageseg_mode: "7",
      })
    );
    const zhouText = cleanNumberText(
      await recognizeText(zhouPrep, "chi_sim+eng", {
        tessedit_char_whitelist: "0123456789%+-~.",
        tessedit_pageseg_mode: "7",
      })
    );
    const rarityText = cleanTagText(
      await recognizeText(rarityPrep, "chi_sim+eng", { tessedit_pageseg_mode: "7" })
    );
    const attackMatch = attackLine.match(/攻击?([+\-]?\d[\d万亿.%]*)/);
    const healthMatch = healthLine.match(/血量?([+\-]?\d[\d万亿.%]*)/);
    const attackText = attackMatch ? attackMatch[1] : attackLine.replace(/攻击/g, "");
    const healthText = healthMatch ? healthMatch[1] : healthLine.replace(/血量/g, "");
    return { valueText, typeText, attackText, healthText, qiText, zhouText, tagsText, rarityText };
  }

  async function runOcr() {
    if (!ensureOcrAvailable()) return;
    for (let i = 0; i < state.slices.length; i += 1) {
      const slice = state.slices[i];
      if (!slice.rawCanvas) continue;
      setStatus(`OCR ${i + 1}/${state.slices.length}`);
      const { valueText, typeText, attackText, healthText, qiText, zhouText, tagsText, rarityText } =
        await recognizeSliceText(slice.rawCanvas);
      slice.valueText = valueText || "";
      slice.typeText = typeText || "";
      slice.attackText = attackText || "";
      slice.healthText = healthText || "";
      slice.qiText = qiText || "";
      slice.zhouText = zhouText || "";
      slice.tagsText = tagsText || "";
      slice.rarityText = rarityText || "";
    }
  }

  function average(list) {
    if (!list.length) return 0;
    return list.reduce((sum, v) => sum + v, 0) / list.length;
  }

  function smoothArray(arr, radius) {
    const out = new Array(arr.length).fill(0);
    const r = Math.max(1, Math.floor(radius));
    let windowSum = 0;
    let count = 0;
    for (let i = 0; i < arr.length; i += 1) {
      const addIdx = i + r;
      if (addIdx < arr.length) {
        windowSum += arr[addIdx];
        count += 1;
      }
      const removeIdx = i - r - 1;
      if (removeIdx >= 0) {
        windowSum -= arr[removeIdx];
        count -= 1;
      }
      out[i] = count ? windowSum / count : 0;
    }
    return out;
  }

  function computeEdgeSums(img, yStart, yEnd, xStart, xEnd) {
    const cv = document.createElement("canvas");
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, cv.width, cv.height);
    const w = cv.width;
    const h = cv.height;
    const col = new Array(w).fill(0);
    const row = new Array(h).fill(0);
    const step = Math.max(2, Math.round(Math.min(w, h) / 260));
    const ys = Math.max(1, Math.round(h * yStart));
    const ye = Math.min(h - 2, Math.round(h * yEnd));
    const xs = Math.max(1, Math.round(w * xStart));
    const xe = Math.min(w - 2, Math.round(w * xEnd));
    for (let y = ys; y <= ye; y += step) {
      for (let x = xs; x <= xe; x += step) {
        const idx = (y * w + x) * 4;
        const g1 = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        const idxR = idx + 4;
        const g2 = data[idxR] * 0.299 + data[idxR + 1] * 0.587 + data[idxR + 2] * 0.114;
        const idxD = idx + w * 4;
        const g3 = data[idxD] * 0.299 + data[idxD + 1] * 0.587 + data[idxD + 2] * 0.114;
        col[x] += Math.abs(g1 - g2);
        row[y] += Math.abs(g1 - g3);
      }
    }
    return { col, row, w, h, xs, xe, ys, ye };
  }

  function pickPeaks(arr, minDistance, threshold) {
    const peaks = [];
    let last = -Infinity;
    for (let i = 1; i < arr.length - 1; i += 1) {
      const v = arr[i];
      if (v < threshold) continue;
      if (v >= arr[i - 1] && v >= arr[i + 1]) {
        if (i - last < minDistance) {
          if (peaks.length && v > peaks[peaks.length - 1].value) {
            peaks[peaks.length - 1] = { index: i, value: v };
            last = i;
          }
        } else {
          peaks.push({ index: i, value: v });
          last = i;
        }
      }
    }
    return peaks.map((p) => p.index).sort((a, b) => a - b);
  }

  function buildLineSequence(peaks, count, minSpacing, maxSpacing) {
    for (let i = 0; i < peaks.length; i += 1) {
      for (let j = i + 1; j < peaks.length; j += 1) {
        const spacing = peaks[j] - peaks[i];
        if (spacing < minSpacing || spacing > maxSpacing) continue;
        const tol = spacing * 0.28;
        const seq = [peaks[i]];
        let ok = true;
        for (let k = 1; k < count; k += 1) {
          const target = peaks[i] + k * spacing;
          let best = null;
          let bestDist = Infinity;
          for (const p of peaks) {
            const d = Math.abs(p - target);
            if (d < bestDist) {
              bestDist = d;
              best = p;
            }
          }
          if (best === null || bestDist > tol) {
            ok = false;
            break;
          }
          seq.push(best);
        }
        if (ok) return { seq, spacing };
      }
    }
    return null;
  }

  function detectGridFromImage(img, cols, rows) {
    const sums = computeEdgeSums(img, 0.46, 0.92, 0.08, 0.92);
    const colSmooth = smoothArray(sums.col, Math.max(2, Math.round(sums.w * 0.01)));
    const rowSmooth = smoothArray(sums.row, Math.max(2, Math.round(sums.h * 0.01)));
    const colValues = colSmooth.slice(sums.xs, sums.xe);
    const rowValues = rowSmooth.slice(sums.ys, sums.ye);
    const colAvg = average(colValues);
    const rowAvg = average(rowValues);
    const colStd = Math.sqrt(average(colValues.map((v) => (v - colAvg) ** 2)));
    const rowStd = Math.sqrt(average(rowValues.map((v) => (v - rowAvg) ** 2)));
    const colPeaks = pickPeaks(colSmooth, Math.round(sums.w * 0.03), colAvg + colStd * 0.9).filter(
      (p) => p >= sums.xs && p <= sums.xe
    );
    const rowPeaks = pickPeaks(rowSmooth, Math.round(sums.h * 0.04), rowAvg + rowStd * 0.9).filter(
      (p) => p >= sums.ys && p <= sums.ye
    );
    if (colPeaks.length < cols + 1 || rowPeaks.length < rows + 1) return null;
    const colSeq = buildLineSequence(colPeaks, cols + 1, Math.round(sums.w * 0.1), Math.round(sums.w * 0.4));
    const rowSeq = buildLineSequence(rowPeaks, rows + 1, Math.round(sums.h * 0.08), Math.round(sums.h * 0.3));
    if (!colSeq || !rowSeq) return null;
    const desiredRatio = 1.25;
    let slotW = Math.round(colSeq.spacing * 0.92);
    let gapX = Math.round(colSeq.spacing - slotW);
    let slotH = Math.round(slotW * desiredRatio);
    if (slotH > rowSeq.spacing * 0.92) {
      slotH = Math.round(rowSeq.spacing * 0.92);
      slotW = Math.round(slotH / desiredRatio);
      gapX = Math.round(colSeq.spacing - slotW);
    }
    const gapY = Math.round(rowSeq.spacing - slotH);
    const startX = Math.round(colSeq.seq[0] + gapX * 0.5);
    const startY = Math.round(rowSeq.seq[0] + gapY * 0.5);
    if (!slotW || !slotH) return null;
    return { cols, rows, startX, startY, slotW, slotH, gapX, gapY };
  }

  async function applyBackpackPreset() {
    if (!state.files.length) {
      setStatus("Select screenshots first");
      return;
    }
    const cols = 4;
    const rows = 2;
    setCfg({
      cols,
      rows,
      startX: 38,
      startY: 340,
      slotW: 80,
      slotH: 132,
      gapX: 8,
      gapY: 15,
      emptyThreshold: 10,
      mergeThreshold: 8,
    });
    setStatus("已应用背包2x4预设");
  }

  async function runExtract() {
    if (!state.files.length) {
      setStatus("Select screenshots first");
      return;
    }

    const c = cfg();
    state.slices = [];

    let i = 0;
    for (const file of state.files) {
      i += 1;
      setStatus(`Processing ${i}/${state.files.length}: ${file.name}`);
      const img = await fileToImage(file);

      for (let row = 0; row < c.rows; row += 1) {
        for (let col = 0; col < c.cols; col += 1) {
          const x = c.startX + col * (c.slotW + c.gapX);
          const y = c.startY + row * (c.slotH + c.gapY);
          if (x + c.slotW > img.width || y + c.slotH > img.height) continue;

          const cv = sliceCanvas(img, x, y, c.slotW, c.slotH, 120);
          const rawCanvas = sliceCanvasRect(img, x, y, c.slotW, c.slotH);
          const std = grayscaleStd(cv);
          if (std < c.emptyThreshold) continue;

          state.slices.push({
            source: file.name,
            slot: `r${row + 1}c${col + 1}`,
            dataUrl: cv.toDataURL("image/webp", 0.82),
            hash: dHash(cv),
            rarity: detectRarity(cv),
            rawCanvas,
            typeText: "",
            valueText: "",
            attackText: "",
            healthText: "",
            qiText: "",
            zhouText: "",
            tagsText: "",
            rarityText: "",
          });
        }
      }
    }

    if (state.ocrEnabled) {
      await runOcr();
    }
    renderSlices();
    clusterSlices();
    renderShop();
    switchTab("shop");
    setStatus(`Done: ${state.clusters.length} types / ${state.slices.length} cards`);
  }

  async function runGridPreview() {
    if (!state.files.length) {
      setStatus("Select screenshots first");
      return;
    }

    const img = await fileToImage(state.files[0]);
    drawGridOverlay(img, cfg());
    switchTab("preview");
    setStatus(`Grid preview on ${state.files[0].name}`);
  }

  function exportJson() {
    if (!state.clusters.length) {
      setStatus("Nothing to export");
      return;
    }

    const payload = {
      generated_at: new Date().toISOString(),
      card_types: state.clusters.length,
      total_cards: state.slices.length,
      items: state.clusters.map((c) => ({
        hash: c.hash,
        name: c.name,
        rarity: c.rarity,
        type_text: c.typeText,
        value_text: c.valueText,
        attack_text: c.attackText,
        health_text: c.healthText,
        qi_text: c.qiText,
        zhou_text: c.zhouText,
        tags_text: c.tagsText,
        rarity_text: c.rarityText,
        count: c.count,
        sample_slots: c.members.slice(0, 8),
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported JSON");
  }

  function switchTab(tab) {
    const preview = tab === "preview";
    dom.previewTab.classList.toggle("active", preview);
    dom.shopTab.classList.toggle("active", !preview);
    for (const t of dom.tabs) t.classList.toggle("active", t.dataset.tab === tab);
  }

  function bind() {
    dom.fileInput.addEventListener("change", () => {
      state.files = Array.from(dom.fileInput.files || []);
      dom.fileSummary.textContent = state.files.length
        ? `${state.files.length} file(s): ${state.files.map((f) => f.name).join(", ")}`
        : "No files selected";
      setStatus(state.files.length ? "Files loaded" : "Idle");
    });

    dom.gridPreviewBtn.addEventListener("click", runGridPreview);
    dom.extractBtn.addEventListener("click", runExtract);
    dom.exportBtn.addEventListener("click", exportJson);
    dom.sortSelect.addEventListener("change", renderShop);
    dom.presetBackpackBtn.addEventListener("click", applyBackpackPreset);
    dom.ocrToggle.addEventListener("change", () => {
      state.ocrEnabled = dom.ocrToggle.checked;
      setStatus(state.ocrEnabled ? "OCR 已启用" : "OCR 已关闭");
    });

    for (const tab of dom.tabs) {
      tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    }
  }

  bind();
})();
