(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const list = window.FOLIO_ALL || window.FOLIO_ARTICLES || [];
  let art = list.find((a) => a.id === id);
  if (params.get("preview") === "1") {
    try {
      const p = JSON.parse(sessionStorage.getItem("folio_preview") || "null");
      if (p && p.title) art = p;
    } catch (e) {}
  }
  if (!art) art = list[0];
  if (!art) return;

  document.title = art.title + " — La MLS en Français";

  const mag = (window.FOLIO_MAGAZINES || []).find((m) => m.id === art.magazine);
  const idx = list.findIndex((a) => a.id === art.id);
  const prev = list[idx - 1];
  const next = list[idx + 1];
  const pageUrl = location.href;

  const related = list
    .filter(function (a) { return a.id !== art.id; })
    .filter(function (a) { return !art.category || a.category === art.category; })
    .slice(0, 3);
  const relatedFallback = related.length ? related : list.filter(function (a) { return a.id !== art.id; }).slice(0, 3);

  const shareX =
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(art.title + " — La MLS en Français") +
    "&url=" + encodeURIComponent(pageUrl);
  const shareFb =
    "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pageUrl);

  const relatedHtml = relatedFallback.length
    ? "<section class='related'><h2>À lire aussi</h2><div class='related-grid'>" +
      relatedFallback
        .map(function (a) {
          return (
            '<a class="related-card" href="article.html?id=' +
            encodeURIComponent(a.id) +
            '">' +
            (a.cover ? '<img src="' + a.cover + '" alt="">' : "") +
            "<div><span>" +
            (a.category || "") +
            "</span><strong>" +
            a.title +
            "</strong><em>" +
            (a.date || "") +
            "</em></div></a>"
          );
        })
        .join("") +
      "</div></section>"
    : "";

  document.getElementById("article-root").innerHTML =
    '<p class="eyebrow">' + (art.category || "MLS") + "</p>" +
    "<h1>" + art.title + "</h1>" +
    '<p class="article-meta">' +
    "<span>" + (art.date || "") + "</span>" +
    "<span>Arnaud Salas</span>" +
    "<span>" + (art.readTime || "6 min") + "</span>" +
    '<span data-hits="article:' + art.id + '">…</span>' +
    "</p>" +
    (art.cover ? '<img class="article-hero-img" src="' + art.cover + '" alt="">' : "") +
    '<div class="article-body">' + (art.body || "") + "</div>" +
    '<div class="share-row">' +
    '<a class="btn ghost" href="' + shareX + '" target="_blank" rel="noopener">Partager sur X</a>' +
    '<a class="btn ghost" href="' + shareFb + '" target="_blank" rel="noopener">Facebook</a>' +
    "</div>" +
    relatedHtml +
    '<div class="article-nav">' +
    "<div>" +
    (prev
      ? '<a href="article.html?id=' + prev.id + '">← ' + prev.title + "</a>"
      : '<a href="articles.html">← Articles</a>') +
    "</div>" +
    "<div>" +
    (next ? '<a href="article.html?id=' + next.id + '">' + next.title + " →</a>" : "") +
    "</div></div>";

  if (window.folioBumpHits && params.get("preview") !== "1") {
    window.folioBumpHits("article", art.id).then(function (n) {
      const el = document.querySelector('[data-hits="article:' + art.id + '"]');
      if (el) el.textContent = window.folioHitsLabel(n);
    });
  }

  const hid = document.getElementById("comment-article");
  if (hid) hid.value = art.id + " — " + art.title;

  const form = document.querySelector(".comment-form");
  const thanks = document.getElementById("comment-thanks");
  if (form && thanks) {
    form.addEventListener("submit", function (e) {
      if (location.protocol === "file:" || location.hostname.indexOf("netlify") === -1) {
        e.preventDefault();
        form.hidden = true;
        thanks.hidden = false;
      }
    });
  }
})();
