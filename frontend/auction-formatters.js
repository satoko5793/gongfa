const AUCTION_STATUS_LABELS = {
  live: "进行中",
  scheduled: "即将开始",
  ended: "等待结算",
  settled: "已成交",
  cancelled: "已流拍",
};

export function formatAuctionStatusLabel(status) {
  const normalizedStatus = String(status || "").trim();
  return AUCTION_STATUS_LABELS[normalizedStatus] || status || "-";
}

export function formatAuctionCountdownDuration(targetTimeMs, nowMs = Date.now()) {
  const diff = Math.max(0, Number(targetTimeMs || 0) - Number(nowMs || 0));
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}天 ${String(hours).padStart(2, "0")}时`;
  if (hours > 0) return `${hours}时 ${String(minutes).padStart(2, "0")}分`;
  if (minutes > 0) return `${minutes}分 ${String(seconds).padStart(2, "0")}秒`;
  return `${seconds}秒`;
}

export function getAuctionCountdownMeta(auction, nowMs = Date.now()) {
  const status = String(auction?.status || "").trim();
  const startMs = new Date(auction?.starts_at || "").getTime();
  const endMs = new Date(auction?.ends_at || "").getTime();
  if (status === "scheduled") {
    if (Number.isFinite(startMs) && startMs > nowMs) {
      return {
        tone: "scheduled",
        label: "距开始",
        value: formatAuctionCountdownDuration(startMs, nowMs),
      };
    }
    return { tone: "scheduled", label: "即将开始", value: "请稍后刷新" };
  }
  if (status === "live") {
    if (Number.isFinite(endMs) && endMs > nowMs) {
      const remaining = endMs - nowMs;
      return {
        tone:
          remaining <= 10 * 60 * 1000 ? "urgent" : remaining <= 60 * 60 * 1000 ? "soon" : "live",
        label: "距结束",
        value: formatAuctionCountdownDuration(endMs, nowMs),
      };
    }
    return { tone: "ended", label: "已结束", value: "等待管理员结算" };
  }
  if (status === "ended") return { tone: "ended", label: "已结束", value: "等待管理员结算" };
  if (status === "settled") return { tone: "settled", label: "拍卖结果", value: "已成交" };
  if (status === "cancelled") return { tone: "cancelled", label: "拍卖结果", value: "已流拍" };
  return { tone: "default", label: "拍卖状态", value: formatAuctionStatusLabel(status) };
}
