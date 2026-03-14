const legacyLocalNameById = {
  1: "随便掌",
  2: "折凳要诀",
  101: "退堂鼓",
  102: "杠上开花手",
  201: "也行刀法",
  202: "摸牌透视眼",
  301: "杠精罡气",
  302: "摸鱼化劲",
  401: "对穿肠文攻术",
  402: "小强不死身",
  403: "跑路草上飞",
  501: "运气决",
};

const legacyAttrNameById = {
  1: "攻击",
  2: "血量",
  3: "血量",
  4: "速度",
  5: "破甲",
  6: "破甲抵抗",
  7: "精准",
  8: "格挡",
  9: "减伤",
  10: "暴击",
  11: "暴击抵抗",
  12: "爆伤",
  13: "爆伤抵抗",
  14: "技能伤害",
  15: "免控",
  16: "眩晕免疫",
  17: "冰冻免疫",
  18: "沉默免疫",
  19: "流血免疫",
  20: "中毒免疫",
  21: "灼烧免疫",
  604: "走火入魔",
  605: "气定神闲",
};

const scaledTermAttrIds = new Set([604, 605]);

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getMappedTermValue(attrId, rawValue) {
  const num = normalizeNumber(rawValue);
  if (!scaledTermAttrIds.has(Number(attrId))) return null;
  if (num === 0) return "0";
  return (num / 100).toFixed(1);
}

function extractAttrPairs(attrs, attrNums) {
  if (!attrs) return [];

  if (Array.isArray(attrs)) {
    return attrs
      .map((attrId, index) => {
        const rawValue = Array.isArray(attrNums)
          ? attrNums[index]
          : attrNums?.[attrId] ?? attrNums?.[String(attrId)];
        return { attrId: Number(attrId), rawValue: normalizeNumber(rawValue) };
      })
      .filter((item) => item.attrId);
  }

  if (typeof attrs === "object") {
    return Object.entries(attrs)
      .map(([attrId, rawValue]) => ({
        attrId: Number(attrId),
        rawValue: normalizeNumber(rawValue),
      }))
      .filter((item) => item.attrId);
  }

  return [];
}

function formatAttrPairs(attrs, attrNums) {
  const pairs = extractAttrPairs(attrs, attrNums);
  if (pairs.length === 0) return "无";
  return pairs
    .map((pair) => {
      const name = legacyAttrNameById[pair.attrId] || `属性${pair.attrId}`;
      const mapped = getMappedTermValue(pair.attrId, pair.rawValue);
      return `${name} ${mapped || pair.rawValue}`;
    })
    .join(" | ");
}

function getTermValues(entry) {
  const pairs = [
    ...extractAttrPairs(entry?.attrs, entry?.attrNums),
    ...extractAttrPairs(entry?.extAttrs, entry?.extAttrNums),
  ];
  const fireValues = [];
  const calmValues = [];
  for (const pair of pairs) {
    if (pair.attrId === 604) {
      const mapped = getMappedTermValue(pair.attrId, pair.rawValue) || "0";
      if (mapped !== "0") fireValues.push(mapped);
    }
    if (pair.attrId === 605) {
      const mapped = getMappedTermValue(pair.attrId, pair.rawValue) || "0";
      if (mapped !== "0") calmValues.push(mapped);
    }
  }
  return { fireValues, calmValues };
}

function formatTermSummary({ fireValues, calmValues }) {
  const list = [];
  fireValues.forEach((value) => list.push(`走火 ${value}`));
  calmValues.forEach((value) => list.push(`气定 ${value}`));
  return list.length > 0 ? list.join(" | ") : "无";
}

function getAttrValueById(entry, attrId) {
  const pairs = [
    ...extractAttrPairs(entry?.attrs, entry?.attrNums),
    ...extractAttrPairs(entry?.extAttrs, entry?.extAttrNums),
  ];
  const hit = pairs.find((item) => item.attrId === Number(attrId));
  return hit ? normalizeNumber(hit.rawValue) : 0;
}

function getAttackValue(entry) {
  const byId = getAttrValueById(entry, 1);
  if (byId > 0) return byId;
  if (Array.isArray(entry?.attrNums) && entry.attrNums.length > 0) {
    return normalizeNumber(entry.attrNums[0]);
  }
  return 0;
}

function getHpValue(entry) {
  const byId = getAttrValueById(entry, 2);
  if (byId > 0) return byId;
  if (Array.isArray(entry?.attrNums) && entry.attrNums.length > 1) {
    return normalizeNumber(entry.attrNums[1]);
  }
  return 0;
}

function getLocalAssetUrl(name) {
  if (!name) return null;
  return `./legacy-assets/${encodeURIComponent(name)}.png`;
}

function normalizeLegacyEntries(source) {
  if (!source || typeof source !== "object") return [];

  const storage = source?.roleLegacy?.legacyStorage || source?.legacyStorage;
  if (storage && typeof storage === "object" && !Array.isArray(storage)) {
    return Object.entries(storage).map(([storageKey, item]) => ({
      ...item,
      __storageKey: storageKey,
    }));
  }

  if (Array.isArray(source)) {
    if (source.some((item) => item && typeof item === "object" && item.uId)) {
      return source;
    }
    for (const item of source) {
      const nested = normalizeLegacyEntries(item);
      if (nested.length > 0) return nested;
    }
    return [];
  }

  for (const value of Object.values(source)) {
    if (!value || typeof value !== "object") continue;
    const nested = normalizeLegacyEntries(value);
    if (nested.length > 0) return nested;
  }

  return [];
}

function parseLegacyProducts(source) {
  const entries = normalizeLegacyEntries(source);
  const grouped = new Map();

  entries
    .map((entry, index) => {
      const storageId = Number(entry?.__storageKey || 0);
      const legacyId = Number(entry?.legacyId || storageId || 0);
      const uid = String(entry?.uId || entry?.uid || `${legacyId}-${index}`);
      const name = legacyLocalNameById[legacyId] || `功法 ${legacyId}`;
      const terms = getTermValues(entry);
      return {
        uid,
        legacy_id: legacyId,
        name,
        image_url: getLocalAssetUrl(name),
        attack_value: getAttackValue(entry),
        hp_value: getHpValue(entry),
        main_attrs: "",
        ext_attrs: formatTermSummary(terms),
        fire_signature: terms.fireValues.join(","),
        calm_signature: terms.calmValues.join(","),
      };
    })
    .filter((item) => item.legacy_id > 0)
    .forEach((item) => {
      const groupKey = [
        item.legacy_id,
        item.name,
        item.attack_value,
        item.hp_value,
        item.fire_signature,
        item.calm_signature,
      ].join("|");
      const existing = grouped.get(groupKey);
      if (existing) {
        existing.stock += 1;
        existing.source_uids.push(item.uid);
        return;
      }
      grouped.set(groupKey, {
        ...item,
        uid: groupKey,
        stock: 1,
        source_uids: [item.uid],
      });
    });

  return [...grouped.values()];
}

module.exports = { parseLegacyProducts };
