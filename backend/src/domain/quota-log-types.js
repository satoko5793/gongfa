const QUOTA_LOG_TYPES = Object.freeze({
  ADMIN_ADD: "admin_add",
  ADMIN_SUBTRACT: "admin_subtract",
  RECHARGE_CREDIT: "recharge_credit",
  BEGINNER_GUIDE_REWARD: "beginner_guide_reward",
  SIGNUP_SEED_CREDIT: "signup_seed_credit",
  MEMBER_BONUS: "member_bonus",
  ORDER_DEDUCT: "order_deduct",
  ORDER_REFUND: "order_refund",
  DRAW_SERVICE_REBATE: "draw_service_rebate",
  SEASON_MEMBER_CREDIT: "season_member_credit",
});

const QUOTA_LOG_TYPE_VALUES = Object.freeze(Object.values(QUOTA_LOG_TYPES));

module.exports = {
  QUOTA_LOG_TYPES,
  QUOTA_LOG_TYPE_VALUES,
};
