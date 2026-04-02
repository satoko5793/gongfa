const devStore = require("../../services/dev-store");

function notFoundError(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

async function changeUserQuota({ userId, changeAmount, remark, actorUserId }) {
  const result = devStore.changeUserQuota(userId, changeAmount, remark, actorUserId);
  if (!result) {
    throw notFoundError("user_not_found");
  }
  return result;
}

async function updateUserStatus({ userId, status, actorUserId }) {
  const updated = devStore.updateUserStatus(userId, status, actorUserId);
  if (!updated) {
    throw notFoundError("user_not_found");
  }
  return updated;
}

module.exports = {
  mode: "file",
  changeUserQuota,
  updateUserStatus,
};
