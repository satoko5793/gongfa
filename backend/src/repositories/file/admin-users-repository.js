const usersStore = require("../../domain/store/repositories/users-file-store");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function changeUserQuota({ userId, changeAmount, remark, actorUserId }) {
  const result = usersStore.changeUserQuota(userId, changeAmount, remark, actorUserId);
  if (!result) {
    throw notFoundError("user_not_found");
  }
  return result;
}

async function updateUserStatus({ userId, status, actorUserId }) {
  const updated = usersStore.updateUserStatus(userId, status, actorUserId);
  if (!updated) {
    throw notFoundError("user_not_found");
  }
  return updated;
}

async function updateUserHelperCapabilities({ userId, capabilities, actorUserId }) {
  const updated = usersStore.updateUserHelperCapabilities(userId, capabilities, actorUserId);
  if (!updated) {
    throw notFoundError("user_not_found");
  }
  return updated;
}

module.exports = {
  mode: "file",
  changeUserQuota,
  updateUserStatus,
  updateUserHelperCapabilities,
};
