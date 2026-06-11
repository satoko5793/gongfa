#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = ROOT / "frontend"
INDEX_PATH = FRONTEND_DIR / "index.html"

ENTRY_CONFIG = {
    "shop.html": {
        "title": "25000 繁星功法商城 - 商城",
        "page_entry": "shop",
        "script_name": "shop-entry.js",
    },
    "login.html": {
        "title": "25000 繁星功法商城 - 登录",
        "page_entry": "login",
        "script_name": "login-entry.js",
    },
    "script.html": {
        "title": "25000 繁星功法商城 - 功法检测",
        "page_entry": "script",
        "script_name": "script-entry.js",
    },
    "auction.html": {
        "title": "25000 繁星功法商城 - 拍卖代抽",
        "page_entry": "auction",
        "script_name": "auction-entry.js",
    },
    "me.html": {
        "title": "25000 繁星功法商城 - 个人后台",
        "page_entry": "me",
        "script_name": "me-entry.js",
    },
}

AUTH_FALLBACK_SCRIPT_MARKER = 'const SESSION_KEY = "gongfa_session_v1";'
HERO_ROTATE_SCRIPT_MARKER = 'const trigger = document.getElementById("hero-stage-trigger");'

TRIM_PATTERNS = {
    "shop.html": [
        (r"\n\s*<section id=\"bind\" class=\"card\">.*?\n\s*</section>", "bind"),
        (r"\n\s*<section class=\"card beginner-flow\">.*?\n\s*</section>", "beginner-flow"),
        (
            r"\n\s*<section id=\"discount-products-section\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "discount-products",
        ),
        (
            r"\n\s*<section id=\"helper-lab\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "helper-lab",
        ),
        (r"\n\s*<section id=\"account\" class=\"card dock-target-section\">.*?\n\s*</section>", "account"),
        (
            r"\n\s*<section id=\"auction-zone\" class=\"card dock-target-section\">.*?\n\s*</section>",
            "auction-zone",
        ),
        (
            r"\n\s*<section id=\"draw-service-zone\" class=\"card dock-target-section\">.*?\n\s*</section>",
            "draw-service-zone",
        ),
        (r"\n\s*<aside id=\"debug-panel\" class=\"debug-panel hidden\">.*?\n\s*</aside>", "debug-panel"),
        (r"\n\s*<nav class=\"page-dock\" aria-label=\"页面快捷切换\">.*?\n\s*</nav>", "page-dock"),
        (r"\n\s*<footer class=\"footer\">.*?</footer>", "footer"),
    ],
    "login.html": [
        (r"\n\s*<section class=\"hero card\">.*?\n\s*</section>", "hero"),
        (r"\n\s*<section class=\"card beginner-flow\">.*?\n\s*</section>", "beginner-flow"),
        (r"\n\s*<section id=\"products\" class=\"card dock-target-section\">.*?\n\s*</section>", "products"),
        (
            r"\n\s*<section id=\"discount-products-section\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "discount-products",
        ),
        (
            r"\n\s*<section id=\"helper-lab\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "helper-lab",
        ),
        (r"\n\s*<section id=\"account\" class=\"card dock-target-section\">.*?\n\s*</section>", "account"),
        (
            r"\n\s*<section id=\"auction-zone\" class=\"card dock-target-section\">.*?\n\s*</section>",
            "auction-zone",
        ),
        (
            r"\n\s*<section id=\"draw-service-zone\" class=\"card dock-target-section\">.*?\n\s*</section>",
            "draw-service-zone",
        ),
        (r"\n\s*<aside id=\"debug-panel\" class=\"debug-panel hidden\">.*?\n\s*</aside>", "debug-panel"),
        (r"\n\s*<footer class=\"footer\">.*?</footer>", "footer"),
        (r"\n\s*<nav class=\"page-dock\" aria-label=\"页面快捷切换\">.*?\n\s*</nav>", "page-dock"),
    ],
    "script.html": [
        (r"\n\s*<section class=\"hero card\">.*?\n\s*</section>", "hero"),
        (r"\n\s*<section class=\"card beginner-flow\">.*?\n\s*</section>", "beginner-flow"),
        (r"\n\s*<section id=\"products\" class=\"card dock-target-section\">.*?\n\s*</section>", "products"),
        (
            r"\n\s*<section id=\"discount-products-section\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "discount-products",
        ),
        (r"\n\s*<section id=\"bind\" class=\"card\">.*?\n\s*</section>", "bind"),
        (r"\n\s*<section id=\"account\" class=\"card dock-target-section\">.*?\n\s*</section>", "account"),
        (
            r"\n\s*<section id=\"auction-zone\" class=\"card dock-target-section\">.*?\n\s*</section>",
            "auction-zone",
        ),
        (
            r"\n\s*<section id=\"draw-service-zone\" class=\"card dock-target-section\">.*?\n\s*</section>",
            "draw-service-zone",
        ),
        (r"\n\s*<aside id=\"debug-panel\" class=\"debug-panel hidden\">.*?\n\s*</aside>", "debug-panel"),
        (r"\n\s*<nav class=\"page-dock\" aria-label=\"页面快捷切换\">.*?\n\s*</nav>", "page-dock"),
    ],
    "auction.html": [
        (r"\n\s*<section class=\"hero card\">.*?\n\s*</section>", "hero"),
        (r"\n\s*<section class=\"card beginner-flow\">.*?\n\s*</section>", "beginner-flow"),
        (r"\n\s*<section id=\"products\" class=\"card dock-target-section\">.*?\n\s*</section>", "products"),
        (
            r"\n\s*<section id=\"discount-products-section\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "discount-products",
        ),
        (r"\n\s*<section id=\"bind\" class=\"card\">.*?\n\s*</section>", "bind"),
        (
            r"\n\s*<section id=\"helper-lab\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "helper-lab",
        ),
        (r"\n\s*<section id=\"account\" class=\"card dock-target-section\">.*?\n\s*</section>", "account"),
        (r"\n\s*<aside id=\"debug-panel\" class=\"debug-panel hidden\">.*?\n\s*</aside>", "debug-panel"),
        (r"\n\s*<nav class=\"page-dock\" aria-label=\"页面快捷切换\">.*?\n\s*</nav>", "page-dock"),
    ],
    "me.html": [
        (r"\n\s*<section class=\"hero card\">.*?\n\s*</section>", "hero"),
        (r"\n\s*<section class=\"card beginner-flow\">.*?\n\s*</section>", "beginner-flow"),
        (r"\n\s*<section id=\"products\" class=\"card dock-target-section\">.*?\n\s*</section>", "products"),
        (
            r"\n\s*<section id=\"discount-products-section\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "discount-products",
        ),
        (r"\n\s*<section id=\"bind\" class=\"card\">.*?\n\s*</section>", "bind"),
        (
            r"\n\s*<section id=\"helper-lab\" class=\"card dock-target-section hidden\">.*?\n\s*</section>",
            "helper-lab",
        ),
        (
            r"\n\s*<section id=\"auction-zone\" class=\"card dock-target-section\">.*?\n\s*</section>",
            "auction-zone",
        ),
        (
            r"\n\s*<section id=\"draw-service-zone\" class=\"card dock-target-section\">.*?\n\s*</section>",
            "draw-service-zone",
        ),
        (r"\n\s*<aside id=\"debug-panel\" class=\"debug-panel hidden\">.*?\n\s*</aside>", "debug-panel"),
        (r"\n\s*<nav class=\"page-dock\" aria-label=\"页面快捷切换\">.*?\n\s*</nav>", "page-dock"),
    ],
}

ENTRY_SCRIPT_MARKERS = {
    "__all__": [AUTH_FALLBACK_SCRIPT_MARKER],
    "login.html": [HERO_ROTATE_SCRIPT_MARKER],
    "script.html": [HERO_ROTATE_SCRIPT_MARKER],
    "auction.html": [HERO_ROTATE_SCRIPT_MARKER],
    "me.html": [HERO_ROTATE_SCRIPT_MARKER],
}

ELEMENT_TRIM_MARKERS = {
    "hero": ('<section class="hero card">', "section"),
    "bind": ('<section id="bind" class="card">', "section"),
    "beginner-flow": ('<section class="card beginner-flow">', "section"),
    "products": ('<section id="products" class="card dock-target-section">', "section"),
    "discount-products": ('<section id="discount-products-section" class="card dock-target-section hidden">', "section"),
    "helper-lab": ('<section id="helper-lab" class="card dock-target-section hidden">', "section"),
    "account": ('<section id="account" class="card dock-target-section">', "section"),
    "auction-zone": ('<section id="auction-zone" class="card dock-target-section">', "section"),
    "draw-service-zone": ('<section id="draw-service-zone" class="card dock-target-section">', "section"),
    "debug-panel": ('<aside id="debug-panel" class="debug-panel hidden">', "aside"),
    "page-dock": ('<nav class="page-dock" aria-label="页面快捷切换">', "nav"),
    "footer": ('<footer class="footer">', "footer"),
}

PRODUCT_MODAL_FREE_PAGES = {"login.html", "script.html", "auction.html", "me.html"}
HELPER_SPLIT_PANEL_MARKUP = """          <div class="panel" style="margin-top: 16px;">
            <div class="panel-title">功法检测已拆分</div>
            <div class="muted">功法检测、功法仓库同步和阵容快照已经移到独立页面，个人后台只保留账户、充值和订单相关功能。</div>
            <div class="actions" style="margin-top: 12px;">
              <a class="ghost-link" href="script.html">前往功法检测</a>
            </div>
          </div>
"""


def remove_block(text: str, pattern: str, label: str) -> str:
    output, count = re.subn(pattern, "", text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"failed to remove block {label}")
    return output


def remove_element_by_start_marker(text: str, start_marker: str, tag: str, label: str) -> str:
    start_index = text.find(start_marker)
    if start_index < 0:
        raise RuntimeError(f"failed to find block {label}")
    tag_re = re.compile(rf"</?{re.escape(tag)}\b[^>]*>", re.I)
    depth = 0
    for match in tag_re.finditer(text, start_index):
        is_closing = match.group(0).startswith("</")
        depth += -1 if is_closing else 1
        if depth == 0:
            remove_start = text.rfind("\n", 0, start_index)
            if remove_start < 0:
                remove_start = start_index
            return text[:remove_start].rstrip() + "\n\n" + text[match.end():].lstrip()
    raise RuntimeError(f"failed to remove balanced block {label}")


def remove_inline_script(text: str, marker: str) -> str:
    marker_index = text.find(marker)
    if marker_index < 0:
        raise RuntimeError(f"failed to find inline script marker: {marker}")
    script_start = text.rfind("<script>", 0, marker_index)
    script_end = text.find("</script>", marker_index)
    if script_start < 0 or script_end < 0:
        raise RuntimeError(f"failed to trim inline script marker: {marker}")
    return text[:script_start].rstrip() + "\n\n" + text[script_end + len("</script>"):].lstrip()


def remove_between_markers(text: str, start_marker: str, end_marker: str, label: str) -> str:
    start_index = text.find(start_marker)
    end_index = text.find(end_marker, start_index)
    if start_index < 0 or end_index < 0:
        raise RuntimeError(f"failed to remove block {label}")
    return text[:start_index].rstrip() + "\n\n" + text[end_index:].lstrip()


def trim_entry_html(output: str, *, filename: str) -> str:
    for marker in ENTRY_SCRIPT_MARKERS.get("__all__", []):
        output = remove_inline_script(output, marker)
    for marker in ENTRY_SCRIPT_MARKERS.get(filename, []):
        output = remove_inline_script(output, marker)

    for pattern, label in TRIM_PATTERNS.get(filename, []):
        if label in ELEMENT_TRIM_MARKERS:
            start_marker, tag = ELEMENT_TRIM_MARKERS[label]
            output = remove_element_by_start_marker(output, start_marker, tag, label)
        else:
            output = remove_block(output, pattern, label)

    if filename in PRODUCT_MODAL_FREE_PAGES:
        output = remove_between_markers(
            output,
            '<div id="product-detail-modal" class="modal-backdrop hidden" aria-hidden="true">',
            '<div id="helper-bridge-modal" class="modal-backdrop hidden" aria-hidden="true">',
            "product-detail-modal",
        )
    if filename == "script.html":
        output = output.replace(
            '<div class="card-title">阵容中心</div>',
            '<div class="card-title">功法检测</div>',
            1,
        )
        output = output.replace(
            "保存你当前的游戏阵容，之后在商城里直接一键还原。复杂的校验和对比会由系统自动处理，不需要你手动操作。",
            "功法检测、功法仓库同步和阵容快照都集中在这个独立页面里处理，不再占用个人后台的启动链路。",
            1,
        )
    if filename == "me.html":
        output = remove_between_markers(
            output,
            '<div id="helper-bridge-modal" class="modal-backdrop hidden" aria-hidden="true">',
            '<footer class="footer">',
            "helper-bridge-modal",
        )
        overview_marker = (
            '          </div>\n'
            '        </div>\n\n'
            '        <div class="section-panel hidden" data-account-panel="profile">'
        )
        overview_replacement = (
            '          </div>\n'
            f"{HELPER_SPLIT_PANEL_MARKUP}"
            '        </div>\n\n'
            '        <div class="section-panel hidden" data-account-panel="profile">'
        )
        if overview_marker not in output:
            raise RuntimeError("failed to inject helper split panel into me overview")
        output = output.replace(overview_marker, overview_replacement, 1)
        output = output.replace("\n\n<footer class=\"footer\">", "\n\n    <footer class=\"footer\">", 1)
    return output


def build_entry_html(index_html: str, *, title: str, page_entry: str, script_name: str, version: str) -> str:
    script_src = f"./{script_name}?v={version}"
    output = index_html.replace(
        "<title>25000 繁星功法商城</title>",
        f"<title>{title}</title>",
        1,
    )
    output = output.replace(
        "<body>",
        f'<body data-page-entry="{page_entry}">',
        1,
    )
    updated = re.sub(
        r'<script type="module" src="\./app\.js(?:\?v=[^"]+)?"></script>',
        f'<script type="module" src="{script_src}"></script>',
        output,
        count=1,
    )
    if updated == output:
        raise RuntimeError(f"failed to render entry page for {page_entry}")
    return updated


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync split frontend entry html files from index.html.")
    parser.add_argument("--version", required=True, help="Entry script version suffix")
    args = parser.parse_args()

    index_html = INDEX_PATH.read_text(encoding="utf-8")
    for filename, config in ENTRY_CONFIG.items():
        entry_html = build_entry_html(index_html, version=args.version, **config)
        entry_html = trim_entry_html(entry_html, filename=filename)
        output_path = FRONTEND_DIR / filename
        output_path.write_text(entry_html, encoding="utf-8")
        print(f"synced {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
