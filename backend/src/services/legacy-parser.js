const legacyLocalNameById = {
  1: "\u968f\u4fbf\u638c",
  2: "\u6298\u51f3\u8981\u8bc0",
  101: "\u9000\u5802\u9f13",
  102: "\u6760\u4e0a\u5f00\u82b1\u624b",
  201: "\u4e5f\u884c\u5200\u6cd5",
  202: "\u6478\u724c\u900f\u89c6\u773c",
  301: "\u6760\u7cbe\u7f61\u6c14",
  302: "\u6478\u9c7c\u5316\u52b2",
  401: "\u5bf9\u7a7f\u80a0\u6587\u653b\u672f",
  402: "\u5c0f\u5f3a\u4e0d\u6b7b\u8eab",
  403: "\u8dd1\u8def\u8349\u4e0a\u98de",
  501: "\u8fd0\u6c14\u51b3",
  601: "\u73cd \u8fd0\u6c14\u51b3",
  602: "\u73cd \u8fde\u73af\u9a6c\u540e\u70ae",
  603: "\u73cd \u4e7e\u5764\u4e00\u63b7",
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
  fireValues.forEach((value) => list.push(`\u8d70\u706b ${value}`));
  calmValues.forEach((value) => list.push(`\u6c14\u5b9a ${value}`));
  return list.length > 0 ? list.join(" | ") : "\u65e0";
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

function getLocalAssetUrl(legacyId) {
  const localName = legacyLocalNameById[Number(legacyId)];
  return localName ? `./legacy-assets/${encodeURIComponent(localName)}.png` : null;
}

function normalizeLegacyEntries(source) {
  if (!source || typeof source !== "object") return [];

  const currentScheduleId = Number(source?.roleLegacy?.scheduleId || source?.scheduleId || 0);
  const storage = source?.roleLegacy?.legacyStorage || source?.legacyStorage;

  if (storage && typeof storage === "object" && !Array.isArray(storage)) {
    return Object.entries(storage).map(([storageKey, item]) => ({
      ...item,
      __storageKey: storageKey,
      __currentScheduleId: currentScheduleId,
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

function buildSeasonMeta(entry) {
  const scheduleId = Number(entry?.scheduleId || 0);
  const currentScheduleId = Number(entry?.__currentScheduleId || 0);
  const isCurrentSeason =
    scheduleId > 0 && currentScheduleId > 0 && scheduleId === currentScheduleId;

  return {
    schedule_id: scheduleId || null,
    current_schedule_id: currentScheduleId || null,
    is_current_season: isCurrentSeason,
    season_tag: isCurrentSeason ? "current" : "legacy",
    season_label: scheduleId > 0 ? `S${scheduleId}` : "-",
    season_display: isCurrentSeason
      ? `S${scheduleId} \u5f53\u524d\u8d5b\u5b63`
      : scheduleId > 0
        ? `S${scheduleId} \u8001\u5361`
        : "\u672a\u77e5\u8d5b\u5b63",
  };
}

function parseLegacyProducts(source) {
  const entries = normalizeLegacyEntries(source);
  const grouped = new Map();

  entries
    .map((entry, index) => {
      const storageId = Number(entry?.__storageKey || 0);
      const legacyId = Number(entry?.legacyId || storageId || 0);
      const uid = String(entry?.uId || entry?.uid || `${legacyId}-${index}`);
      const terms = getTermValues(entry);
      return {
        uid,
        legacy_id: legacyId,
        name: legacyLocalNameById[legacyId] || `\u529f\u6cd5 ${legacyId}`,
        image_url: getLocalAssetUrl(legacyId),
        attack_value: getAttackValue(entry),
        hp_value: getHpValue(entry),
        main_attrs: "",
        ext_attrs: formatTermSummary(terms),
        fire_signature: terms.fireValues.join(","),
        calm_signature: terms.calmValues.join(","),
        ...buildSeasonMeta(entry),
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
        item.schedule_id,
        item.season_tag,
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
