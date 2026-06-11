import { loadSession } from "./shared.js?v=release-20260611-151806";
import { bootDeferredPageEntry } from "./page-entry-bootstrap.js?v=release-20260611-151806";
import { startAuctionLiteShell } from "./page-entry-auction-lite.js?v=release-20260611-151806";
import {
  initDrawHonorCarousel,
  renderDrawHonorPanel,
} from "./season-honor-runtime.js?v=release-20260611-151806";
import { applyEntryNavSessionState, getEntrySessionProfile } from "./page-entry-session.js?v=release-20260611-151806";

const auctionBody = document.getElementById("auction-body");
const auctionStatusTabs = document.getElementById("auction-status-tabs");
const drawServiceBody = document.getElementById("draw-service-body");
const drawServiceMessage = document.getElementById("draw-service-message");
const drawHonorRoot = document.getElementById("draw-service-honor-panel-root");

const sessionProfile = getEntrySessionProfile(loadSession());

if (drawHonorRoot) {
  drawHonorRoot.innerHTML = renderDrawHonorPanel();
  initDrawHonorCarousel();
}

const entry = bootDeferredPageEntry("auction", "./app.js?v=release-20260611-151806", {
  idleTimeout: sessionProfile ? 500 : 2200,
  fallbackDelay: sessionProfile ? 100 : 900,
  autoBoot: false,
  wakeTargets: false,
  beforeBoot: () => {
    applyEntryNavSessionState(sessionProfile);
  },
});

startAuctionLiteShell({
  profile: sessionProfile,
  auctionBody,
  auctionStatusTabs,
  drawServiceBody,
  drawServiceMessage,
  wakeHeavyModule: entry.ensureAppModule,
});
