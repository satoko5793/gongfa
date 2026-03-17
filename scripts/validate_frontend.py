#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]


def print_step(message: str) -> None:
    print(f"[check] {message}")


def run_node_check(path: Path) -> None:
    result = subprocess.run(
        ["node", "--check", str(path)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or f"node --check failed: {path}")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def fetch_text(url: str) -> str:
    with urlopen(url, timeout=20) as response:
        return response.read().decode("utf-8")


def fetch_bytes(url: str) -> bytes:
    with urlopen(url, timeout=20) as response:
        return response.read()


def decode_utf8_asset(data: bytes, label: str) -> str:
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return data.decode("utf-8-sig")
        except UnicodeDecodeError as error:
            raise RuntimeError(f"{label} is not valid UTF-8") from error


def fetch_json(url: str):
    return json.loads(fetch_text(url))


def extract_script_path(html: str, script_name: str) -> str:
    pattern = re.compile(rf'<script[^>]+src="([^"]*{re.escape(script_name)}[^"]*)"')
    match = pattern.search(html)
    if not match:
        raise RuntimeError(f"cannot find {script_name} in html")
    return match.group(1)


def validate_local_files() -> None:
    print_step("checking local frontend javascript syntax")
    for relative_path in ["frontend/app.js", "frontend/admin.js", "frontend/shared.js"]:
        path = ROOT / relative_path
        decode_utf8_asset(path.read_bytes(), relative_path)
        run_node_check(path)

    print_step("checking local html references")
    index_html = read_text(ROOT / "frontend" / "index.html")
    admin_html = read_text(ROOT / "frontend" / "admin.html")

    if "app.js?v=" not in index_html:
        raise RuntimeError("frontend/index.html is missing app.js version query")
    if "styles.css?v=" not in index_html:
        raise RuntimeError("frontend/index.html is missing styles.css version query")
    if "admin.js?v=" not in admin_html:
        raise RuntimeError("frontend/admin.html is missing admin.js version query")


def validate_public_site(base_url: str) -> None:
    print_step(f"checking public health endpoint: {base_url}")
    health = fetch_json(urljoin(base_url, "/health"))
    if not health.get("ok"):
        raise RuntimeError(f"/health is not ok: {health}")

    print_step("checking public products endpoint")
    products = fetch_json(urljoin(base_url, "/products"))
    if not isinstance(products, list) or len(products) == 0:
        raise RuntimeError("/products returned no items")

    print_step("checking public frontend assets")
    index_html = fetch_text(urljoin(base_url, "/"))
    app_script = extract_script_path(index_html, "app.js")
    admin_html = fetch_text(urljoin(base_url, "/admin.html"))
    admin_script = extract_script_path(admin_html, "admin.js")

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_dir_path = Path(tmp_dir)
        targets = [
            (app_script, tmp_dir_path / "app.js"),
            ("/shared.js", tmp_dir_path / "shared.js"),
            (admin_script, tmp_dir_path / "admin.js"),
        ]
        for script_path, output_path in targets:
            asset_bytes = fetch_bytes(urljoin(base_url, script_path))
            decode_utf8_asset(asset_bytes, script_path)
            output_path.write_bytes(asset_bytes)
            run_node_check(output_path)

    print_step(f"public /products item count: {len(products)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate local frontend files and optional deployed site.")
    parser.add_argument("--base-url", help="Public site base url, for example http://101.34.247.186")
    args = parser.parse_args()

    try:
        validate_local_files()
        if args.base_url:
            validate_public_site(args.base_url.rstrip("/"))
    except (RuntimeError, HTTPError, URLError, json.JSONDecodeError) as error:
        print(f"[fail] {error}", file=sys.stderr)
        return 1

    print("[ok] frontend validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
