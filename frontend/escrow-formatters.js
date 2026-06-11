export const ESCROW_STATUS_LABELS = {
  awaiting_payment_review: "待平台确认收款",
  escrowed: "已托管，待卖家发货",
  delivered: "已发货，待买家确认",
  disputed: "纠纷处理中",
  completed: "已完成",
  refunded: "已退款",
  cancelled: "已取消",
};

export const ESCROW_SETTLEMENT_LABELS = {
  pending_auto: "待自动结算",
  pending_payment_review: "待确认收款",
  pending_manual: "待人工结算",
  settled: "已结算",
  refunded: "已退款",
  cancelled: "已取消",
};

export function formatEscrowStatus(status) {
  return ESCROW_STATUS_LABELS[status] || status || "-";
}

export function formatEscrowSettlement(status) {
  return ESCROW_SETTLEMENT_LABELS[status] || status || "-";
}

export function formatEscrowPayment(trade) {
  const method = String(trade?.payment_method || "").trim();
  if (method === "quota") return `额度 ${Number(trade.amount || trade.amount_quota || 0)}`;
  if (method === "residual") {
    return `残卷 ${Number(trade.transfer_amount || trade.amount || 0)} ${trade.transfer_unit || "残卷"}`;
  }
  return `人民币 ${Number(trade?.amount_yuan || trade?.amount || 0)} 元`;
}

export function getEscrowBuyerNextStep(trade) {
  const status = String(trade?.status || "").trim();
  if (status === "awaiting_payment_review") return "已提交付款信息，等待平台确认收款。";
  if (status === "escrowed") return "资金已托管，等待卖家发卡。";
  if (status === "delivered") return "卖家已发卡，请确认是否收到；有问题可以发起纠纷。";
  if (status === "disputed") return "纠纷已提交，等待管理员裁定。";
  if (status === "completed") return "交易已完成。";
  if (status === "refunded") return "交易已退款。";
  if (status === "cancelled") return "交易已取消。";
  return "等待交易状态更新。";
}

export function getEscrowSellerNextStep(trade) {
  const status = String(trade?.status || "").trim();
  if (status === "awaiting_payment_review") return "买家已下单，等待平台确认收款后再发卡。";
  if (status === "escrowed") return "平台已托管，请发卡并提交发货说明和证据。";
  if (status === "delivered") return "已提交发货，等待买家确认；48 小时未处理会自动确认。";
  if (status === "disputed") return "买家发起纠纷，请保留发卡证据，等待管理员处理。";
  if (status === "completed") {
    return String(trade?.settlement_status || "") === "pending_manual"
      ? "买家已确认，等待平台线下结算。"
      : "交易已完成并结算。";
  }
  if (status === "refunded") return "交易已退款给买家。";
  if (status === "cancelled") return "交易已取消。";
  return "等待交易状态更新。";
}
