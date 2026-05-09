const usersStore = require("../../domain/store/repositories/users-file-store");

async function registerPasswordUser(payload) {
  return await usersStore.registerPasswordUser(payload);
}

async function loginPasswordUser(gameRoleId, password) {
  return await usersStore.loginPasswordUser(gameRoleId, password);
}

function bindUser(payload) {
  return usersStore.bindUser(payload);
}

function getCurrentUser(userId) {
  return usersStore.getUserById(userId);
}

module.exports = {
  registerPasswordUser,
  loginPasswordUser,
  bindUser,
  getCurrentUser,
};
