const SIGNUP_SEED_QUOTA_MAP = new Map(
  [
    ["577121025", 13000],
    ["24539+577125082", 7950],
    ["662021143", 10950],
    ["24779+584961594", 4223],
    ["24779+707823120", 5224],
    ["24780+594659610", 6301],
    ["24779+662475201", 7562],
    ["24780+671994966", 7640],
    ["24780+674289752", 5247],
    ["24779+584960669", 81626],
    ["24814+586102784", 800],
    ["24599+578904479", 5707],
    ["25000+593507810", 20000],
    ["24854+587406690", 2734],
    ["24779+584984992", 1941],
    ["24778+598166151", 3748],
    ["24779+598158599", 0],
    ["892699712", 897],
    ["692311403", 759],
    ["24779+584964887", 810],
    ["577032392", 12000],
    ["575865347", 60000],
    ["588681110", 50000],
    ["581142094", 50000],
    ["25805+632482520", 1800],
  ].map(([gameRoleId, quota]) => [String(gameRoleId).trim(), Number(quota)])
);

function getSignupSeedQuota(gameRoleId) {
  const normalizedGameRoleId = String(gameRoleId || "").trim();
  if (!normalizedGameRoleId) return 0;
  return Number(SIGNUP_SEED_QUOTA_MAP.get(normalizedGameRoleId) || 0);
}

module.exports = {
  SIGNUP_SEED_QUOTA_MAP,
  getSignupSeedQuota,
};
