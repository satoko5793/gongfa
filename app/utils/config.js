const localConfig = require("./config.local");
const trialConfig = require("./config.trial");
const prodConfig = require("./config.prod");

const FORCE_RUNTIME_ENV = "";

function getEnvVersion() {
  try {
    if (typeof wx !== "undefined" && typeof wx.getAccountInfoSync === "function") {
      const info = wx.getAccountInfoSync();
      return info?.miniProgram?.envVersion || "develop";
    }
  } catch (error) {
    console.warn("failed_to_read_env_version", error);
  }
  return "develop";
}

function resolveConfig() {
  if (FORCE_RUNTIME_ENV === "local") return localConfig;
  if (FORCE_RUNTIME_ENV === "trial") return trialConfig;
  if (FORCE_RUNTIME_ENV === "prod") return prodConfig;

  const envVersion = getEnvVersion();
  if (envVersion === "release") return prodConfig;
  if (envVersion === "trial") return trialConfig;
  return localConfig;
}

const currentConfig = resolveConfig();

module.exports = {
  ...currentConfig,
  APP_ENV_VERSION: getEnvVersion(),
};
