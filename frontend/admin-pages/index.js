import { bindCatalogPageEvents, loadCatalogPage, renderCatalogPage } from "./catalog.js?v=release-20260509-160631";
import { bindImportsPageEvents, loadImportsPage, renderImportsPage } from "./imports.js?v=release-20260509-160631";
import { bindLogsPageEvents, loadLogsPage, renderLogsPage } from "./logs.js?v=release-20260509-160631";
import { bindOrdersPageEvents, loadOrdersPage, renderOrdersPage } from "./orders.js?v=release-20260509-160631";
import { bindRechargePageEvents, loadRechargePage, renderRechargePage } from "./recharge.js?v=release-20260509-160631";
import { bindUsersPageEvents, loadUsersPage, renderUsersPage } from "./users.js?v=release-20260509-160631";

const PAGE_DEFINITIONS = {
  imports: { load: loadImportsPage, bind: bindImportsPageEvents, render: renderImportsPage },
  catalog: { load: loadCatalogPage, bind: bindCatalogPageEvents, render: renderCatalogPage },
  users: { load: loadUsersPage, bind: bindUsersPageEvents, render: renderUsersPage },
  orders: { load: loadOrdersPage, bind: bindOrdersPageEvents, render: renderOrdersPage },
  recharge: { load: loadRechargePage, bind: bindRechargePageEvents, render: renderRechargePage },
  logs: { load: loadLogsPage, bind: bindLogsPageEvents, render: renderLogsPage },
};

const boundPages = new Set();

export async function loadAdminPageData(page, context) {
  const definition = PAGE_DEFINITIONS[page];
  if (!definition?.load) return;
  await definition.load(context);
}

export function bindAdminPageEvents(page, context) {
  if (boundPages.has(page)) return;
  const definition = PAGE_DEFINITIONS[page];
  if (typeof definition?.bind === "function") {
    definition.bind(context);
  }
  boundPages.add(page);
}

export function renderAdminPage(page, context) {
  const definition = PAGE_DEFINITIONS[page];
  if (typeof definition?.render === "function") {
    definition.render(context);
  }
}
