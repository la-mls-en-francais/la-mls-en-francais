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
  window.folioHitKey = function (kind, id) {
    return encodeURIComponent("lamlsenfrancais") + "/" + encodeURIComponent(kind + "-" + id);
  };
  window.folioReadHits = function (kind, id) {
    const url = "https://api.counterapi.dev/v1/" + window.folioHitKey(kind, id);
    return fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      return (d && (d.count || d.value)) || 0;
    }).catch(function () { return 0; });
  };
  window.folioBumpHits = function (kind, id) {
    if (localStorage.getItem("folio_auth") === "1") return window.folioReadHits(kind, id);
    if (localStorage.getItem("folio_nostats") === "1") return window.folioReadHits(kind, id);
    const url = "https://api.counterapi.dev/v1/" + window.folioHitKey(kind, id) + "/up";
    return fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      return (d && (d.count || d.value)) || 0;
    }).catch(function () { return 0; });
  };
  window.folioHitsLabel = function (n) {
    const v = parseInt(n, 10) || 0;
    return v + " lecture" + (v > 1 ? "s" : "");
  };
  window.folioFillHits = function (root) {
    const scope = root || document;
    const nodes = scope.querySelectorAll("[data-hits]");
    nodes.forEach(function (node) {
      const raw = node.getAttribute("data-hits") || "";
      const parts = raw.split(":");
      if (parts.length < 2) return;
      window.folioReadHits(parts[0], parts.slice(1).join(":")).then(function (n) {
        node.textContent = window.folioHitsLabel(n);
      });
    });
  };
  window.folioUnlocked = function () {
    return localStorage.getItem("folio_auth") === "1";
  };
  window.folioMagsLocal = function () {
    try {
      return JSON.parse(localStorage.getItem("folio_mags") || "[]");
    } catch (e) {
      return [];
    }
  };
  window.folioSaveMags = function (list) {
    localStorage.setItem("folio_mags", JSON.stringify(list));
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
    const merged = Object.keys(map)
      .map(function (k) { return map[k]; })
      .sort(function (a, b) {
        return String(b.dateISO || b.date || "").localeCompare(String(a.dateISO || a.date || ""));
      });
    window.FOLIO_ALL = merged;
    window.FOLIO_ARTICLES = (localStorage.getItem("folio_auth") === "1")
      ? merged
      : merged.filter(function (a) { return a.status !== "draft"; });
  })();

  (function mergeMags() {
    const base = window.FOLIO_MAGAZINES || [];
    const map = {};
    base.forEach(function (m) { if (m && m.id) map[m.id] = m; });
    window.folioMagsLocal().forEach(function (m) { if (m && m.id) map[m.id] = m; });
    window.FOLIO_MAGAZINES = Object.keys(map).map(function (k) { return map[k]; });
  })();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  const nav = document.querySelector("nav");
  const btn = document.querySelector(".menu-btn");
  if (btn && nav) {
    btn.addEventListener("click", () => nav.classList.toggle("open"));
  }

  if (window.folioUnlocked && folioUnlocked()) {
    try { localStorage.setItem("folio_nostats", "1"); } catch (e) {}
    const navEl = document.querySelector("nav");
    if (navEl && !navEl.querySelector("[data-redac]")) {
      const a = document.createElement("a");
      a.href = "redaction.html";
      a.textContent = "Rédaction";
      a.setAttribute("data-redac", "1");
      navEl.appendChild(a);
    }
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
            <div class="mag-meta">${m.issue} · ${m.pages} pages · <span data-hits="magazine:${m.id}">…</span></div>
            <p class="mag-excerpt">${m.excerpt}</p>
          </div>
        </a>
      </article>`
      )
      .join("");
    if (window.folioFillHits) window.folioFillHits(el);
  };

  window.renderHomeUne = function (target) {
    const el = document.querySelector(target);
    if (!el) return;
    const mags = (window.FOLIO_MAGAZINES || []).slice(0, 2);
    const arts = (window.FOLIO_ARTICLES || []).slice(0, 2);
    let html = "";
    if (mags.length) {
      html += '<div class="une-block une-block-mag"><p class="une-label">Magazines</p>';
      mags.forEach(function (mag) {
        html += `<a class="une-row is-mag" href="lire.html?id=${encodeURIComponent(mag.id)}">
          <img src="${mag.cover}" alt="">
          <div>
            <p class="kicker">Magazine · ${mag.issue || ""}</p>
            <h3>${mag.title}</h3>
            <p class="kicker"><span data-hits="magazine:${mag.id}">…</span></p>
            <p>${mag.excerpt || ""}</p>
            <span>Découvrir le magazine →</span>
          </div>
        </a>`;
      });
      html += "</div>";
    }
    if (arts.length) {
      html += '<div class="une-block une-block-art"><p class="une-label">Articles</p>';
      arts.forEach(function (art, i) {
        html += `<a class="une-row is-art" href="article.html?id=${encodeURIComponent(art.id)}">
          <img src="${art.cover}" alt="">
          <div>
            <p class="kicker">Article${i === 0 ? " · dernier publié" : ""}</p>
            <h3>${art.title}</h3>
            <p class="kicker"><span data-hits="article:${art.id}">…</span></p>
            <p>${art.excerpt || ""}</p>
            <span>Lire la suite →</span>
          </div>
        </a>`;
      });
      html += "</div>";
    }
    el.innerHTML = html;
    if (window.folioFillHits) window.folioFillHits(el);
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
      el.innerHTML = items.slice(0, 6).map(function (it) {
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
    function fromApi(url) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error("fn");
        return r.json();
      }).then(function (data) {
        const items = (data && data.items) || [];
        if (!items.length) throw new Error("empty");
        paint(items);
      });
    }
    fromApi("/tweets")
      .catch(function () { return fromApi("/api/tweets"); })
      .catch(function () { return fromApi("https://mls-tweets.7vpwfnf74b.workers.dev/"); })
      .catch(function () { return fromApi("/.netlify/functions/tweets"); })
      .catch(function () { /* cartes déjà dans la page */ });
  };

  function folioNewsStore(key, incoming) {
    var prev = [];
    try { prev = JSON.parse(localStorage.getItem(key) || "[]"); } catch (err) { prev = []; }
    var map = {};
    prev.concat(incoming || []).forEach(function (it) {
      if (!it || !it.title) return;
      var k = String(it.title).toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 70);
      var old = map[k];
      if (!old || (it.ts || 0) >= (old.ts || 0)) map[k] = it;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; });
    list.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    list = list.slice(0, 150);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (err) {}
    return list;
  }

  window.loadMlsNews = function () {
    const newsEl = document.querySelector("#mls-news");
    const rumEl = document.querySelector("#mls-rumors");
    if (!newsEl && !rumEl) return;
    const newsLimit = 7;
    const rumLimit = 7;
    function isRumor(title) {
      if (/\b(tracker|buts?|goals?|assists?|power ranking|hat-?trick|quadrupl|faits marquants)\b/i.test(title)) return false;
      if (/^sources\s*:/i.test(title)) return true;
      return /\b(transfer|transfers|trade|loan|loans|sign(?:s|ed|ing)?|joins?|joined|acquire[ds]?|rumour|rumor|deal|contract|waive[ds]?)\b/i.test(title);
    }
    function paint(el, items, empty) {
      if (!el) return;
      if (!items.length) {
        el.innerHTML = "<p class='search-hint'>" + empty + "</p>";
        return;
      }
      el.innerHTML = items.map(function (it) {
        const img = it.img ? '<img class="news-cover" src="' + it.img + '" alt="">' : "";
        return '<a class="news-item" href="' + it.link + '" target="_blank" rel="noopener">' +
          img + "<div><strong>" + it.title + "</strong><em>" + (it.when || "") +
          "</em></div></a>";
      }).join("");
    }
    function translate(text) {
      const src = String(text || "").trim();
      if (!src) return Promise.resolve(src);
      if (/[àâäéèêëïîôùûç]/i.test(src)) return Promise.resolve(src);
      const q = encodeURIComponent(src.slice(0, 180));
      return fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=" + q)
        .then(function (r) { if (!r.ok) throw new Error("gtx"); return r.json(); })
        .then(function (d) {
          const out = (d && d[0] || []).map(function (row) { return row[0] || ""; }).join("");
          if (out) return out;
          throw new Error("empty");
        })
        .catch(function () {
          return fetch("https://api.mymemory.translated.net/get?langpair=en|fr&q=" + q)
            .then(function (r) { return r.json(); })
            .then(function (d) {
              const out = d && d.responseData && d.responseData.translatedText;
              if (!out || /MYMEMORY|QUERY LENGTH|INVALID/i.test(out)) return src;
              return out;
            });
        })
        .catch(function () { return src; });
    }
    function pack(a) {
      const d = a.published ? new Date(a.published) : null;
      const title = a.headline || a.description || "";
      return {
        title: title,
        link: (a.links && a.links.web && a.links.web.href) || "https://www.mlssoccer.com/news/",
        when: d && !isNaN(d) ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "",
        img: (a.images && a.images[0] && (a.images[0].url || a.images[0].href)) || "",
        rumor: isRumor(title),
      };
    }
    function espnNews(url) {
      return fetch(url).then(function (r) { if (!r.ok) throw new Error("espn"); return r.json(); }).catch(function () { return { articles: [] }; });
    }
    Promise.all([
      espnNews("https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/news?limit=50"),
      espnNews("https://site.api.espn.com/apis/site/v2/sports/soccer/news?limit=50")
    ])
      .then(function (feeds) {
        const seen = {};
        const all = [];
        feeds.forEach(function (data) {
          (data.articles || []).forEach(function (a) {
            const it = pack(a);
            if (!it.title || seen[it.title]) return;
            seen[it.title] = 1;
            all.push(it);
          });
        });
        const rum = all.filter(function (it) { return it.rumor; }).slice(0, rumLimit);
        const news = all.filter(function (it) { return !it.rumor; }).slice(0, newsLimit);
        return Promise.all(news.concat(rum).map(function (it) {
          return translate(it.title).then(function (fr) { it.title = fr; return it; });
        })).then(function () {
          paint(newsEl, news, "Pas de brève.");
          paint(rumEl, rum, "Pas de rumeur.");
        });
      })
      .catch(function () {
        paint(newsEl, [], "Actu indisponible.");
        paint(rumEl, [], "Transferts indisponibles.");
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
            <div class="mag-meta">${a.date} · ${a.readTime} · <span data-hits="article:${a.id}">…</span></div>
            <p class="mag-excerpt">${a.excerpt}</p>
            <div class="article-read">Lire l’article</div>
          </div>
        </a>
      </article>`
      )
      .join("");
    if (window.folioFillHits) window.folioFillHits(el);
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
        return a.date.localeCompare(b.date);
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

  window.loadMlsStandings = function (target) {
    const el = document.querySelector(target);
    if (!el) return;

    function stat(entry, name) {
      const s = (entry.stats || []).find(function (x) { return x.name === name; });
      return s ? s.displayValue : "–";
    }
    function logo(team) {
      const list = team.logos || [];
      return list.length ? list[0].href : "";
    }
    function confName(raw) {
      const n = String(raw || "");
      if (/east/i.test(n)) return "Conférence Est";
      if (/west/i.test(n)) return "Conférence Ouest";
      return n;
    }
    function playoffKind(entry) {
      const d = ((entry.note || {}).description || "").toLowerCase();
      if (d.indexOf("wild card") !== -1) return "wc";
      if (d.indexOf("playoff") !== -1) return "po";
      return "";
    }
    function row(entry) {
      const team = entry.team || {};
      const rank = parseInt(stat(entry, "rank"), 10) || 0;
      const kind = playoffKind(entry);
      const cls = kind === "wc" ? "in-wc" : kind ? "in-po" : "";
      const src = logo(team);
      return (
        '<tr class="' + cls + '">' +
        "<td class='rk'>" + rank + "</td>" +
        "<td class='club'>" +
        (src ? '<img src="' + src + '" alt="">' : "") +
        "<span>" + (team.displayName || team.name || "") + "</span></td>" +
        "<td>" + stat(entry, "gamesPlayed") + "</td>" +
        "<td>" + stat(entry, "wins") + "</td>" +
        "<td>" + stat(entry, "ties") + "</td>" +
        "<td>" + stat(entry, "losses") + "</td>" +
        "<td>" + stat(entry, "pointDifferential") + "</td>" +
        "<td class='pts'>" + stat(entry, "points") + "</td>" +
        "</tr>"
      );
    }
    function table(child) {
      const entries = ((child.standings || {}).entries || []).slice().sort(function (a, b) {
        return (parseInt(stat(a, "rank"), 10) || 99) - (parseInt(stat(b, "rank"), 10) || 99);
      });
      let html =
        "<div class='stand-conf'><h3>" + confName(child.name) + "</h3>" +
        "<div class='stand-scroll'><table class='stand'><thead><tr>" +
        "<th>#</th><th>Club</th><th>MJ</th><th>V</th><th>N</th><th>D</th><th>Diff</th><th>Pts</th>" +
        "</tr></thead><tbody>";
      entries.forEach(function (e, i) {
        const rank = parseInt(stat(e, "rank"), 10) || i + 1;
        html += row(e);
        if (rank === 7) html += "<tr class='po-line'><td colspan='8'>Playoffs — 1er tour</td></tr>";
        if (rank === 9) html += "<tr class='po-line wc'><td colspan='8'>Wild Card</td></tr>";
      });
      html += "</tbody></table></div></div>";
      return html;
    }

    const url = "https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings";
    const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    function ok(data) {
      const kids = data.children || [];
      if (!kids.length) throw new Error("empty");
      el.innerHTML = "<h3 class='stand-title'>Classement MLS</h3><div class='stand-grid'>" +
        kids.map(table).join("") + "</div>";
    }
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("espn"); return r.json(); })
      .then(ok)
      .catch(function () {
        return fetch(proxy).then(function (r) { return r.json(); }).then(ok);
      })
      .catch(function () {
        el.innerHTML = "<p class='search-hint'>Classement indisponible pour le moment.</p>";
      });
  };

  window.loadMlsLeaders = function (target) {
    const el = document.querySelector(target);
    if (!el) return;
    const url = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/statistics";
    const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);

    function headshot(ath) {
      if (ath.headshot && ath.headshot.href) return ath.headshot.href;
      if (ath.id) return "https://a.espncdn.com/i/headshots/soccer/players/full/" + ath.id + ".png";
      return "";
    }
    function initials(name) {
      return String(name)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(function (w) { return w.charAt(0).toUpperCase(); })
        .join("");
    }
    function onlyNumber(row) {
      if (row.value !== undefined && row.value !== null && row.value !== "") {
        return String(Math.round(Number(row.value)));
      }
      const t = String(row.displayValue || "");
      const m = t.match(/Goals:\s*(\d+)/i) || t.match(/Assists:\s*(\d+)/i);
      return m ? m[1] : "";
    }
    function list(block, label) {
      const rows = (block.leaders || []).slice(0, 10);
      let html = "<div class='lead-col'><h3>" + label + "</h3><ol class='lead-list'>";
      rows.forEach(function (row, i) {
        const a = row.athlete || {};
        const name = a.fullName || a.displayName || a.shortName || "Joueur";
        const src = headshot(a);
        const val = onlyNumber(row);
        html +=
          "<li><em>" + (i + 1) + "</em>" +
          '<span class="lead-ava"><i>' + initials(name) + "</i>" +
          (src ? '<img src="' + src + '" alt="" onerror="this.remove()">' : "") +
          "</span>" +
          "<span>" + name + "</span><strong>" + val + "</strong></li>";
      });
      html += "</ol></div>";
      return html;
    }
    function draw(data) {
      const stats = data.stats || [];
      const goals = stats.find(function (s) { return /goal/i.test(s.name || s.abbreviation || ""); }) || stats[0];
      const assists = stats.find(function (s) { return /assist/i.test(s.name || s.abbreviation || ""); }) || stats[1];
      if (!goals && !assists) throw new Error("empty");
      el.innerHTML =
        "<h3 class='stand-title'>Buteurs et passeurs</h3><div class='lead-grid'>" +
        (goals ? list(goals, "Meilleurs buteurs") : "") +
        (assists ? list(assists, "Meilleurs passeurs") : "") +
        "</div>";
    }
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("espn"); return r.json(); })
      .then(draw)
      .catch(function () {
        return fetch(proxy).then(function (r) { return r.json(); }).then(draw);
      })
      .catch(function () {
        el.innerHTML = "<p class='search-hint'>Classements buteurs indisponibles.</p>";
      });
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
