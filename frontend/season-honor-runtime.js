import { escapeHtml } from "./shared.js?v=release-20260611-151806";

const COUNT_LABELS = ["一", "二", "三", "四"];

export const SEASON_HONOR_RECORDS = [
  {
    cardName: "因果律",
    owner: "Pluto",
    art: "legacy-assets-svg/因果律-safe.svg",
    artAlt: "珍 因果律",
  },
  {
    cardName: "乾坤一掷",
    owner: "王氏响声丸",
    art: "hero-assets/qiankun-clean.png",
    artAlt: "珍 乾坤一掷",
  },
  {
    cardName: "连环马后炮",
    owner: "待补",
    art: "legacy-assets-svg/马后炮-safe.svg",
    artAlt: "珍 连环马后炮",
  },
  {
    cardName: "乾坤一掷",
    owner: "柒七、",
    art: "hero-assets/qiankun-clean.png",
    artAlt: "珍 乾坤一掷",
  },
];

export const SHOP_HONOR_ITEMS = [
  {
    count: "一珍归属",
    cardName: "因果律",
    owner: "Pluto",
    art: "legacy-assets-svg/因果律-safe.svg",
    artAlt: "珍 因果律",
  },
  {
    count: "二珍归属",
    cardName: "乾坤一掷",
    owner: "王氏响声丸",
    art: "hero-assets/qiankun-clean.png",
    artAlt: "珍 乾坤一掷",
  },
  {
    count: "三珍归属",
    cardName: "连环马后炮",
    owner: "待补",
    art: "legacy-assets-svg/马后炮-safe.svg",
    artAlt: "珍 连环马后炮",
  },
  {
    count: "四珍归属",
    cardName: "乾坤一掷",
    owner: "柒七、",
    art: "hero-assets/qiankun-clean.png",
    artAlt: "珍 乾坤一掷",
  },
  {
    count: "珍卡成交",
    cardName: "连环马后炮",
    owner: "北风",
    art: "legacy-assets-svg/马后炮-safe.svg",
    artAlt: "珍 连环马后炮",
  },
];

function renderShopHonorItem(item) {
  return `
    <div class="shop-honor-item">
      <img src="${escapeHtml(item.art)}" alt="${escapeHtml(item.artAlt)}" />
      <div>
        <span>${escapeHtml(item.count)}</span>
        <strong>${escapeHtml(item.cardName)} · ${escapeHtml(item.owner)}</strong>
      </div>
    </div>
  `;
}

export function renderShopHonorPanel(items = SHOP_HONOR_ITEMS) {
  return `
    <div class="shop-honor-panel" aria-label="本赛季高光">
      <div class="shop-honor-title">
        <div>
          <div class="eyebrow">Season Highlights</div>
          <div class="card-title">本赛季高光</div>
        </div>
        <a class="ghost-link shop-honor-link" href="auction.html#draw-service-honor-panel">去代抽页</a>
      </div>
      <div class="shop-honor-strip">
        ${items.map(renderShopHonorItem).join("")}
      </div>
    </div>
  `;
}

function renderDrawHonorCard(record, index) {
  const countLabel = COUNT_LABELS[index] || String(index + 1);
  const sequence = String(index + 1).padStart(2, "0");
  const recordLabel = `${countLabel}珍归属`;
  return `
    <article class="draw-honor-card" data-honor-index="${index}" role="button" tabindex="-1" aria-label="${escapeHtml(recordLabel)} ${escapeHtml(record.cardName)} ${escapeHtml(record.owner)}">
      <div class="draw-honor-card-top">
        <span>${escapeHtml(recordLabel)}</span>
        <strong>${sequence}</strong>
      </div>
      <img src="${escapeHtml(record.art)}" alt="${escapeHtml(record.artAlt || record.cardName)}" />
      <div class="draw-honor-card-name">${escapeHtml(record.cardName)}</div>
      <div class="draw-honor-card-owner">${escapeHtml(record.owner)}</div>
    </article>
  `;
}

export function renderDrawHonorPanel(records = SEASON_HONOR_RECORDS) {
  return `
    <div id="draw-service-honor-panel" class="draw-honor-panel" aria-label="本赛季代抽高光">
      <div class="draw-honor-head">
        <div>
          <div class="eyebrow">Season Highlights</div>
          <div class="panel-title">本赛季代抽高光</div>
        </div>
        <span class="teaser-chip">S6 第六赛季</span>
      </div>
      <div class="draw-honor-slider" id="draw-honor-slider">
        <div class="draw-honor-track" id="draw-honor-track">
          <div class="draw-honor-slide" aria-label="代抽高光">
            <div class="draw-honor-side-title">代抽高光</div>
            <div class="draw-honor-stage" id="draw-honor-stage" aria-live="polite"></div>
          </div>
          <div class="draw-honor-slide draw-honor-deal-slide" aria-label="珍卡成交">
            <div class="draw-honor-side-title">珍卡成交</div>
            <div class="draw-honor-deal-board">
              <article class="draw-honor-deal">
                <span>本赛季成交</span>
                <strong>连环马后炮</strong>
                <b>北风</b>
                <img src="legacy-assets-svg/马后炮-safe.svg" alt="珍 连环马后炮" />
              </article>
            </div>
          </div>
        </div>
      </div>
      <div class="draw-honor-pager" aria-label="切换高光类型">
        <button class="active" type="button" data-honor-page="0">代抽</button>
        <button type="button" data-honor-page="1">成交</button>
      </div>
    </div>
  `;
}

export function initDrawHonorCarousel({
  trackId = "draw-honor-track",
  stageId = "draw-honor-stage",
  pageSelector = "[data-honor-page]",
  records = SEASON_HONOR_RECORDS,
} = {}) {
  const track = document.getElementById(trackId);
  const stage = document.getElementById(stageId);
  if (!track || !stage || stage.dataset.honorInitialized === "true") {
    return null;
  }
  stage.dataset.honorInitialized = "true";

  stage.innerHTML = records.map(renderDrawHonorCard).join("");

  const cards = Array.from(stage.querySelectorAll("[data-honor-index]"));
  let activeIndex = 0;
  let timer = null;
  let activePage = 0;
  const pageButtons = Array.from(document.querySelectorAll(pageSelector));

  function circularOffset(index) {
    let offset = index - activeIndex;
    if (offset > records.length / 2) offset -= records.length;
    if (offset < -records.length / 2) offset += records.length;
    return offset;
  }

  function flashActiveCard() {
    const activeCard = cards[activeIndex];
    if (!activeCard) return;
    activeCard.classList.remove("is-card-flashing");
    window.setTimeout(() => {
      if (!activeCard.classList.contains("draw-honor-card-main")) return;
      void activeCard.offsetWidth;
      activeCard.classList.add("is-card-flashing");
    }, 160);
  }

  function setActive(index, shouldFlash = true) {
    activeIndex = (index + records.length) % records.length;
    cards.forEach((card, cardIndex) => {
      const offset = circularOffset(cardIndex);
      const isVisible = Math.abs(offset) <= 2;
      card.className = "draw-honor-card";
      card.setAttribute("aria-hidden", isVisible ? "false" : "true");
      card.setAttribute("aria-current", offset === 0 ? "true" : "false");
      card.tabIndex = isVisible ? 0 : -1;

      if (offset === 0) {
        card.classList.add("draw-honor-card-main");
      } else if (offset === -1) {
        card.classList.add("draw-honor-card-ghost", "draw-honor-card-left");
      } else if (offset === 1) {
        card.classList.add("draw-honor-card-ghost", "draw-honor-card-right");
      } else if (offset === -2) {
        card.classList.add("draw-honor-card-ghost", "draw-honor-card-far-left");
      } else if (offset === 2) {
        card.classList.add("draw-honor-card-ghost", "draw-honor-card-far-right");
      } else {
        card.classList.add("draw-honor-card-hidden");
      }
    });
    if (shouldFlash) {
      flashActiveCard();
    }
  }

  function switchToNextCard() {
    setActive(activeIndex + 1);
    startCycle();
  }

  function startCycle() {
    window.clearInterval(timer);
    if (records.length > 1) {
      timer = window.setInterval(() => setActive(activeIndex + 1), 3600);
    }
  }

  function setPage(pageName) {
    activePage = (Number(pageName) + 2) % 2;
    track.style.transform = `translateX(-${activePage * 50}%)`;
    pageButtons.forEach((button, index) => {
      button.classList.toggle("active", index === activePage);
      button.setAttribute("aria-current", index === activePage ? "true" : "false");
    });
  }

  stage.addEventListener("mouseenter", () => window.clearInterval(timer));
  stage.addEventListener("mouseleave", startCycle);
  stage.addEventListener("click", () => {
    switchToNextCard();
  });

  stage.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-honor-index]");
    if (!card || card.getAttribute("aria-hidden") === "true") return;
    event.preventDefault();
    switchToNextCard();
  });

  pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPage(button.getAttribute("data-honor-page"));
    });
  });

  setActive(0, false);
  setPage(0);
  startCycle();

  return {
    destroy() {
      window.clearInterval(timer);
      stage.dataset.honorInitialized = "false";
    },
    next: switchToNextCard,
    setPage,
  };
}
