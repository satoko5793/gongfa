import { loadSession } from "./shared.js?v=release-20260611-151806";
import { bootDeferredPageEntry } from "./page-entry-bootstrap.js?v=release-20260611-151806";
import { applyEntryNavSessionState, getEntrySessionProfile } from "./page-entry-session.js?v=release-20260611-151806";
import { bindWakeOnHelperIntent, prepareHelperLiteShell } from "./page-entry-helper-lite.js?v=release-20260611-151806";

const helperLabSection = document.getElementById("helper-lab");
const helperLabBadge = document.getElementById("helper-lab-badge");
const helperLabNote = document.getElementById("helper-lab-note");
const helperBindMessage = document.getElementById("helper-bind-message");
const helperOpenBindPopupBtn = document.getElementById("helper-open-bind-popup-btn");
const helperSaveBindBtn = document.getElementById("helper-save-bind-btn");
const helperClearBindBtn = document.getElementById("helper-clear-bind-btn");
const helperReadSnapshotBtn = document.getElementById("helper-read-snapshot-btn");
const helperSyncCurrentInventoryBtn = document.getElementById("helper-sync-current-inventory-btn");
const helperSyncAllInventoryBtn = document.getElementById("helper-sync-all-inventory-btn");
const helperBuyPermanentSlotBtn = document.getElementById("helper-buy-permanent-slot-btn");
const helperBuySeasonalSlotBtn = document.getElementById("helper-buy-seasonal-slot-btn");
const helperClearPreviewBtn = document.getElementById("helper-clear-preview-btn");

const sessionProfile = getEntrySessionProfile(loadSession());
const hasSession = Boolean(loadSession()?.token);

const entry = bootDeferredPageEntry("script", "./app.js?v=release-20260611-151806", {
  idleTimeout: hasSession ? 500 : 1800,
  fallbackDelay: hasSession ? 100 : 600,
  autoBoot: false,
  wakeTargets: [
    helperOpenBindPopupBtn,
    helperSaveBindBtn,
    helperClearBindBtn,
    helperReadSnapshotBtn,
    helperSyncCurrentInventoryBtn,
    helperSyncAllInventoryBtn,
    helperBuyPermanentSlotBtn,
    helperBuySeasonalSlotBtn,
  ],
  beforeBoot: () => {
    applyEntryNavSessionState(sessionProfile);
    prepareHelperLiteShell({
      profile: sessionProfile,
      helperLabSection,
      helperLabBadge,
      helperLabNote,
      helperBindMessage,
      helperClearPreviewBtn,
    });
  },
});

bindWakeOnHelperIntent({
  helperBindMessage,
  ensureAppModule: entry.ensureAppModule,
  buttons: [
    [helperOpenBindPopupBtn, "正在加载绑定组件，请稍后再点一次。"],
    [helperSaveBindBtn, "正在加载绑定组件，请稍后再点一次。"],
    [helperClearBindBtn, "正在加载绑定组件，请稍后再点一次。"],
    [helperReadSnapshotBtn, "正在加载快照组件，请稍后再点一次。"],
    [helperSyncCurrentInventoryBtn, "正在加载功法库存组件，请稍后再点一次。"],
    [helperSyncAllInventoryBtn, "正在加载功法库存组件，请稍后再点一次。"],
    [helperBuyPermanentSlotBtn, "正在加载阵容槽位组件，请稍后再点一次。"],
    [helperBuySeasonalSlotBtn, "正在加载阵容槽位组件，请稍后再点一次。"],
  ],
});
