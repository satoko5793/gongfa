const legacyLocalNameById = {
  1: "随便掌",
  2: "折凳要诀",
  101: "退堂鼓",
  102: "杠上开花手",
  201: "夜行刀法",
  202: "摸牌透视眼",
  301: "杠精罡气",
  302: "摸鱼化劲",
  401: "对穿肠文攻术",
  402: "小强不死身",
  403: "跑路草上飞",
  501: "运气诀",
};

const legacyAssetNameById = {
  1: "suibianzhang",
  2: "zhedeng-yaojue",
  101: "tuitanggu",
  102: "gangshang-kaihuashou",
  201: "yexing-daofa",
  202: "mopai-toushiyan",
  301: "gangjing-gangqi",
  302: "moyu-huajin",
  401: "duichuanchang-wengongshu",
  402: "xiaoqiang-busishen",
  403: "paolu-caoshangfei",
  501: "yunqijue",
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

function getLocalAssetUrl(legacyId) {
  const assetName = legacyAssetNameById[Number(legacyId)];
  return assetName ? `/gongfa/${assetName}.png` : null;
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
      ? `S${scheduleId} 当前赛季`
      : scheduleId > 0
        ? `S${scheduleId} 老卡`
        : "未知赛季",
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
        name: legacyLocalNameById[legacyId] || `功法 ${legacyId}`,
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
