export function renderDrawServiceLoggedOutContent() {
  return `
    <div class="stack-item">登录后才能提交代抽订单，系统会直接从你的额度里扣除。</div>
    <div class="actions">
      <a class="ghost-link" href="#bind">去登录</a>
    </div>
  `;
}

export function renderDrawServiceZoneContent(ctx, profile, quota, selectedAmount) {
  if (!profile) {
    return renderDrawServiceLoggedOutContent();
  }

  const balance = Number(quota?.balance ?? profile?.quota_balance ?? 0);

  return `
    <form id="draw-service-form" class="form-grid" novalidate>
      <div class="draw-service-balance-card">
        <strong>当前可用额度 ${balance}</strong>
        <span class="muted">代抽单提交后会立即扣额度，管理员确认完成后按规则返还卡和阶段奖励。</span>
      </div>
      <label>
        代抽额度
        <input
          id="draw-service-amount-input"
          type="number"
          min="${ctx.minQuota}"
          step="${ctx.stepQuota}"
          value="${selectedAmount}"
          required
        />
      </label>
      <div class="preset-list">
        ${ctx.presetAmounts
          .map(
            (amount) => `
              <button
                class="preset-chip ${Number(selectedAmount) === Number(amount) ? "active" : ""}"
                type="button"
                data-draw-service-amount="${amount}"
              >${amount} 额度</button>
            `
          )
          .join("")}
      </div>
      <div class="recharge-quote">
        <span class="muted">本次代抽预览</span>
        <strong id="draw-service-quote-value"></strong>
        <span id="draw-service-quote-detail" class="muted"></span>
      </div>
      <div class="stack-item muted">
        返还卡由管理员代抽后人工录入；如需代抽视频确认真实性，请在“我的信息”里的“订单帮助”中，通过微信群联系管理员索取。
      </div>
      <div class="actions">
        <button class="primary" type="submit">提交代抽订单</button>
      </div>
    </form>
  `;
}
