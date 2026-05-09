const DEFAULT_POST_AUTH_TARGET_KEY = "gongfa_post_auth_target_v1";

export function applyImmediateAuthResultRuntime(ctx, result) {
  const immediateProfile = ctx.getSessionProfileFallback(result);
  if (!immediateProfile) return null;
  ctx.renderSessionSummary(immediateProfile);
  ctx.renderProfile(immediateProfile, { balance: Number(immediateProfile.quota_balance ?? 0) }, []);
  return immediateProfile;
}

export function schedulePostAuthAccountFocusRuntime(
  storage = window.sessionStorage,
  storageKey = DEFAULT_POST_AUTH_TARGET_KEY
) {
  try {
    storage.setItem(storageKey, "account");
    return true;
  } catch {
    return false;
  }
}

export function consumePostAuthAccountFocusRuntime(
  storage = window.sessionStorage,
  storageKey = DEFAULT_POST_AUTH_TARGET_KEY
) {
  try {
    const target = storage.getItem(storageKey);
    if (target !== "account") return false;
    storage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}

export function focusAccountAfterAuthRuntime(ctx) {
  window.location.hash = "account";
  ctx.activateAccountTab("overview");
  ctx.scrollSectionIntoView(ctx.accountSection);
  ctx.setActiveDockTarget("account");
  return true;
}

export async function completePostAuthNavigationRuntime(ctx) {
  if (ctx.navigateToPostAuthSurface()) return true;
  ctx.activateAccountTab("overview");
  window.location.hash = "account";
  await ctx.loadAccount();
  return false;
}
