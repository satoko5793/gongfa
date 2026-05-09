let storeRuntime = null;
let bootstrapAttempted = false;

function configureStoreRuntime(nextRuntime = {}) {
  const previousRuntime = storeRuntime || {};
  const previousActions = previousRuntime.actions || {};
  const nextActions = nextRuntime.actions || {};

  storeRuntime = {
    ...previousRuntime,
    ...nextRuntime,
    actions: {
      ...previousActions,
      ...nextActions,
    },
  };

  return storeRuntime;
}

function getStoreRuntime() {
  if (!storeRuntime) {
    if (!bootstrapAttempted) {
      bootstrapAttempted = true;
      try {
        require("../../../services/dev-store");
      } catch (error) {
        if (!storeRuntime) {
          throw error;
        }
      }
    }
  }
  if (!storeRuntime) {
    throw new Error("store_runtime_not_configured");
  }
  return storeRuntime;
}

module.exports = {
  configureStoreRuntime,
  getStoreRuntime,
};
