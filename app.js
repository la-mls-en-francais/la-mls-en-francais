(function () {
  window.folioDrafts = function () {
    try {
      return JSON.parse(localStorage.getItem("folio_drafts") || "[]");
    } catch (e) {
      return [];
    }
  };
  window.folioSaveDrafts = function (list) {
    localStorage.setItem("folio_drafts", JSON.stringify(list));
  };
  window.folioUnlocked = function () {
    return localStorage.getItem("folio_auth") === "1";
  };

  (function mergeDrafts() {
    const base = window.FOLIO_ARTICLES || [];
    const map = {};
    base.forEach(function (a) {
      if (a && a.id) map[a.id] = a;
    });
    window.folioDrafts().forEach(function (a) {
      if (a && a.id) map[a.id] = a;
    });
    window.FOLIO_ARTICLES = Object.keys(map)
      .map(function (k) { return map[k]; })
      .sort(function (a, b) {
        return String(b.dateISO || b.date || "").localeCompare(String(a.dateISO || a.date || ""));
      });
  })();

  const nav = document.querySelector("nav");
  const btn = document.querySelector(".menu-btn");
  if (btn && nav) {
    btn.addEventListener("click", () => nav.classList.toggle("open"));
  }

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  window.folioMagById = function (id) {
    return (window.FOLIO_MAGAZINES || []).find((m) => m.id === id);
  };

  window.renderMagazineGrid = function (target, list) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    el.innerHTML = list
      .map(
        (m) => `
      <article class="mag-card">
        <a href="lire.html?id=${encodeURIComponent(m.id)}">
          <div class="mag-cover"><img src="${m.cover}" alt="Couverture ${m.title}"></div>
          <div class="mag-body">
            <div class="mag-cat">${m.category}</div>
            <h3>${m.title}</h3>
            <div class="mag-meta">${m.issue} · ${m.pages} pages</div>
            <p class="mag-excerpt">${m.excerpt}</p>
          </div>
        </a>
      </article>`
      )
      .join("");
  };

  window.renderHomeUne = function (target) {
    const el = document.querySelector(target);
    if (!el) return;
    const mags = (window.FOLIO_MAGAZINES || []).slice(0, 2);
    const arts = (window.FOLIO_ARTICLES || []).slice(0, 2);
    let html = "";
    mags.forEach(function (mag) {
      html += `<a class="une-row" href="lire.html?id=${encodeURIComponent(mag.id)}">
        <img src="${mag.cover}" alt="">
        <div>
          <p class="kicker">Magazine · ${mag.issue || ""}</p>
          <h3>${mag.title}</h3>
          <p>${mag.excerpt || ""}</p>
          <span>Découvrir le magazine →</span>
        </div>
      </a>`;
    });
    arts.forEach(function (art, i) {
      html += `<a class="une-row" href="article.html?id=${encodeURIComponent(art.id)}">
        <img src="${art.cover}" alt="">
        <div>
          <p class="kicker">Article${i === 0 ? " · dernier publié" : ""}</p>
          <h3>${art.title}</h3>
          <p>${art.excerpt || ""}</p>
          <span>Lire la suite →</span>
        </div>
      </a>`;
    });
    el.innerHTML = html;
  };

  window.loadXFeed = function (target) {
    const el = document.querySelector(target || ".tweet-feed");
    if (!el) return;
    const feeds = [
      "https://rss.xcancel.com/MLS_FRA2/rss",
      "https://nitter.privacydev.net/MLS_FRA2/rss",
      "https://nitter.poast.org/MLS_FRA2/rss"
    ];
    const ava = "https://pbs.twimg.com/profile_images/1774549458396602368/0H__IZJH.jpg";
    function paint(items) {
      el.innerHTML = items.slice(0, 5).map(function (it) {
        const d = it.date ? new Date(it.date) : null;
        const when = d && !isNaN(d) ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
        const text = String(it.text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        return (
          '<a class="x-card" href="' + it.link + '" target="_blank" rel="noopener">' +
          '<img class="x-ava" src="' + ava + '" alt="">' +
          '<div><div class="x-meta"><strong>La MLS en Français</strong> <span>@MLS_FRA2' +
          (when ? " · " + when : "") + "</span></div>" +
          "<p>" + text.slice(0, 240) + (text.length > 240 ? "…" : "") + "</p></div></a>"
        );
      }).join("");
    }
    function parseRss(xml) {
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      return Array.from(doc.querySelectorAll("item")).map(function (item) {
        return {
          text: (item.querySelector("title") || {}).textContent || "",
          link: (item.querySelector("link") || {}).textContent || "https://x.com/MLS_FRA2",
          date: (item.querySelector("pubDate") || {}).textContent || ""
        };
      }).filter(function (it) { return it.text && it.text.indexOf("not yet whitelist") === -1; });
    }
    function tryFeed(i) {
      if (i >= feeds.length) return;
      fetch(feeds[i])
        .then(function (r) { if (!r.ok) throw new Error("rss"); return r.text(); })
        .then(function (xml) {
          const items = parseRss(xml);
          if (!items.length) throw new Error("empty");
          paint(items);
        })
        .catch(function () { tryFeed(i + 1); });
    }
    fetch("/.netlify/functions/tweets")
      .then(function (r) { if (!r.ok) throw new Error("fn"); return r.json(); })
      .then(function (data) {
        if (data && data.items && data.items.length) paint(data.items);
        else throw new Error("empty");
      })
      .catch(function () { tryFeed(0); });
  };

  window.loadMlsNews = function (target) {
    const el = document.querySelector(target);
    if (!el) return;
    const rss = "https://news.google.com/rss/search?q=Major+League+Soccer+OR+MLS&hl=fr&gl=FR&ceid=FR:fr";
    const url = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rss);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const items = (data.items || []).slice(0, 6);
        if (!items.length) throw new Error("empty");
        el.innerHTML = items
          .map(
            (it) => `<a class="news-item" href="${it.link}" target="_blank" rel="noopener">
              <strong>${it.title}</strong>
              <em>${(it.pubDate || "").slice(0, 16)}</em>
            </a>`
          )
          .join("");
      })
      .catch(() => {
        el.innerHTML =
          '<p class="lede" style="max-width:none">Le fil auto n’a pas pu se charger ici. Ouvre MLS.com ou le compte X.</p>';
      });
  };

  window.renderArticleGrid = function (target, list) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    el.innerHTML = list
      .map(
        (a) => `
      <article class="article-card">
        <a href="article.html?id=${encodeURIComponent(a.id)}">
          <div class="thumb"><img src="${a.cover}" alt=""></div>
          <div class="body">
            <div class="mag-cat">${a.category}</div>
            <h3>${a.title}</h3>
            <div class="mag-meta">${a.date} · ${a.readTime}</div>
            <p class="mag-excerpt">${a.excerpt}</p>
            <div class="article-read">Lire l’article</div>
          </div>
        </a>
      </article>`
      )
      .join("");
  };

  window.loadMlsScores = function (target) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;

    const NAMES = {
      "CF Montréal": "CF Montréal",
      "Inter Miami CF": "Inter Miami",
      "New York Red Bulls": "NYRB",
      "New York City FC": "NYCFC",
      "LA Galaxy": "LA Galaxy",
      "Los Angeles FC": "LAFC",
      "St. Louis CITY SC": "St. Louis",
      "Sporting Kansas City": "Kansas City",
      "Minnesota United FC": "Minnesota",
      "Orlando City SC": "Orlando",
      "Columbus Crew": "Columbus",
      "New England Revolution": "New England",
      "San Jose Earthquakes": "San Jose",
      "Seattle Sounders FC": "Seattle",
      "Vancouver Whitecaps": "Vancouver",
      "Atlanta United FC": "Atlanta",
      "Charlotte FC": "Charlotte",
      "Philadelphia Union": "Philadelphia",
      "FC Cincinnati": "Cincinnati",
      "Nashville SC": "Nashville",
      "Austin FC": "Austin",
      "Portland Timbers": "Portland",
      "Real Salt Lake": "Salt Lake",
      "Colorado Rapids": "Colorado",
      "Houston Dynamo FC": "Houston",
      "FC Dallas": "Dallas",
      "Chicago Fire FC": "Chicago",
      "D.C. United": "D.C. United",
      "San Diego FC": "San Diego",
      "Toronto FC": "Toronto",
    };

    function ymd(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return y + m + day;
    }
    function shortName(n) {
      return NAMES[n] || n.replace(/ FC$| SC$| CF$/, "");
    }
    function fmtWhen(iso, state, clock) {
      const d = new Date(iso);
      const jour = d.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).replace(".", "");
      const heure = d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      if (state === "in") return jour + " · " + (clock ? clock + " · " : "") + "En direct";
      if (state === "post") return jour + " · " + heure + " · Terminé";
      return jour + " · " + heure;
    }

    function parseEvents(data) {
      return (data.events || []).map(function (e) {
        const c = e.competitions[0];
        const home = c.competitors.find(function (t) { return t.homeAway === "home"; });
        const away = c.competitors.find(function (t) { return t.homeAway === "away"; });
        const st = c.status.type;
        return {
          date: e.date,
          state: st.state,
          clock: c.status.displayClock,
          detail: st.shortDetail,
          home: home.team.displayName,
          away: away.team.displayName,
          hLogo: home.team.logo || "",
          aLogo: away.team.logo || "",
          hs: home.score,
          as: away.score,
          hWin: !!home.winner,
          aWin: !!away.winner,
        };
      }).sort(function (a, b) {
        return a.date.localeCompare(b.date);
      });
    }

    function localDay(d) {
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    function slatesOf(list) {
      const slates = [];
      let cur = [];
      list.forEach(function (m) {
        if (!cur.length) {
          cur.push(m);
          return;
        }
        const gap = new Date(m.date) - new Date(cur[cur.length - 1].date);
        if (gap > 40 * 3600 * 1000) {
          slates.push(cur);
          cur = [m];
        } else cur.push(m);
      });
      if (cur.length) slates.push(cur);
      return slates;
    }

    function pick(list) {
      const slates = slatesOf(list);
      const future = slates.filter(function (s) {
        return s.some(function (m) { return m.state !== "post"; });
      });
      const finished = slates.filter(function (s) {
        return s.every(function (m) { return m.state === "post"; });
      });
      const lastFin = finished[finished.length - 1];
      const nextOpen = future[0];
      let chosen = nextOpen || lastFin || list;
      if (lastFin && nextOpen) {
        const last = new Date(lastFin[lastFin.length - 1].date);
        const firstNext = new Date(nextOpen[0].date);
        const nextIsLaterWeek = firstNext - last > 40 * 3600 * 1000;
        const showNext = localDay(new Date()) > localDay(last);
        if (nextIsLaterWeek && !showNext) chosen = lastFin;
      }
      return chosen.slice().sort(function (a, b) {
        if (a.state === "in" && b.state !== "in") return -1;
        if (b.state === "in" && a.state !== "in") return 1;
        return b.date.localeCompare(a.date);
      });
    }

    function draw(list) {
      if (!list.length) {
        el.innerHTML = "<p class='search-hint'>Aucun match chargé.</p>";
        return;
      }
      el.innerHTML = pick(list)
        .map(function (m) {
          const live = m.state === "in" ? " live" : "";
          const score =
            m.state === "pre" ? "—" : String(m.hs) + "-" + String(m.as);
          const hCls = m.hWin ? " win" : m.state === "post" && !m.hWin && !m.aWin ? "" : m.state === "post" ? " lose" : "";
          const aCls = m.aWin ? " win" : m.state === "post" && !m.hWin && !m.aWin ? "" : m.state === "post" ? " lose" : "";
          return (
            '<div class="score-mini' + live + '">' +
            "<em>" + fmtWhen(m.date, m.state, m.clock) + "</em>" +
            '<span class="score-side' + hCls + '">' +
            (m.hLogo ? '<img src="' + m.hLogo + '" alt="">' : "") +
            "<i>" + m.home + "</i></span>" +
            "<b>" + score + "</b>" +
            '<span class="score-side away' + aCls + '">' +
            "<i>" + m.away + "</i>" +
            (m.aLogo ? '<img src="' + m.aLogo + '" alt="">' : "") +
            "</span>" +
            "</div>"
          );
        })
        .join("");
    }

    function fetchBoard(url) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error("espn");
        return r.json();
      });
    }

    function load() {
      const from = new Date();
      from.setDate(from.getDate() - 2);
      const to = new Date();
      to.setDate(to.getDate() + 7);
      const range = ymd(from) + "-" + ymd(to);
      const url =
        "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?dates=" +
        range;
      const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
      fetchBoard(url)
        .catch(function () { return fetchBoard(proxy); })
        .then(function (data) { draw(parseEvents(data)); })
        .catch(function () {
          if (!el.children.length) {
            el.innerHTML =
              "<p class='search-hint'>Scores indisponibles. <a href='https://www.sofascore.com/fr/football/tournament/usa/mls/242' target='_blank' rel='noopener'>Ouvrir Sofascore</a></p>";
          }
        });
    }

    load();
    setInterval(load, 45000);
  };

  function fold(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function articleHaystack(a) {
    const body = String(a.body || "").replace(/<[^>]+>/g, " ");
    return fold([a.title, a.excerpt, a.category, a.source, a.date, body].join(" "));
  }

  window.searchArticles = function (query) {
    const q = fold(query).trim();
    if (!q) return window.FOLIO_ARTICLES || [];
    const words = q.split(/\s+/).filter(Boolean);
    return (window.FOLIO_ARTICLES || []).filter((a) => {
      const hay = articleHaystack(a);
      return words.every((w) => hay.indexOf(w) !== -1);
    });
  };

  function ensureArticlesThen(cb) {
    if (Array.isArray(window.FOLIO_ARTICLES)) {
      cb();
      return;
    }
    const s = document.createElement("script");
    s.src = "data/articles.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function mountSearch() {
    const header = document.querySelector(".header-inner");
    if (!header || document.querySelector(".search-btn")) return;

    const btn = document.createElement("button");
    btn.className = "search-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Rechercher un article");
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

    const menu = header.querySelector(".menu-btn");
    if (menu) header.insertBefore(btn, menu);
    else header.appendChild(btn);

    const overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.innerHTML =
      '<div class="search-panel" role="dialog" aria-label="Recherche">' +
      '<div class="search-bar">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="search" id="site-search-input" placeholder="Rechercher un article (Valeri, MLS, Toronto…)" autocomplete="off">' +
      '<button type="button" class="search-close" aria-label="Fermer">✕</button>' +
      "</div>" +
      '<div class="search-results" id="site-search-results"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    const input = overlay.querySelector("#site-search-input");
    const results = overlay.querySelector("#site-search-results");

    function paint(list, q) {
      if (!q.trim()) {
        results.innerHTML = '<p class="search-hint">Tapez un mot-clé : joueur, club, année…</p>';
        return;
      }
      if (!list.length) {
        results.innerHTML = '<p class="search-hint">Aucun article pour « ' + q.replace(/</g, "") + ' ».</p>';
        return;
      }
      results.innerHTML = list
        .slice(0, 20)
        .map(
          (a) =>
            '<a class="search-hit" href="article.html?id=' +
            encodeURIComponent(a.id) +
            '"><span class="search-hit-cat">' +
            a.category +
            "</span><strong>" +
            a.title +
            "</strong><span>" +
            (a.date || "") +
            "</span></a>"
        )
        .join("");
    }

    function run() {
      ensureArticlesThen(function () {
        paint(window.searchArticles(input.value), input.value);
      });
    }

    function open() {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      setTimeout(function () {
        input.focus();
      }, 40);
      run();
    }
    function close() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    btn.addEventListener("click", open);
    overlay.querySelector(".search-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    });
    input.addEventListener("input", run);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const first = results.querySelector(".search-hit");
        if (first) location.href = first.getAttribute("href");
        else location.href = "articles.html?q=" + encodeURIComponent(input.value.trim());
      }
    });
  }

  mountSearch();

  (function secretDesk() {
    const brand = document.querySelector(".brand");
    if (!brand) return;
    let n = 0;
    let last = 0;
    brand.addEventListener("click", function (e) {
      const now = Date.now();
      if (now - last > 1200) n = 0;
      last = now;
      n += 1;
      if (n >= 5) {
        e.preventDefault();
        location.href = "redaction.html";
      }
    });
  })();
})();
