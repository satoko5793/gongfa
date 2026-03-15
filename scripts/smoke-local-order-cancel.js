const baseUrl = process.env.GONGFA_BASE_URL || "http://127.0.0.1:8090";

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${path} returned non-JSON: ${text.slice(0, 160)}`);
  }

  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  const userId = `smoke_${Date.now()}`;
  const userName = "联调测试用户";
  const password = "123456";

  const health = await api("/health");
  if (!health?.ok) {
    throw new Error("health check failed");
  }

  const adminLogin = await api("/auth/login", {
    method: "POST",
    body: { game_role_id: "584967604", password: "159321" },
  });

  const userRegister = await api("/auth/register", {
    method: "POST",
    body: {
      game_role_id: userId,
      game_role_name: userName,
      password,
    },
  });

  const users = await api("/admin/users", { token: adminLogin.token });
  const createdUser = users.find((item) => String(item.game_role_id) === userId);
  if (!createdUser) {
    throw new Error("created user not found in admin list");
  }

  await api(`/admin/users/${createdUser.id}/quota`, {
    method: "PATCH",
    token: adminLogin.token,
    body: { change_amount: 50000, remark: "smoke test quota" },
  });

  const quotaBefore = await api("/me/quota", { token: userRegister.token });
  const products = await api("/products");
  const target = products.find(
    (item) => item.item_kind === "card" && Number(item.stock || 0) > 0
  );
  if (!target) {
    throw new Error("no purchasable card product found");
  }

  const order = await api("/orders", {
    method: "POST",
    token: userRegister.token,
    body: {
      item_id: target.item_id,
      item_kind: target.item_kind,
    },
  });

  const quotaAfterBuy = await api("/me/quota", { token: userRegister.token });

  const cancelRequested = await api(`/orders/${order.id}/cancel-request`, {
    method: "POST",
    token: userRegister.token,
    body: {},
  });

  const approved = await api(`/admin/orders/${order.id}/status`, {
    method: "PATCH",
    token: adminLogin.token,
    body: {
      status: "cancelled",
      remark: "smoke test approve cancel",
    },
  });

  const quotaAfterCancel = await api("/me/quota", { token: userRegister.token });

  console.log(
    JSON.stringify(
      {
        baseUrl,
        admin_role: adminLogin.user?.role,
        created_user: {
          id: createdUser.id,
          game_role_id: createdUser.game_role_id,
        },
        product: {
          id: target.item_id,
          name: target.name,
          price_quota: target.price_quota,
        },
        quota: {
          before: quotaBefore.balance,
          after_buy: quotaAfterBuy.balance,
          after_cancel: quotaAfterCancel.balance,
        },
        order_statuses: {
          created: order.status,
          cancel_requested: cancelRequested.status,
          approved: approved.status,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
