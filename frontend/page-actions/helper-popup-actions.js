import {
  openHelperPreviewAction,
  openHelperRestoreAction,
  openHelperSnapshotAction,
  openHelperTeamSwitchAction,
} from "./helper-actions.js?v=release-20260611-151806";

export function openHelperSnapshotPopupAction(ctx) {
  return openHelperSnapshotAction({
    getCurrentProfile: ctx.getCurrentProfile,
    setHelperSnapshotMessage: ctx.setHelperSnapshotMessage,
    navigateToLoginEntry: ctx.navigateToLoginEntry,
    isHelperLineupEnabled: ctx.isHelperLineupEnabled,
    isHelperSnapshotEnabled: ctx.isHelperSnapshotEnabled,
    getHelperLineupDisabledReason: ctx.getHelperLineupDisabledReason,
    getActiveHelperBinding: ctx.getActiveHelperBinding,
    getHelperConfig: ctx.getHelperConfig,
    getCurrentHelperSnapshots: ctx.getCurrentHelperSnapshots,
    alertMessage: ctx.alertMessage,
    runHelperBridgeInBackground: ctx.runHelperBridgeInBackground,
    buildHelperBridgeSnapshotUrl: ctx.buildHelperBridgeSnapshotUrl,
  });
}

export function openHelperTeamSwitchPopupAction(ctx, teamId) {
  return openHelperTeamSwitchAction(
    {
      getCurrentProfile: ctx.getCurrentProfile,
      setHelperSwitchMessage: ctx.setHelperSwitchMessage,
      navigateToLoginEntry: ctx.navigateToLoginEntry,
      isHelperLineupEnabled: ctx.isHelperLineupEnabled,
      isHelperTeamSwitchEnabled: ctx.isHelperTeamSwitchEnabled,
      getHelperLineupDisabledReason: ctx.getHelperLineupDisabledReason,
      getActiveHelperBinding: ctx.getActiveHelperBinding,
      confirmAction: ctx.confirmAction,
      runHelperBridgeInBackground: ctx.runHelperBridgeInBackground,
      buildHelperBridgeTeamSwitchUrl: ctx.buildHelperBridgeTeamSwitchUrl,
    },
    teamId
  );
}

export function openHelperPreviewPopupAction(ctx, snapshotId) {
  return openHelperPreviewAction(
    {
      getCurrentProfile: ctx.getCurrentProfile,
      setHelperPreviewMessage: ctx.setHelperPreviewMessage,
      navigateToLoginEntry: ctx.navigateToLoginEntry,
      isHelperLineupEnabled: ctx.isHelperLineupEnabled,
      isHelperSnapshotEnabled: ctx.isHelperSnapshotEnabled,
      getHelperLineupDisabledReason: ctx.getHelperLineupDisabledReason,
      getActiveHelperBinding: ctx.getActiveHelperBinding,
      getCurrentHelperSnapshots: ctx.getCurrentHelperSnapshots,
      setPendingHelperPreviewSnapshotId: ctx.setPendingHelperPreviewSnapshotId,
      runHelperBridgeInBackground: ctx.runHelperBridgeInBackground,
      buildHelperBridgeTeamPreviewUrl: ctx.buildHelperBridgeTeamPreviewUrl,
      buildHelperSnapshotName: ctx.buildHelperSnapshotName,
    },
    snapshotId
  );
}

export function openHelperRestorePopupAction(ctx, snapshotId) {
  return openHelperRestoreAction(
    {
      getCurrentProfile: ctx.getCurrentProfile,
      setHelperSwitchMessage: ctx.setHelperSwitchMessage,
      navigateToLoginEntry: ctx.navigateToLoginEntry,
      isHelperLineupEnabled: ctx.isHelperLineupEnabled,
      isHelperTeamRestoreEnabled: ctx.isHelperTeamRestoreEnabled,
      getHelperLineupDisabledReason: ctx.getHelperLineupDisabledReason,
      getActiveHelperBinding: ctx.getActiveHelperBinding,
      getCurrentHelperSnapshots: ctx.getCurrentHelperSnapshots,
      getSnapshotSafeRestoreBlockReason: ctx.getSnapshotSafeRestoreBlockReason,
      buildHelperRestorePlanFromSnapshot: ctx.buildHelperRestorePlanFromSnapshot,
      confirmAction: ctx.confirmAction,
      runHelperBridgeInBackground: ctx.runHelperBridgeInBackground,
      buildHelperBridgeTeamRestoreUrl: ctx.buildHelperBridgeTeamRestoreUrl,
      setHelperRestoreProgress: ctx.setHelperRestoreProgress,
      buildHelperSnapshotName: ctx.buildHelperSnapshotName,
    },
    snapshotId
  );
}
