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
FRONTEND_DIR = ROOT / "frontend"
RELATIVE_JS_REFERENCE_RE = re.compile(r'(?P<quote>["\'])(?P<path>\.{1,2}/[^"\']+?\.m?js)(?:\?v=(?P<version>[^"\']+))?(?P=quote)')


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


def extract_first_matching_script_path(html: str, script_names: list[str]) -> str:
    for script_name in script_names:
        pattern = re.compile(rf'<script[^>]+src="([^"]*{re.escape(script_name)}[^"]*)"')
        match = pattern.search(html)
        if match:
            return match.group(1)
    raise RuntimeError(f"cannot find any of {', '.join(script_names)} in html")


def collect_relative_js_references(source: str) -> list[tuple[str, str]]:
    return [(match.group("path"), match.group("version") or "") for match in RELATIVE_JS_REFERENCE_RE.finditer(source)]


def validate_module_reference_versions() -> None:
    missing_versions: list[str] = []
    versions: set[str] = set()

    for path in sorted([*FRONTEND_DIR.rglob("*.js"), *FRONTEND_DIR.rglob("*.html")]):
        source = read_text(path)
        for ref_path, version in collect_relative_js_references(source):
            if not version:
                missing_versions.append(f"{path.relative_to(ROOT)} -> {ref_path}")
                continue
            versions.add(version)

    if missing_versions:
        preview = ", ".join(missing_versions[:10])
        raise RuntimeError(f"frontend relative js references missing ?v=: {preview}")
    if not versions:
        raise RuntimeError("no frontend relative js references found")
    if len(versions) != 1:
        raise RuntimeError(f"frontend module version mismatch: {', '.join(sorted(versions))}")


def validate_local_files() -> None:
    print_step("checking local frontend javascript syntax")
    for path in sorted(FRONTEND_DIR.rglob("*.js")):
        relative_path = path.relative_to(ROOT)
        decode_utf8_asset(path.read_bytes(), str(relative_path))
        run_node_check(path)

    print_step("checking local html references")
    index_html = read_text(FRONTEND_DIR / "index.html")
    admin_html = read_text(FRONTEND_DIR / "admin.html")

    if "app.js?v=" not in index_html:
        raise RuntimeError("frontend/index.html is missing app.js version query")
    if "styles.css?v=" not in index_html:
        raise RuntimeError("frontend/index.html is missing styles.css version query")
    if "admin.js?v=" not in admin_html:
        raise RuntimeError("frontend/admin.html is missing admin.js version query")

    print_step("checking frontend module version chain")
    validate_module_reference_versions()


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
    app_script = extract_first_matching_script_path(index_html, ["shop-entry.js", "app.js"])
    entry_source = fetch_text(urljoin(base_url, app_script))
    admin_html = fetch_text(urljoin(base_url, "/admin.html"))
    admin_script = extract_script_path(admin_html, "admin.js")

    public_versions = {
        version for _, version in collect_relative_js_references(index_html + "\n" + entry_source + "\n" + admin_html) if version
    }
    if len(public_versions) > 1:
        raise RuntimeError(f"public frontend module version mismatch: {', '.join(sorted(public_versions))}")

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_dir_path = Path(tmp_dir)
        targets = [(app_script, tmp_dir_path / "app.js"), (admin_script, tmp_dir_path / "admin.js")]
        fetched_paths = {app_script}
        for script_path, _ in list(targets):
            source = entry_source if script_path == app_script else fetch_text(urljoin(base_url, script_path))
            for ref_path, _ in collect_relative_js_references(source):
                if ref_path in fetched_paths:
                    continue
                fetched_paths.add(ref_path)
                targets.append((ref_path, tmp_dir_path / Path(ref_path).name))
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
