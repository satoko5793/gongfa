const { parseLegacyProducts } = require("../../../services/legacy-parser");
const { getAdminImportsRepository } = require("./repository");

function unwrapRawJson(rawValue) {
  let value = rawValue;
  while (typeof value === "string") {
    value = JSON.parse(value);
  }
  return value;
}

function buildImportSummary(result) {
  const importRow = result?.import || {};
  return {
    import: {
      id: importRow.id || null,
      source_type: importRow.source_type || null,
      source_file_name: importRow.source_file_name || null,
      imported_by: importRow.imported_by || null,
      created_at: importRow.created_at || null,
    },
    parsed_count: Number(result?.parsed_count || 0),
  };
}

async function importCardsJson(actorUser, body = {}) {
  const rawJson = unwrapRawJson(body.raw_json);
  const parsedProducts = parseLegacyProducts(rawJson);
  if (parsedProducts.length === 0) {
    const err = new Error("legacy_cards_not_found");
    err.statusCode = 400;
    throw err;
  }

  const repository = getAdminImportsRepository();
  const result = await repository.importCards({
    sourceType: body.source_type || "upload",
    sourceFileName: body.source_file_name || null,
    rawJson,
    importedBy: actorUser.id,
    parsedProducts,
  });
  return buildImportSummary(result);
}

module.exports = {
  importCardsJson,
};
