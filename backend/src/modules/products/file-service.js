const productsStore = require("../../domain/store/repositories/products-file-store");
const ordersStore = require("../../domain/store/repositories/orders-file-store");
const usersStore = require("../../domain/store/repositories/users-file-store");
const { getRechargeConfig } = require("../../config/recharge-config");

function getProductsRechargeConfig() {
  return getRechargeConfig(usersStore.getRechargeConfig());
}

function listPublicProducts(filters = {}) {
  return productsStore.listPublicProducts(filters);
}

function getPublicProductById(productId, options = {}) {
  return productsStore.getPublicProductById(productId, options);
}

function listPublicRecentOrders(limit = 32) {
  return ordersStore.listOrders({ status: "confirmed", limit });
}

function listPublicAuctions(status = "all") {
  return productsStore.listPublicAuctions(status);
}

module.exports = {
  getProductsRechargeConfig,
  listPublicProducts,
  getPublicProductById,
  listPublicRecentOrders,
  listPublicAuctions,
};
