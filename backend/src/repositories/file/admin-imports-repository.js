const productsStore = require("../../domain/store/repositories/products-file-store");

async function importCards({ sourceType, sourceFileName, rawJson, importedBy, parsedProducts }) {
  return productsStore.importCards({
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
