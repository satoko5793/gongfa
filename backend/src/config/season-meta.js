const { getRechargeConfig } = require("./recharge-config");

function parseSeasonScheduleId(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.floor(numeric);
  }

  const text = String(value || "").trim();
  if (!text) return null;

  const match = text.match(/S\s*([0-9]+)/i);
  if (!match) return null;

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

function getConfiguredCurrentSeasonScheduleId(rechargeConfig = null) {
  const envScheduleId = parseSeasonScheduleId(process.env.CURRENT_SCHEDULE_ID);
  if (envScheduleId) return envScheduleId;

  const config = rechargeConfig || getRechargeConfig();
  return parseSeasonScheduleId(config?.season_member_season_label) || null;
}

function buildCardSeasonMeta({ scheduleId, currentScheduleId } = {}) {
  const normalizedScheduleId = parseSeasonScheduleId(scheduleId);
  const normalizedCurrentScheduleId = parseSeasonScheduleId(currentScheduleId);
  const isCurrentSeason =
    Boolean(normalizedScheduleId) &&
    Boolean(normalizedCurrentScheduleId) &&
    normalizedScheduleId === normalizedCurrentScheduleId;

  return {
    schedule_id: normalizedScheduleId,
    current_schedule_id: normalizedScheduleId ? normalizedCurrentScheduleId : null,
    is_current_season: isCurrentSeason,
    season_tag: isCurrentSeason ? "current" : "legacy",
    season_label: normalizedScheduleId ? `S${normalizedScheduleId}` : "-",
    season_display: isCurrentSeason
      ? `S${normalizedScheduleId} 当前赛季`
      : normalizedScheduleId
        ? `S${normalizedScheduleId} 老卡`
        : "未知赛季",
  };
}

function applyCardSeasonMeta(product, { currentScheduleId } = {}) {
  if (!product || typeof product !== "object") return product;

  return {
    ...product,
    ...buildCardSeasonMeta({
      scheduleId: product.schedule_id,
      currentScheduleId:
        currentScheduleId === undefined ? product.current_schedule_id : currentScheduleId,
    }),
  };
}

module.exports = {
  parseSeasonScheduleId,
  getConfiguredCurrentSeasonScheduleId,
  buildCardSeasonMeta,
  applyCardSeasonMeta,
};
