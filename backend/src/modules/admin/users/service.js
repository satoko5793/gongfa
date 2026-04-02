const { getAdminUsersRepository } = require("./repository");

async function changeUserQuota(actorUser, userId, body = {}) {
  const repository = getAdminUsersRepository();
  return await repository.changeUserQuota({
    userId,
    changeAmount: body.change_amount,
    remark: body.remark || null,
    actorUserId: actorUser.id,
  });
}

async function updateUserStatus(actorUser, userId, status) {
  const repository = getAdminUsersRepository();
  return await repository.updateUserStatus({
    userId,
    status,
    actorUserId: actorUser.id,
  });
}

module.exports = {
  changeUserQuota,
  updateUserStatus,
};
