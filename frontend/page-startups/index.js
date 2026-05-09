import { getAuthPageStartupTasks } from "./auth-page.js?v=release-20260509-160631";
import { getAuctionPageStartupTasks } from "./auction-page.js?v=release-20260509-160631";
import { getHelperPageStartupTasks } from "./helper-page.js?v=release-20260509-160631";
import { getMePageStartupTasks } from "./me-page.js?v=release-20260509-160631";
import { getPageShellStartupTasks } from "./page-shell.js?v=release-20260509-160631";
import { getSessionPageStartupTasks } from "./session-page.js?v=release-20260509-160631";
import { getShopPageStartupTasks } from "./shop-page.js?v=release-20260509-160631";

const STARTUP_PIPELINES = {
  legacy: ["page-shell", "auth", "me", "shop", "helper", "auction"],
  shop: ["page-shell", "session", "shop"],
  login: ["page-shell", "session", "auth"],
  script: ["page-shell", "me", "helper"],
  auction: ["page-shell", "me", "auction"],
  me: ["page-shell", "me"],
};

const STARTUP_TASK_BUILDERS = {
  "page-shell": getPageShellStartupTasks,
  session: getSessionPageStartupTasks,
  auth: getAuthPageStartupTasks,
  shop: getShopPageStartupTasks,
  helper: getHelperPageStartupTasks,
  auction: getAuctionPageStartupTasks,
  me: getMePageStartupTasks,
};

export function getStartupTasksForMode(pageMode, ctx) {
  const pipeline = STARTUP_PIPELINES[pageMode] || STARTUP_PIPELINES.legacy;
  return pipeline.flatMap((key) => {
    const buildTasks = STARTUP_TASK_BUILDERS[key];
    return buildTasks ? buildTasks(ctx) : [];
  });
}
