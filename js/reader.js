(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "mls-n1";
  const mag = (window.FOLIO_MAGAZINES || []).find((m) => m.id === id) || window.FOLIO_MAGAZINES[0];

  document.title = mag.title + " — La MLS en Français";
  const titleEl = document.querySelector("[data-reader-title]");
  const issueEl = document.querySelector("[data-reader-issue]");
  if (titleEl) titleEl.textContent = mag.title;
  if (issueEl) {
    issueEl.innerHTML = mag.issue + " · " + mag.category +
      ' · <span data-hits="magazine:' + mag.id + '">…</span>';
  }
  if (window.folioBumpHits && params.get("preview") !== "1") {
    window.folioBumpHits("magazine", mag.id).then(function (n) {
      const el = document.querySelector('[data-hits="magazine:' + mag.id + '"]');
      if (el) el.textContent = window.folioHitsLabel(n);
    });
  }

  const embedHost = document.getElementById("embed-host");
  const bookHost = document.getElementById("book");

  if (mag.mode === "heyzine" && mag.embedUrl) {
    document.body.classList.add("heyzine-mode");
    if (bookHost) bookHost.style.display = "none";
    if (embedHost) {
      embedHost.hidden = false;
      embedHost.innerHTML = `<iframe src="${mag.embedUrl}" allowfullscreen allow="fullscreen" loading="lazy" title="${mag.title}"></iframe>`;
    }
    document.querySelector("[data-fs]")?.addEventListener("click", function () {
      const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const goFs = embedHost.requestFullscreen || embedHost.webkitRequestFullscreen;
      if (goFs && !isiOS) {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          goFs.call(embedHost);
        } else if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }
      document.body.classList.toggle("fs-lite");
      this.textContent = document.body.classList.contains("fs-lite") ? "Quitter" : "Plein écran";
    });
    return;
  }

  const editorial = editorialPages(mag);
  const pages = [];

  (mag.images || [mag.cover]).forEach((src, i) => {
    pages.push(imagePage(src, i === 0 ? "Couverture" : "Planche " + i));
    if (editorial[i]) pages.push(editorial[i]);
  });
  pages.push(backPage(mag));

  bookHost.innerHTML = pages.join("");

  function initFlip() {
    if (!window.St || !St.PageFlip) {
      bookHost.innerHTML =
        '<p style="padding:40px;text-align:center">Lecteur en cours de chargement…</p>';
      return;
    }
    const pageFlip = new St.PageFlip(bookHost, {
      width: 480,
      height: 720,
      size: "stretch",
      minWidth: 280,
      maxWidth: 560,
      minHeight: 420,
      maxHeight: 860,
      drawShadow: true,
      flippingTime: 800,
      usePortrait: true,
      maxShadowOpacity: 0.45,
      showCover: true,
      mobileScrollSupport: true
    });
    pageFlip.loadFromHTML(document.querySelectorAll("#book .page"));

    const current = document.querySelector("[data-page-current]");
    const total = document.querySelector("[data-page-total]");
    if (total) total.textContent = pageFlip.getPageCount();
    pageFlip.on("flip", (e) => {
      if (current) current.textContent = e.data + 1;
    });

    document.querySelector("[data-prev]")?.addEventListener("click", () => pageFlip.flipPrev());
    document.querySelector("[data-next]")?.addEventListener("click", () => pageFlip.flipNext());
    document.querySelector("[data-fs]")?.addEventListener("click", () => {
      const root = document.querySelector(".reader-stage");
      if (!document.fullscreenElement) root.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
  }

  if (window.St && St.PageFlip) initFlip();
  else {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js";
    s.onload = initFlip;
    document.body.appendChild(s);
  }

  function imagePage(src, label) {
    return `<div class="page" data-density="hard">
      <img class="full" src="${src}" alt="${label}">
    </div>`;
  }

  function backPage(m) {
    return `<div class="page" data-density="hard">
      <div class="page-html" style="background:#1c1814;color:#efe6d6;justify-content:center;text-align:center">
        <div class="pg-kicker">La MLS en Français</div>
        <h2 style="color:#efe6d6">${m.title}</h2>
        <p>${m.issue}</p>
        <p class="page-num" style="color:#c9a56a">Merci d’avoir feuilleté ce numéro.</p>
      </div>
    </div>`;
  }

  function editorialPages(m) {
    return [
      `<div class="page">
        <div class="page-html">
          <div class="pg-kicker">${m.category}</div>
          <h2>Édito</h2>
          <p>${m.description}</p>
          <p style="margin-top:16px">${m.excerpt}</p>
          <div class="page-num">02</div>
        </div>
      </div>`,
      `<div class="page">
        <div class="page-html">
          <div class="pg-kicker">Sommaire</div>
          <h2>Dans ce numéro</h2>
          <p>01 — Ouverture photographique</p>
          <p>02 — Carnet de route</p>
          <p>03 — Entretien</p>
          <p>04 — Portfolio</p>
          <p>05 — Carnet pratique</p>
          <div class="page-num">${m.pages} pages · ${m.date}</div>
        </div>
      </div>`
    ];
  }
})();
