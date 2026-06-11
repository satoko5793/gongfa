import { escapeHtml } from "../shared.js?v=release-20260611-151806";

export function renderDrawServiceLoggedOutContent() {
  return `
    <div class="stack-item">登录后才能提交代抽订单，可选择额度支付档或自己的卷转赠档。</div>
    <div class="actions">
      <a class="ghost-link" href="#bind">去登录</a>
    </div>
  `;
}

function getDrawServiceConfig(ctx) {
  return ctx.drawServiceConfig && typeof ctx.drawServiceConfig === "object"
    ? ctx.drawServiceConfig
    : {
        enabled: true,
        unit_label: "1w",
        min_draw_wan: 1,
        step_draw_wan: 1,
        preset_draw_wan: [1, 3, 5, 10],
        default_tier_key: "tier_8",
        rule_notice: "旧规则“抽 5w 返 1w”已取消；用户按本次选择的档位和抽取数量提交代抽单。",
        video_notice: "如需代抽视频确认真实性，请在“我的信息”里的“订单帮助”中，通过微信群联系管理员索取。",
        tiers: [
          { key: "tier_6", label: "6 元 / 1w", price_yuan_per_wan: 6, description: "仅返珍" },
          { key: "tier_7", label: "7 元 / 1w", price_yuan_per_wan: 7, description: "返双词条、珍、双满金、单 3.0" },
          { key: "tier_8", label: "8 元 / 1w", price_yuan_per_wan: 8, description: "返珍、双词条、2.5+ 单词条、双满紫-金卡" },
          { key: "tier_10", label: "10 元 / 1w", price_yuan_per_wan: 10, description: "返全金红、双满橙紫" },
          { key: "own_scrolls", label: "自己的卷", price_yuan_per_wan: 8, description: "自己的卷需先转残卷给管理员，按 8 元 / 1w 档", payment_method: "residual_transfer", transfer_amount_per_wan: 10000 },
          { key: "season_member_benefit", label: "赛季会员福利 6.5 元 / 1w", price_yuan_per_wan: 6.5, description: "开通赛季会员可用；每赛季一次，最多 5w，抽 5w 按第三档返还规则", requires_season_member: true, max_draw_wan_per_order: 5, once_per_season: true },
        ],
      };
}

export function renderDrawServiceZoneContent(ctx, profile, quota, selectedState = {}) {
  if (!profile) {
    return renderDrawServiceLoggedOutContent();
  }

  const balance = Number(quota?.balance ?? profile?.quota_balance ?? 0);
  const config = getDrawServiceConfig(ctx);
  const tiers = Array.isArray(config.tiers) ? config.tiers : [];
  const selectedTierKey =
    selectedState?.tierKey || ctx.selectedTierKey || config.default_tier_key || tiers[0]?.key || "";
  const selectedTier =
    tiers.find((tier) => String(tier.key || "") === String(selectedTierKey || "")) || tiers[0] || {};
  const selectedDrawWan = Number(
    selectedState?.drawAmountWan || ctx.selectedDrawWan || config.min_draw_wan || 1
  );
  const minDrawWan = Number(config.min_draw_wan || 1);
  const stepDrawWan = Number(config.step_draw_wan || 1);
  const unitLabel = escapeHtml(config.unit_label || "1w");
  const enabled = config.enabled !== false;
  const isSeasonMember = Boolean(profile?.season_member_active);
  const isResidualTransferTier =
    String(selectedTier?.payment_method || "").trim() === "residual_transfer";
  const transferAmount = Math.max(
    1,
    Math.ceil(selectedDrawWan * Number(selectedTier?.transfer_amount_per_wan || 10000))
  );
  const residualUnitLabel = escapeHtml(ctx.rechargeConfig?.residual_unit_label || "残卷");
  const transferTargetRoleId = escapeHtml(ctx.rechargeConfig?.residual_admin_role_id || "584967604");
  const transferTargetRoleName = escapeHtml(ctx.rechargeConfig?.residual_admin_role_name || "admin残卷");
  const transferTargetGameName = escapeHtml(ctx.rechargeConfig?.residual_admin_game_name || "繁星✨秋");

  return `
    <form id="draw-service-form" class="form-grid" novalidate>
      <div class="draw-service-balance-card">
        <strong>当前可用额度 ${balance}</strong>
        <span class="muted">${enabled ? "额度支付档会立即扣额度；自己的卷档提交后等待管理员核对残卷转赠。" : "代抽提交暂时关闭，可先查看当前档位规则。"}</span>
      </div>
      <div class="draw-tier-list" role="radiogroup" aria-label="代抽档位">
        ${tiers
          .map((tier) => {
            const active = String(tier.key || "") === String(selectedTierKey || "");
            const requiresMember = Boolean(tier.requires_season_member);
            const locked = requiresMember && !isSeasonMember;
            const paymentMethod = String(tier.payment_method || "").trim();
            return `
              <button
                class="draw-tier-card ${active ? "active" : ""} ${locked ? "disabled" : ""}"
                type="button"
                role="radio"
                aria-checked="${active ? "true" : "false"}"
                data-draw-service-tier-key="${escapeHtml(tier.key)}"
                ${enabled ? "" : "disabled"}
              >
                <span>${escapeHtml(tier.label || tier.key)}</span>
                <strong>${Number(tier.price_yuan_per_wan || 0)} 元 / ${unitLabel}</strong>
                <small>${escapeHtml(
                  `${locked ? `${tier.description || ""}（需先开通本赛季会员）` : tier.description || ""}${
                    paymentMethod === "residual_transfer" ? "（残卷转赠审核）" : ""
                  }`
                )}</small>
              </button>
            `;
          })
          .join("")}
      </div>
      <label>
        抽取数量（w）
        <input
          id="draw-service-wan-input"
          type="number"
          min="${minDrawWan}"
          step="${stepDrawWan}"
          value="${selectedDrawWan}"
          required
          ${enabled ? "" : "disabled"}
        />
      </label>
      <div class="preset-list">
        ${(Array.isArray(config.preset_draw_wan) ? config.preset_draw_wan : [1, 3, 5, 10])
          .map((amount) => `
              <button
                class="preset-chip ${Number(selectedDrawWan) === Number(amount) ? "active" : ""}"
                type="button"
                data-draw-service-wan="${Number(amount)}"
                ${enabled ? "" : "disabled"}
              >${Number(amount)}w</button>
            `)
          .join("")}
      </div>
      <div class="recharge-quote">
        <span class="muted">本次代抽预览</span>
        <strong id="draw-service-quote-value"></strong>
        <span id="draw-service-quote-detail" class="muted"></span>
      </div>
      ${
        isResidualTransferTier
          ? `
              <div class="guest-transfer-card">
                <div class="guest-transfer-card-title"><strong>${transferTargetRoleName}</strong></div>
                <div class="muted">游戏名称：${transferTargetGameName}</div>
                <div class="muted">游戏 ID：${transferTargetRoleId}</div>
                <div class="muted">本次需要转赠：<span id="draw-service-transfer-amount">${Number(transferAmount)} ${residualUnitLabel}</span></div>
                <div class="stack-list">
                  <div class="stack-item">在游戏内把${residualUnitLabel}转给管理员后，再提交下面的信息等待核对。</div>
                </div>
              </div>
              <div class="guest-transfer-fields">
                <label>游戏 ID
                  <input id="draw-service-role-id" type="text" maxlength="60" value="${escapeHtml(profile?.game_role_id || "")}" placeholder="例如 584967604" required />
                </label>
                <label>角色名
                  <input id="draw-service-role-name" type="text" maxlength="60" value="${escapeHtml(profile?.game_role_name || "")}" placeholder="例如 繁星秋" required />
                </label>
                <label>昵称（可选）
                  <input id="draw-service-nickname" type="text" maxlength="60" value="${escapeHtml(profile?.nickname || "")}" placeholder="方便你这边识别即可" />
                </label>
                <label>转赠时间
                  <input id="draw-service-payment-reference" type="text" maxlength="100" placeholder="例如 19:42 已转残卷" required />
                </label>
                <label class="guest-transfer-field-span">补充说明（可选）
                  <textarea id="draw-service-payer-note" rows="3" placeholder="例如：已向 ${transferTargetRoleId} 转了 ${Number(transferAmount)} ${residualUnitLabel}"></textarea>
                </label>
              </div>
            `
          : ""
      }
      <div class="stack-item muted">
        ${escapeHtml(config.rule_notice || "旧规则“抽 5w 返 1w”已取消。")} ${escapeHtml(config.video_notice || "")}
      </div>
      <div class="actions">
        <button class="primary" type="submit" ${enabled ? "" : "disabled"}>提交代抽订单</button>
      </div>
    </form>
  `;
}
