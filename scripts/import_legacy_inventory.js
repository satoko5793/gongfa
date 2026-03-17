const fs = require("fs");
const path = require("path");

const devStore = require("../backend/src/services/dev-store");
const { parseLegacyProducts } = require("../backend/src/services/legacy-parser");
const { getLegacyTier, parseTermMetrics } = require("../backend/src/services/pricing");

function parseArgs(argv) {
  const args = { apply: false, input: "" };
  for (const token of argv) {
    if (token === "--apply") {
      args.apply = true;
      continue;
    }
    if (!args.input) {
      args.input = token;
    }
  }
  return args;
}

function isDualTermGold(product) {
  if (getLegacyTier(product?.legacy_id) !== "gold") return false;
  const metrics = parseTermMetrics(product?.ext_attrs || "");
  return Number(metrics.fire_count || 0) + Number(metrics.calm_count || 0) >= 2;
}

function summarize(products) {
  const summary = {
    total: products.length,
    gold: 0,
    red: 0,
    orange: 0,
    purple: 0,
    blue: 0,
    green: 0,
    dualTermGold: 0,
  };

  for (const product of products) {
    const tier = getLegacyTier(product.legacy_id);
    if (summary[tier] !== undefined) {
      summary[tier] += 1;
    }
    if (isDualTermGold(product)) {
      summary.dualTermGold += 1;
    }
  }

  return summary;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.error("Usage: node scripts/import_legacy_inventory.js <legacy_getinfo.json> [--apply]");
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), args.input);
  const rawJson = fs.readFileSync(inputPath, "utf8");
  const source = JSON.parse(rawJson);
  const parsedProducts = parseLegacyProducts(source);
  const summary = summarize(parsedProducts);

  const dualTermGoldProducts = parsedProducts.filter(isDualTermGold);

  console.log(
    JSON.stringify(
      {
        input: inputPath,
        apply: args.apply,
        summary,
        excluded_dual_term_gold: dualTermGoldProducts.map((item) => ({
          uid: item.uid,
          legacy_id: item.legacy_id,
          name: item.name,
          ext_attrs: item.ext_attrs,
          stock: item.stock,
        })),
      },
      null,
      2
    )
  );

  if (!args.apply) {
    return;
  }

  const result = devStore.importCards({
    sourceType: "upload",
    sourceFileName: path.basename(inputPath),
    rawJson,
    importedBy: null,
    parsedProducts,
  });

  const adminProducts = devStore.listAdminProducts();
  const excludedIds = adminProducts
    .filter((product) => isDualTermGold(product))
    .map((product) => Number(product.id))
    .filter(Boolean);

  if (excludedIds.length > 0) {
    devStore.bulkUpdateProductStatus(excludedIds, "off_sale", null);
  }

  console.log(
    JSON.stringify(
      {
        imported_count: result.parsed_count,
        off_sale_dual_term_gold_count: excludedIds.length,
      },
      null,
      2
    )
  );
}

main();
