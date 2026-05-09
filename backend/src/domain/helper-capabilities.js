const HELPER_CAPABILITIES = Object.freeze({
  INVENTORY_SYNC_CURRENT: "inventory.sync_current",
  INVENTORY_SYNC_ALL: "inventory.sync_all",
  SNAPSHOT_CREATE: "snapshot.create",
  LOGS_READ: "logs.read",
  GAME_DAILY_TASKS: "game.daily_tasks",
  GAME_SALT_ROBOT_CLAIM: "game.salt_robot_claim",
  GAME_HANGUP_CLAIM: "game.hangup_claim",
  GAME_HANGUP_EXTEND: "game.hangup_extend",
  GAME_CLUB_CHECKIN: "game.club_checkin",
  GAME_CLUB_RANKING: "game.club_ranking",
  GAME_TOWER_CHALLENGE: "game.tower_challenge",
  GAME_ARENA_CHALLENGE: "game.arena_challenge",
});

const HELPER_V1_CAPABILITIES = Object.freeze(Object.values(HELPER_CAPABILITIES));
const HELPER_V1_CAPABILITY_SET = new Set(HELPER_V1_CAPABILITIES);

function normalizeHelperCapabilities(value) {
  const source = Array.isArray(value) ? value : [];
  return [...new Set(source.map((item) => String(item || "").trim()).filter((item) => HELPER_V1_CAPABILITY_SET.has(item)))];
}

function isHelperAdmin(user) {
  return String(user?.role || "").trim() === "admin";
}

function getUserHelperCapabilities(user) {
  if (isHelperAdmin(user)) return [...HELPER_V1_CAPABILITIES];
  return normalizeHelperCapabilities(user?.helper_capabilities);
}

function hasHelperCapability(user, capability) {
  return getUserHelperCapabilities(user).includes(String(capability || "").trim());
}

function hasAnyHelperCapability(user) {
  return getUserHelperCapabilities(user).length > 0;
}

module.exports = {
  HELPER_CAPABILITIES,
  HELPER_V1_CAPABILITIES,
  normalizeHelperCapabilities,
  getUserHelperCapabilities,
  hasHelperCapability,
  hasAnyHelperCapability,
};
