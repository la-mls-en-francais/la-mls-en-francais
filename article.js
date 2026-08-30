(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const list = window.FOLIO_ARTICLES || [];
  const art = list.find((a) => a.id === id) || list[0];
  if (!art) return;

  document.title = art.title + " — La MLS en Français";

  const mag = (window.FOLIO_MAGAZINES || []).find((m) => m.id === art.magazine);
  const idx = list.findIndex((a) => a.id === art.id);
  const prev = list[idx - 1];
  const next = list[idx + 1];

  const magLink = mag
    ? `<a href="lire.html?id=${mag.id}">Lire le magazine ${mag.title}</a>`
    : art.sourceUrl
      ? `<a href="${art.sourceUrl}" target="_blank" rel="noopener">Lire sur ${art.source || "la source"}</a>`
      : "";

  document.getElementById("article-root").innerHTML = `
    <p class="eyebrow">${art.category}</p>
    <h1>${art.title}</h1>
    <p class="article-meta">${art.date} · ${art.readTime}${mag ? " · " + mag.title : ""}</p>
    <img class="article-hero-img" src="${art.cover}" alt="">
    <div class="article-body">${art.body}</div>
    <div class="article-nav">
      <div>${prev ? `<a href="article.html?id=${prev.id}">← ${prev.title}</a>` : `<a href="articles.html">← Articles</a>`}</div>
      <div>${magLink}</div>
      <div>${next ? `<a href="article.html?id=${next.id}">${next.title} →</a>` : ""}</div>
    </div>
  `;

  const hid = document.getElementById("comment-article");
  if (hid) hid.value = art.id + " — " + art.title;

  const form = document.querySelector(".comment-form");
  const thanks = document.getElementById("comment-thanks");
  if (form && thanks) {
    form.addEventListener("submit", function (e) {
      if (location.protocol === "file:" || !location.hostname.includes("netlify")) {
        e.preventDefault();
        form.hidden = true;
        thanks.hidden = false;
      }
    });
  }
})();
