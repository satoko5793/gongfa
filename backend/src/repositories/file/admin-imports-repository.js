const devStore = require("../../services/dev-store");

async function importCards({ sourceType, sourceFileName, rawJson, importedBy, parsedProducts }) {
  return devStore.importCards({
    sourceType,
    sourceFileName,
    rawJson,
    importedBy,
    parsedProducts,
  });
}

module.exports = {
  mode: "file",
  importCards,
};
