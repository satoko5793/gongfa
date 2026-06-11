#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT / "frontend"

RELATIVE_JS_REFERENCE_RE = re.compile(r'(?P<quote>["\'])(?P<path>\.{1,2}/[^"\']+?\.m?js)(?:\?v=[^"\']+)?(?P=quote)')
RELATIVE_CSS_REFERENCE_RE = re.compile(
    r'(?P<quote>["\'])(?P<path>(?!https?:|//|/)[^"\']+?\.css)(?:\?v=[^"\']+)?(?P=quote)'
)


def iter_targets() -> list[Path]:
    return sorted(
        [*FRONTEND_DIR.rglob("*.js"), *FRONTEND_DIR.rglob("*.html")],
        key=lambda item: (item.suffix, str(item)),
    )


def rewrite_file(path: Path, version: str) -> bool:
    source = path.read_text(encoding="utf-8")
    updated = RELATIVE_JS_REFERENCE_RE.sub(
        lambda match: f'{match.group("quote")}{match.group("path")}?v={version}{match.group("quote")}',
        source,
    )
    if path.suffix == ".html":
        updated = RELATIVE_CSS_REFERENCE_RE.sub(
            lambda match: f'{match.group("quote")}{match.group("path")}?v={version}{match.group("quote")}',
            updated,
        )
    if updated == source:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Rewrite frontend relative JS/CSS references to one release version.")
    parser.add_argument("--version", required=True, help="Version suffix to apply, for example release-20260411-170000")
    args = parser.parse_args()

    changed_files = [path for path in iter_targets() if rewrite_file(path, args.version)]
    print(f"[ok] synced frontend module version to {args.version} across {len(changed_files)} file(s)")
    for path in changed_files:
        print(path.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
