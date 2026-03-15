# Mini Program Local Testing

## Local API

The mini program currently defaults to:

`http://127.0.0.1:8090`

This matches the local marketplace backend in this repository.

## Start backend

Run:

```powershell
start-local.cmd
```

Then confirm:

```text
http://127.0.0.1:8090/health
```

should return:

```json
{"ok":true}
```

## In WeChat DevTools

Use the `mp-app/` or `app/` directory.

If requests fail:

1. Make sure local backend is running on port `8090`
2. In DevTools, disable domain validation for local debugging
3. Recompile the mini program

## Current test flow

1. Open home page and confirm product list loads
2. Open a product detail page
3. Register with:
   - game ID
   - game name
   - password
4. Log in
5. Buy a product
6. Open account page and confirm:
   - quota updated
   - order created

## Later online deployment

When moving to cloud hosting, change `utils/config.js` to the real HTTPS API domain.
