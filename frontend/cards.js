(() => {
  const state = {
    files: [],
    slots: [],
    clusters: [],
  };

  const el = {
    imageInput: document.getElementById("imageInput"),
    fileList: document.getElementById("fileList"),
    previewBtn: document.getElementById("previewBtn"),
    runBtn: document.getElementById("runBtn"),
    previewGrid: document.getElementById("previewGrid"),
    shopGrid: document.getElementById("shopGrid"),
    statusText: document.getElementById("statusText"),
    sortSelect: document.getElementById("sortSelect"),
    exportBtn: document.getElementById("exportBtn"),
    cardTpl: document.getElementById("shopCardTpl"),
    tabs: Array.from(document.querySelectorAll(".tab")),
    previewTab: document.getElementById("previewTab"),
    shopTab: document.getElementById("shopTab"),
  };

  const rarityRank = {
    unknown: 0,
    green: 1,
    blue: 2,
    purple: 3,
    orange: 4,
    red: 5,
    gold: 6,
  };

  const rarityLabel = {
    unknown: "未知",
    green: "绿色",
    blue: "蓝色",
    purple: "紫色",
    orange: "橙色",
    red: "红色",
    gold: "金色",
  };

  function setStatus(text) {
    el.statusText.textContent = text;
  }

  function getConfig() {
    const val = (id) => Number(document.getElementById(id).value);
    return {
      cols: val("cols"),
      rows: val("rows"),
      startX: val("startX"),
      startY: val("startY"),
      cellW: val("cellW"),
      cellH: val("cellH"),
      gapX: val("gapX"),
      gapY: val("gapY"),
      emptyStd: val("emptyStd"),
      mergeDistance: val("mergeDistance"),
    };
  }

  async function fileToImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const node = new Image();
        node.onload = () => resolve(node);
        node.onerror = reject;
        node.src = url;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function cropToCanvas(img, sx, sy, sw, sh, target = 128) {
    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, target, target);
    return canvas;
  }

  function calcStdDev(ctx, size) {
    const { data } = ctx.getImageData(0, 0, size, size);
    let mean = 0;
    let sq = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 8) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      n += 1;
      mean += gray;
      sq += gray * gray;
    }
    mean /= n;
    const variance = Math.max(0, sq / n - mean * mean);
    return Math.sqrt(variance);
  }

  function calcDHash(srcCanvas) {
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(srcCanvas, 0, 0, 9, 8);
    const { data } = ctx.getImageData(0, 0, 9, 8);

    let bits = "";
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const idx1 = (y * 9 + x) * 4;
        const idx2 = (y * 9 + (x + 1)) * 4;
        const g1 = data[idx1] * 0.299 + data[idx1 + 1] * 0.587 + data[idx1 + 2] * 0.114;
        const g2 = data[idx2] * 0.299 + data[idx2 + 1] * 0.587 + data[idx2 + 2] * 0.114;
        bits += g1 > g2 ? "1" : "0";
      }
    }
    return bits;
  }

  function hammingDistance(a, b) {
    let d = 0;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) d += 1;
    }
    return d;
  }

  function rgbToHsv(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;

    if (d !== 0) {
      if (max === rn) h = ((gn - bn) / d) % 6;
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : d / max;
    return { h, s, v: max };
  }

  function detectRarity(ctx, size) {
    const { data } = ctx.getImageData(0, 0, size, size);
    const margin = Math.max(4, Math.floor(size * 0.1));
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const border = x < margin || y < margin || x >= size - margin || y >= size - margin;
        if (!border) continue;
        const idx = (y * size + x) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count += 1;
      }
    }

    if (count === 0) return "unknown";
    r /= count;
    g /= count;
    b /= count;

    const { h, s, v } = rgbToHsv(r, g, b);
    if (v < 0.18 || s < 0.12) return "unknown";
    if (h >= 45 && h < 68 && s > 0.35 && v > 0.5) return "gold";
    if (h < 18 || h >= 344) return "red";
    if (h >= 18 && h < 45) return "orange";
    if (h >= 68 && h < 170) return "green";
    if (h >= 170 && h < 255) return "blue";
    if (h >= 255 && h < 340) return "purple";
    return "unknown";
  }

  async function extractSlots(previewOnly) {
    const cfg = getConfig();
    if (!state.files.length) {
      setStatus("请先上传截图");
      return;
    }

    state.slots = [];
    let index = 0;
    for (const file of state.files) {
      index += 1;
      setStatus(`解析中 ${index}/${state.files.length}: ${file.name}`);
      const img = await fileToImage(file);

      for (let row = 0; row < cfg.rows; row += 1) {
        for (let col = 0; col < cfg.cols; col += 1) {
          const x = cfg.startX + col * (cfg.cellW + cfg.gapX);
          const y = cfg.startY + row * (cfg.cellH + cfg.gapY);
          if (x + cfg.cellW > img.width || y + cfg.cellH > img.height) continue;

          const cropCanvas = cropToCanvas(img, x, y, cfg.cellW, cfg.cellH, 128);
          const ctx = cropCanvas.getContext("2d");
          const std = calcStdDev(ctx, 128);
          if (std < cfg.emptyStd) continue;

          const hash = calcDHash(cropCanvas);
          const rarity = detectRarity(ctx, 128);
          state.slots.push({
            hash,
            rarity,
            source: file.name,
            position: `r${row + 1}c${col + 1}`,
            thumb: cropCanvas.toDataURL("image/webp", 0.8),
          });
        }
      }
    }

    renderPreview();
    setStatus(`切片完成：${state.slots.length} 个非空卡槽`);
    if (!previewOnly) {
      clusterSlots();
      renderShop();
      switchTab("shop");
    }
  }

  function clusterSlots() {
    const cfg = getConfig();
    const clusters = [];

    for (const slot of state.slots) {
      let bestIndex = -1;
      let bestDistance = Infinity;

      for (let i = 0; i < clusters.length; i += 1) {
        const d = hammingDistance(slot.hash, clusters[i].hash);
        if (d < bestDistance) {
          bestDistance = d;
          bestIndex = i;
        }
      }

      if (bestIndex !== -1 && bestDistance <= cfg.mergeDistance) {
        const target = clusters[bestIndex];
        target.count += 1;
        target.members.push({ source: slot.source, position: slot.position });
        target.rarityVotes[slot.rarity] = (target.rarityVotes[slot.rarity] || 0) + 1;
      } else {
        clusters.push({
          hash: slot.hash,
          thumb: slot.thumb,
          count: 1,
          members: [{ source: slot.source, position: slot.position }],
          rarityVotes: { [slot.rarity]: 1 },
        });
      }
    }

    state.clusters = clusters.map((cluster, idx) => {
      const rarity = Object.entries(cluster.rarityVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
      return {
        ...cluster,
        id: idx + 1,
        rarity,
        name: loadCustomName(cluster.hash) || `未命名卡 #${idx + 1}`,
      };
    });

    setStatus(`识别完成：${state.clusters.length} 种卡，总计 ${state.slots.length} 张`);
  }

  function renderPreview() {
    el.previewGrid.innerHTML = "";
    if (!state.slots.length) {
      el.previewGrid.innerHTML = "<p>暂无切片结果</p>";
      return;
    }

    const limit = Math.min(260, state.slots.length);
    for (let i = 0; i < limit; i += 1) {
      const slot = state.slots[i];
      const node = document.createElement("article");
      node.className = "preview-item";
      node.innerHTML = `<img src="${slot.thumb}" alt="slot" /><span>${slot.source} ${slot.position}</span>`;
      el.previewGrid.appendChild(node);
    }
  }

  function sortClusters(list) {
    const mode = el.sortSelect.value;
    if (mode === "count-asc") {
      return [...list].sort((a, b) => a.count - b.count);
    }
    if (mode === "rarity") {
      return [...list].sort((a, b) => rarityRank[b.rarity] - rarityRank[a.rarity] || b.count - a.count);
    }
    return [...list].sort((a, b) => b.count - a.count);
  }

  function renderShop() {
    el.shopGrid.innerHTML = "";
    if (!state.clusters.length) {
      el.shopGrid.innerHTML = "<p>暂无库存结果</p>";
      return;
    }

    const clusters = sortClusters(state.clusters);
    for (const item of clusters) {
      const card = el.cardTpl.content.firstElementChild.cloneNode(true);
      const img = card.querySelector(".thumb");
      const badge = card.querySelector(".badge");
      const nameInput = card.querySelector(".name-input");
      const rarity = card.querySelector(".rarity");
      const count = card.querySelector(".count");

      img.src = item.thumb;
      badge.textContent = `x${item.count}`;
      nameInput.value = item.name;
      rarity.textContent = `稀有度: ${rarityLabel[item.rarity]}`;
      count.textContent = `数量: ${item.count}`;

      nameInput.addEventListener("change", () => {
        item.name = nameInput.value.trim() || item.name;
        saveCustomName(item.hash, item.name);
      });

      el.shopGrid.appendChild(card);
    }
  }

  function switchTab(tab) {
    const isPreview = tab === "preview";
    el.previewTab.classList.toggle("active", isPreview);
    el.shopTab.classList.toggle("active", !isPreview);
    el.tabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  }

  function saveCustomName(hash, name) {
    localStorage.setItem(`card-name:${hash}`, name);
  }

  function loadCustomName(hash) {
    return localStorage.getItem(`card-name:${hash}`);
  }

  function exportJson() {
    if (!state.clusters.length) {
      setStatus("没有可导出的库存");
      return;
    }

    const payload = {
      generated_at: new Date().toISOString(),
      total_cards: state.slots.length,
      total_types: state.clusters.length,
      items: state.clusters.map((c) => ({
        name: c.name,
        hash: c.hash,
        rarity: c.rarity,
        count: c.count,
        samples: c.members.slice(0, 5),
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `card-inventory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("已导出 JSON");
  }

  function bindEvents() {
    el.imageInput.addEventListener("change", (e) => {
      state.files = Array.from(e.target.files || []);
      el.fileList.textContent = state.files.length
        ? `${state.files.length} 张截图: ${state.files.map((f) => f.name).join(" / ")}`
        : "还没选择截图";
      setStatus(state.files.length ? "截图已载入，等待处理" : "等待上传截图");
    });

    el.previewBtn.addEventListener("click", async () => {
      switchTab("preview");
      await extractSlots(true);
    });

    el.runBtn.addEventListener("click", async () => {
      await extractSlots(false);
    });

    el.sortSelect.addEventListener("change", () => renderShop());
    el.exportBtn.addEventListener("click", exportJson);

    el.tabs.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
  }

  bindEvents();
})();
