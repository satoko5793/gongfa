function getEventTarget(event) {
  return event?.target || null;
}

function findClosest(event, selector) {
  return getEventTarget(event)?.closest?.(selector) || null;
}

function bindSnapshotPanel(panel, ctx) {
  panel?.addEventListener("click", (event) => {
    const archivedToggleButton = findClosest(event, ".helper-toggle-archived-snapshots-btn");
    if (archivedToggleButton) {
      ctx.toggleArchivedHelperSnapshots();
      return;
    }

    const toggleButton = findClosest(event, ".helper-toggle-snapshot-detail-btn");
    if (toggleButton) {
      ctx.toggleExpandedHelperSnapshot(toggleButton.getAttribute("data-helper-snapshot-id"));
      return;
    }

    const switchButton = findClosest(event, ".helper-switch-to-snapshot-btn");
    if (switchButton) {
      ctx.openHelperTeamSwitchPopup(switchButton.getAttribute("data-helper-team-id"));
      return;
    }

    const restoreButton = findClosest(event, ".helper-restore-snapshot-btn");
    if (restoreButton) {
      ctx.openHelperRestorePopup(restoreButton.getAttribute("data-helper-snapshot-id"));
      return;
    }

    const previewButton = findClosest(event, ".helper-preview-snapshot-btn");
    if (previewButton) {
      ctx.openHelperPreviewPopup(previewButton.getAttribute("data-helper-snapshot-id"));
      return;
    }

    const renameButton = findClosest(event, ".helper-rename-snapshot-btn");
    if (renameButton) {
      ctx.renameHelperSnapshot(renameButton.getAttribute("data-helper-snapshot-id"));
      return;
    }

    const pinButton = findClosest(event, ".helper-pin-snapshot-btn");
    if (pinButton) {
      ctx.togglePinHelperSnapshot(pinButton.getAttribute("data-helper-snapshot-id"));
      return;
    }

    const removeButton = findClosest(event, ".helper-remove-snapshot-btn");
    if (!removeButton) return;
    ctx.removeHelperSnapshot(removeButton.getAttribute("data-helper-snapshot-id"));
  });
}

export function bindHelperShellEvents(ctx) {
  ctx.saveHelperOriginButton?.addEventListener("click", () => {
    ctx.setHelperOrigin(ctx.getHelperOriginInputValue().trim());
    ctx.setNotice("helper 地址已保存。", "success");
  });
  ctx.openHelperButton?.addEventListener("click", ctx.openHelper);
  ctx.helperOpenBindPopupBtn?.addEventListener("click", ctx.openHelperBindPopup);
  ctx.helperOpenAuthPopupBtn?.addEventListener("click", ctx.openHelperAuthPopup);
  ctx.helperSaveBindBtn?.addEventListener("click", ctx.savePendingHelperBinding);
  ctx.helperClearBindBtn?.addEventListener("click", ctx.clearPendingHelperSelection);
  ctx.helperSyncCurrentInventoryBtn?.addEventListener("click", ctx.syncCurrentHelperInventory);
  ctx.helperSyncAllInventoryBtn?.addEventListener("click", ctx.syncAllHelperInventories);
  ctx.helperBuyPermanentSlotBtn?.addEventListener("click", () => ctx.purchaseHelperSlot("permanent"));
  ctx.helperBuySeasonalSlotBtn?.addEventListener("click", () => ctx.purchaseHelperSlot("seasonal"));
  ctx.helperReadSnapshotBtn?.addEventListener("click", ctx.openHelperSnapshotPopup);
  ctx.helperClearPreviewBtn?.addEventListener("click", ctx.clearHelperRestorePreview);

  ctx.helperTeamSwitchControls?.addEventListener("click", (event) => {
    const button = findClosest(event, "[data-helper-team-id]");
    if (!button) return;
    ctx.openHelperTeamSwitchPopup(button.getAttribute("data-helper-team-id"));
  });

  ctx.helperBindCurrent?.addEventListener("click", (event) => {
    const activateButton = findClosest(event, ".helper-set-active-binding-btn");
    if (activateButton) {
      ctx.setActiveHelperBinding(activateButton.getAttribute("data-helper-binding-id"));
      ctx.setHelperBindMessage(
        "已切换当前使用角色，后续保存阵容和一键还原都会跟着这个角色走。",
        "success"
      );
      return;
    }
    const removeButton = findClosest(event, ".helper-remove-binding-btn");
    if (!removeButton) return;
    ctx.removeHelperBinding(removeButton.getAttribute("data-helper-binding-id"));
  });

  ctx.helperInventoryBindings?.addEventListener("click", (event) => {
    const button = findClosest(event, ".helper-sync-binding-inventory-btn");
    if (!button) return;
    const binding = ctx.findHelperBinding(button.getAttribute("data-helper-binding-id"));
    if (!binding) {
      ctx.setHelperInventoryMessage("没有找到要同步的炉子角色。", "error");
      return;
    }
    ctx.startHelperInventorySync([binding], "single");
  });

  ctx.helperInventoryMerged?.addEventListener("click", (event) => {
    const toggleButton = findClosest(event, ".helper-toggle-inventory-expanded-btn");
    if (toggleButton) {
      ctx.toggleHelperInventoryExpanded?.(toggleButton.getAttribute("data-helper-inventory-expanded") === "1");
      return;
    }
    const pageButton = findClosest(event, ".helper-inventory-page-btn");
    if (pageButton) {
      ctx.changeHelperInventoryPage?.(Number(pageButton.getAttribute("data-helper-page") || 1));
      return;
    }
    const searchButton = findClosest(event, ".helper-inventory-search-btn");
    if (searchButton) {
      const keyword = ctx.helperInventoryMerged.querySelector(".helper-inventory-keyword-input")?.value || "";
      const bindingId = ctx.helperInventoryMerged.querySelector(".helper-inventory-binding-filter")?.value || "";
      ctx.applyHelperInventoryFilter?.({ keyword, bindingId });
      return;
    }
    const consignButton = findClosest(event, ".helper-consign-item-btn");
    if (consignButton) {
      const itemKey = String(consignButton.getAttribute("data-helper-item-key") || "");
      const inventoryId = Number(consignButton.getAttribute("data-helper-inventory-id") || 0);
      const targetItem = (ctx.getCurrentHelperInventoryItems?.() || []).find(
        (item) => Number(item?.inventory_id || 0) === inventoryId && String(item?.item_key || "") === itemKey
      );
      ctx.submitConsignmentListing?.(targetItem);
      return;
    }
    const withdrawButton = findClosest(event, ".helper-withdraw-consignment-btn");
    if (withdrawButton) {
      ctx.withdrawConsignmentListing?.(withdrawButton.getAttribute("data-helper-consignment-id"));
      return;
    }
    const deliveryButton = findClosest(event, ".escrow-delivery-btn");
    if (deliveryButton) {
      ctx.submitEscrowDelivery?.(deliveryButton.getAttribute("data-escrow-id"));
      return;
    }
    const button = findClosest(event, ".helper-import-inventory-products-btn");
    if (!button) return;
    ctx.importHelperInventoryProducts();
  });

  ctx.helperInventoryMerged?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !findClosest(event, ".helper-inventory-keyword-input")) return;
    const keyword = ctx.helperInventoryMerged.querySelector(".helper-inventory-keyword-input")?.value || "";
    const bindingId = ctx.helperInventoryMerged.querySelector(".helper-inventory-binding-filter")?.value || "";
    ctx.applyHelperInventoryFilter?.({ keyword, bindingId });
  });

  ctx.helperInventoryMerged?.addEventListener("change", (event) => {
    if (!findClosest(event, ".helper-inventory-binding-filter")) return;
    const keyword = ctx.helperInventoryMerged.querySelector(".helper-inventory-keyword-input")?.value || "";
    const bindingId = ctx.helperInventoryMerged.querySelector(".helper-inventory-binding-filter")?.value || "";
    ctx.applyHelperInventoryFilter?.({ keyword, bindingId });
  });

  ctx.helperGameFeatureList?.addEventListener("click", (event) => {
    const button = findClosest(event, ".helper-run-game-feature-btn");
    if (!button) return;
    ctx.openHelperGameFeaturePopup(button.getAttribute("data-helper-game-feature"));
  });

  ctx.helperBridgeHiddenFrame?.addEventListener("load", () => {
    ctx.setDebugLine("helper.hiddenFrame", ctx.getHelperBridgeHiddenFrameSrc() || "loaded");
  });

  bindSnapshotPanel(ctx.helperSnapshotCurrent, ctx);
  bindSnapshotPanel(ctx.helperSnapshotList, ctx);

  ctx.closeHelperBridgeModalBtn?.addEventListener("click", ctx.closeHelperBridgeModal);
  ctx.helperBridgeModal?.addEventListener("click", (event) => {
    if (event.target === ctx.helperBridgeModal) {
      ctx.closeHelperBridgeModal();
    }
  });
}
