export function createBindAccountContext(ctx) {
  return {
    apiFetch: ctx.apiFetch,
    bindRoleId: ctx.bindRoleIdInput.value.trim(),
    bindServer: ctx.bindServerInput.value.trim(),
    bindRoleName: ctx.bindRoleNameInput.value.trim(),
    bindTokenId: ctx.bindTokenIdInput.value.trim(),
    bindNickname: ctx.bindNicknameInput.value.trim(),
    saveSession: ctx.saveSession,
    applyImmediateAuthResult: ctx.applyImmediateAuthResult,
    loadHelperConfig: ctx.loadHelperConfig,
    schedulePostAuthAccountFocus: ctx.schedulePostAuthAccountFocus,
    setNotice: ctx.setNotice,
    completePostAuthNavigation: ctx.completePostAuthNavigation,
    pickErrorMessage: ctx.pickErrorMessage,
  };
}

export function createLoginAccountContext(ctx) {
  return {
    apiFetch: ctx.apiFetch,
    roleId: ctx.loginRoleIdInput.value.trim(),
    password: ctx.loginPasswordInput.value,
    saveSession: ctx.saveSession,
    applyImmediateAuthResult: ctx.applyImmediateAuthResult,
    loadHelperConfig: ctx.loadHelperConfig,
    schedulePostAuthAccountFocus: ctx.schedulePostAuthAccountFocus,
    setNotice: ctx.setNotice,
    clearPasswordInput: () => {
      ctx.loginPasswordInput.value = "";
    },
    completePostAuthNavigation: ctx.completePostAuthNavigation,
    pickErrorMessage: ctx.pickErrorMessage,
  };
}

export function createRegisterAccountContext(ctx) {
  return {
    apiFetch: ctx.apiFetch,
    clearRoleIdValidity: () => ctx.registerRoleIdInput.setCustomValidity(""),
    validatePasswordMatch: () => ctx.syncRegisterPasswordValidation(true),
    focusPasswordConfirm: () => ctx.registerPasswordConfirmInput.focus(),
    setNotice: ctx.setNotice,
    roleId: ctx.registerRoleIdInput.value.trim(),
    roleName: ctx.registerRoleNameInput.value.trim(),
    password: ctx.registerPasswordInput.value,
    saveSession: ctx.saveSession,
    applyImmediateAuthResult: ctx.applyImmediateAuthResult,
    loadHelperConfig: ctx.loadHelperConfig,
    schedulePostAuthAccountFocus: ctx.schedulePostAuthAccountFocus,
    clearRegisterPasswords: () => {
      ctx.registerPasswordInput.value = "";
      ctx.registerPasswordConfirmInput.value = "";
      ctx.syncRegisterPasswordValidation(false);
    },
    completePostAuthNavigation: ctx.completePostAuthNavigation,
    markRoleIdTaken: (message) => {
      ctx.registerRoleIdInput.setCustomValidity(message);
      ctx.registerRoleIdInput.reportValidity();
      ctx.registerRoleIdInput.focus();
    },
    pickErrorMessage: ctx.pickErrorMessage,
  };
}

export function createSaveAccountProfileContext(ctx) {
  return {
    loadSession: ctx.loadSession,
    setAccountMessage: ctx.setAccountMessage,
    apiFetch: ctx.apiFetch,
    gameRoleName: ctx.accountRoleNameInput.value.trim(),
    nickname: ctx.accountNicknameInput.value.trim(),
    contactInfo: ctx.accountContactInput?.value.trim() || "",
    gameServer: ctx.accountServerInput.value.trim(),
    saveSession: ctx.saveSession,
    loadAccount: ctx.loadAccount,
    pickErrorMessage: ctx.pickErrorMessage,
  };
}

export function createChangeAccountPasswordContext(ctx) {
  return {
    loadSession: ctx.loadSession,
    setAccountMessage: ctx.setAccountMessage,
    currentPassword: ctx.accountCurrentPasswordInput.value,
    newPassword: ctx.accountNewPasswordInput.value,
    confirmPassword: ctx.accountConfirmPasswordInput.value,
    apiFetch: ctx.apiFetch,
    clearPasswordForm: () => {
      ctx.accountCurrentPasswordInput.value = "";
      ctx.accountNewPasswordInput.value = "";
      ctx.accountConfirmPasswordInput.value = "";
    },
    pickErrorMessage: ctx.pickErrorMessage,
  };
}

export function createLogoutCurrentSessionContext(ctx, options = {}) {
  return {
    clearSession: ctx.clearSession,
    loadHelperConfig: ctx.loadHelperConfig,
    resetPostLogoutUiState: ctx.resetPostLogoutUiState,
    activateAccountTab: ctx.activateAccountTab,
    renderSessionSummary: ctx.renderSessionSummary,
    renderProfile: ctx.renderProfile,
    renderRechargeSection: ctx.renderRechargeSection,
    setNotice: ctx.setNotice,
    setAccountMessage: ctx.setAccountMessage,
    navigateToLoginEntry: ctx.navigateToLoginEntry,
    toBind: options.toBind,
  };
}
