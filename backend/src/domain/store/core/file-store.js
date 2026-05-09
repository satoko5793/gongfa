const fs = require("fs");

function createFileStore({ dataPath, defaultData, normalizeStoreData, clone }) {
  if (!dataPath) throw new Error("file_store_data_path_required");
  if (typeof defaultData !== "function") throw new Error("file_store_default_data_required");
  if (typeof normalizeStoreData !== "function") throw new Error("file_store_normalizer_required");
  if (typeof clone !== "function") throw new Error("file_store_clone_required");

  let readCache = null;

  function loadDataFromDisk() {
    if (!fs.existsSync(dataPath)) {
      return defaultData();
    }
    try {
      return normalizeStoreData(JSON.parse(fs.readFileSync(dataPath, "utf8")));
    } catch {
      return defaultData();
    }
  }

  function readStoreData(options = {}) {
    const { mutable = true } = options;

    if (!fs.existsSync(dataPath)) {
      readCache = null;
      return defaultData();
    }

    try {
      const stat = fs.statSync(dataPath);
      const cacheValid =
        readCache &&
        Number(readCache.mtimeMs) === Number(stat.mtimeMs) &&
        Number(readCache.size) === Number(stat.size);

      if (!cacheValid) {
        readCache = {
          mtimeMs: Number(stat.mtimeMs),
          size: Number(stat.size),
          data: loadDataFromDisk(),
        };
      }

      return mutable ? clone(readCache.data) : readCache.data;
    } catch {
      readCache = null;
      return defaultData();
    }
  }

  function writeStoreData(data) {
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(dataPath, serialized);
    try {
      const stat = fs.statSync(dataPath);
      readCache = {
        mtimeMs: Number(stat.mtimeMs),
        size: Number(stat.size),
        data: clone(data),
      };
    } catch {
      readCache = null;
    }
  }

  return {
    loadDataFromDisk,
    readStoreData,
    writeStoreData,
  };
}

module.exports = {
  createFileStore,
};
