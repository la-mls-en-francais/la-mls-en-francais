(function () {
  const root = document.getElementById("redac-root");
  if (!root) return;

  const PASS_KEY = "folio_pass";
  const AUTH_KEY = "folio_auth";

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function slugify(title) {
    return String(title || "article")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70);
  }

  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function frDate(iso) {
    if (!iso) return "";
    const p = iso.split("-");
    const months = [
      "", "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];
    return parseInt(p[2], 10) + " " + months[parseInt(p[1], 10)] + " " + p[0];
  }

  function drafts() {
    return window.folioDrafts();
  }

  function saveDrafts(list) {
    window.folioSaveDrafts(list);
  }

  function allArticles() {
    return window.FOLIO_ALL || window.FOLIO_ARTICLES || [];
  }

  function loginView(msg) {
    const hasPass = !!localStorage.getItem(PASS_KEY);
    root.innerHTML =
      '<section class="redac-gate">' +
      "<h1>Rédaction</h1>" +
      "<p>Espace visible seulement après mot de passe, sur ce navigateur.</p>" +
      (msg ? "<p class='comment-note'>" + esc(msg) + "</p>" : "") +
      '<label>' + (hasPass ? "Mot de passe" : "Choisis un mot de passe") +
      '<input type="password" id="redac-pass" autocomplete="current-password"></label>' +
      '<button class="btn" type="button" id="redac-go">' +
      (hasPass ? "Entrer" : "Créer l’accès") +
      "</button></section>";
    document.getElementById("redac-go").onclick = function () {
      const v = document.getElementById("redac-pass").value.trim();
      if (!v) return;
      if (!hasPass) {
        localStorage.setItem(PASS_KEY, v);
        localStorage.setItem(AUTH_KEY, "1");
        localStorage.setItem("folio_nostats", "1");
        location.reload();
        return;
      }
      if (v === localStorage.getItem(PASS_KEY)) {
        localStorage.setItem(AUTH_KEY, "1");
        localStorage.setItem("folio_nostats", "1");
        location.reload();
      } else loginView("Mot de passe incorrect.");
    };
  }

  function desk(editId) {
    const list = allArticles();
    const current = editId ? list.find(function (a) { return a.id === editId; }) : null;

    root.innerHTML =
      '<div class="redac-head">' +
      "<div><p class='kicker'>Privé</p><h1>Rédaction</h1></div>" +
      '<div class="redac-actions">' +
      '<button class="btn ghost" type="button" id="redac-out">Quitter</button>' +
      "</div></div>" +
      '<div class="redac-actions" style="margin:12px 0">' +
      '<button class="btn" type="button" id="redac-new">Nouvel article</button>' +
      '<label class="btn ghost">Importer un Word (.docx)' +
      '<input id="redac-docx" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden></label>' +
      "</div>" +
      '<div class="panel redac-form" id="redac-form"></div>' +
      '<p class="search-hint" id="sync-box" style="margin-top:20px">Tel et ordi : ' +
      (localStorage.getItem("folio_sync_id")
        ? "liés. Code : <strong>" + localStorage.getItem("folio_sync_id") + "</strong>"
        : "pas encore liés") +
      '</p>' +
      '<div class="redac-actions">' +
      '<button class="btn ghost" type="button" id="sync-new">Créer un code tel+ordi</button>' +
      '<button class="btn ghost" type="button" id="sync-join">Entrer le code</button>' +
      "</div>";

    document.getElementById("sync-new").onclick = function () {
      if (!window.folioCreateSync) return;
      window.folioCreateSync().then(function (id) {
        alert("Note ce code et tape-le sur l’autre appareil :\n\n" + id);
        location.reload();
      }).catch(function () { alert("Impossible de créer le lien. Réessaie."); });
    };
    document.getElementById("sync-join").onclick = function () {
      const id = prompt("Colle le code affiché sur l’autre appareil");
      if (!id || !window.folioJoinSync) return;
      window.folioJoinSync(id).then(function () {
        alert("Appareils liés. Recharge.");
        location.reload();
      }).catch(function () { alert("Code invalide."); });
    };
    document.getElementById("redac-out").onclick = function () {
      localStorage.removeItem(AUTH_KEY);
      location.href = "index.html";
    };
    document.getElementById("redac-new").onclick = function () {
      location.hash = "";
      paintForm(null);
    };
    document.getElementById("redac-docx").onchange = function (ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (typeof mammoth === "undefined") {
        alert("L’import Word n’a pas chargé. Vérifie ta connexion.");
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        mammoth
          .convertToHtml({ arrayBuffer: reader.result }, {
            convertImage: mammoth.images.imgElement(function (img) {
              return img.read("base64").then(function (b64) {
                return { src: "data:" + img.contentType + ";base64," + b64 };
              });
            }),
          })
          .then(function (res) {
            const html = res.value || "";
            const tmp = document.createElement("div");
            tmp.innerHTML = html;
            const h = tmp.querySelector("h1, h2");
            const title = (h && h.textContent.trim()) || file.name.replace(/\.docx$/i, "");
            if (h) h.remove();
            const text = tmp.textContent.trim();
            const excerpt = text.slice(0, 180).replace(/\s+/g, " ");
            paintForm({
              id: "",
              title: title,
              dateISO: todayISO(),
              date: frDate(todayISO()),
              category: "MLS",
              excerpt: excerpt,
              cover: "",
              body: tmp.innerHTML,
              readTime: "6 min",
            });
            const titleEl = document.getElementById("f-title");
            if (titleEl) titleEl.value = title;
            const bodyEl = document.getElementById("f-body");
            if (bodyEl) bodyEl.innerHTML = tmp.innerHTML;
            const ex = document.getElementById("f-excerpt");
            if (ex && !ex.value) ex.value = excerpt;
          })
          .catch(function () {
            alert("Impossible de lire ce Word. Enregistre-le en .docx et réessaie.");
          });
      };
      reader.readAsArrayBuffer(file);
    };

    const draftsOnly = allArticles().filter(function (a) { return a.status === "draft"; });
    if (draftsOnly.length) {
      const wrap = document.createElement("div");
      wrap.id = "redac-drafts";
      wrap.innerHTML = "<p class='search-hint'>Brouillons à reprendre</p>";
      draftsOnly.forEach(function (a) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn ghost";
        b.style.margin = "0 8px 8px 0";
        b.textContent = a.title || "Sans titre";
        b.onclick = function () { paintForm(a); };
        wrap.appendChild(b);
      });
      const form = document.getElementById("redac-form");
      if (form && form.parentNode) form.parentNode.insertBefore(wrap, form);
    }
    paintForm(current);
    paintMags();
  }

  function paintForm(art) {
    const el = document.getElementById("redac-form");
    const a = art || {
      id: "",
      title: "",
      dateISO: todayISO(),
      date: frDate(todayISO()),
      category: "MLS",
      excerpt: "",
      cover: "",
      body: "",
      readTime: "6 min",
    };
    el.innerHTML =
      "<h2>" + (art ? "Modifier" : "Nouvel article") + "</h2>" +
      '<div class="redac-actions">' +
      '<button class="btn" type="button" data-act="save">Publier</button>' +
      '<button class="btn ghost" type="button" data-act="draft">Enregistrer brouillon</button>' +
      '<button class="btn ghost" type="button" data-act="preview">Prévisualiser</button>' +
      "</div>" +
      '<label>Titre <input id="f-title" value="' + esc(a.title) + '"></label>' +
      '<label>Date <input id="f-date" type="date" value="' + esc(a.dateISO || todayISO()) + '"></label>' +
      '<label>Catégorie <select id="f-cat">' +
      '<option value="MLS"' + (a.category === "MLS" ? " selected" : "") + ">MLS</option>" +
      '<option value="Soccer US"' + (a.category === "Soccer US" ? " selected" : "") + ">Soccer US</option>" +
      "</select></label>" +
      '<label>Chapeau <textarea id="f-excerpt" rows="3">' + esc(a.excerpt) + "</textarea></label>" +
      '<label>Une (lien image ou fichier)' +
      '<input id="f-cover" value="' + esc(a.cover) + '" placeholder="img/une-….jpg ou https://…">' +
      '<input id="f-cover-file" type="file" accept="image/*"></label>' +
      (a.cover ? '<img class="redac-cover" src="' + esc(a.cover) + '" alt="">' : "") +
      '<label>Article' +
      '<div class="redac-tools">' +
      '<button type="button" data-cmd="formatBlock" data-val="h2">Titre</button>' +
      '<button type="button" data-cmd="bold">Gras</button>' +
      '<button type="button" data-cmd="italic">Italique</button>' +
      '<button type="button" id="f-img">Image</button>' +
      "</div>" +
      '<div id="f-body" class="redac-editor" contenteditable="true"></div></label>' +
      '<div class="redac-actions">' +
      '<button class="btn" type="button" data-act="save">Publier</button>' +
      '<button class="btn ghost" type="button" data-act="draft">Brouillon</button>' +
      '<button class="btn ghost" type="button" data-act="preview">Prévisualiser</button>' +
      (art && art.id ? '<a class="btn ghost" href="article.html?id=' + encodeURIComponent(a.id) + '">Voir en ligne</a>' : "") +
      '<button class="btn ghost" type="button" id="f-export">Télécharger articles.js</button>' +
      "</div>" +
      '<p class="comment-note">Publier enregistre sur <strong>ce navigateur</strong> et l’article apparaît tout de suite. Pour que tout le monde le voie sur Cloudflare : télécharge articles.js et remplace folio/data/articles.js, puis renvoie le dossier folio.</p>';

    const body = document.getElementById("f-body");
    body.innerHTML = a.body || "";
    el.querySelectorAll("[data-cmd]").forEach(function (btn) {
      btn.onclick = function () {
        body.focus();
        const cmd = btn.getAttribute("data-cmd");
        const val = btn.getAttribute("data-val") || "";
        document.execCommand(cmd, false, val);
      };
    });
    document.getElementById("f-img").onclick = function () {
      const url = prompt("Lien de l’image");
      if (!url) return;
      body.focus();
      document.execCommand("insertImage", false, url);
    };
    document.getElementById("f-cover-file").onchange = function (ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        document.getElementById("f-cover").value = reader.result;
      };
      reader.readAsDataURL(file);
    };

    function collect(status) {
      const title = document.getElementById("f-title").value.trim();
      if (!title) {
        alert("Il faut un titre.");
        return null;
      }
      const iso = document.getElementById("f-date").value || todayISO();
      const id = (art && art.id) || slugify(title);
      return {
        id: id,
        title: title,
        dateISO: iso,
        date: frDate(iso),
        category: document.getElementById("f-cat").value || "MLS",
        excerpt: document.getElementById("f-excerpt").value.trim(),
        cover: document.getElementById("f-cover").value.trim() || "img/logo.png",
        body: document.getElementById("f-body").innerHTML,
        readTime: "6 min",
        source: "La MLS en Français",
        status: status,
      };
    }
    function persist(item, msg) {
      const others = drafts().filter(function (d) { return d.id !== item.id; });
      others.push(item);
      saveDrafts(others);
      if (window.folioPushSync) window.folioPushSync();
      alert(msg);
      location.href = "redaction.html#" + encodeURIComponent(item.id);
      location.reload();
    }
    el.querySelectorAll('[data-act="save"]').forEach(function (b) {
      b.onclick = function () {
        const item = collect("published");
        if (item) persist(item, "Publié dans " + item.category + " (sur cet appareil).");
      };
    });
    el.querySelectorAll('[data-act="draft"]').forEach(function (b) {
      b.onclick = function () {
        const item = collect("draft");
        if (item) persist(item, "Brouillon enregistré. Invisible pour les lecteurs.");
      };
    });
    el.querySelectorAll('[data-act="preview"]').forEach(function (b) {
      b.onclick = function () {
      const item = collect((art && art.status) || "draft");
      if (!item) return;
        sessionStorage.setItem("folio_preview", JSON.stringify(item));
        window.open("article.html?preview=1", "_blank");
      };
    });

    document.getElementById("f-export").onclick = function () {
      const payload =
        "window.FOLIO_ARTICLES = " +
        JSON.stringify(allArticles(), null, 2) +
        ";\n";
      const blob = new Blob([payload], { type: "text/javascript" });
      const url = URL.createObjectURL(blob);
      const aEl = document.createElement("a");
      aEl.href = url;
      aEl.download = "articles.js";
      aEl.click();
      URL.revokeObjectURL(url);
    };
  }

  function paintMags() {
    const host = document.getElementById("redac-root");
    if (!host || document.getElementById("redac-mags")) return;
    const box = document.createElement("section");
    box.id = "redac-mags";
    box.className = "panel";
    box.style.margin = "24px 0 48px";
    box.innerHTML =
      "<h2>Ajouter un magazine (Heyzine)</h2>" +
      "<p class='search-hint'>Lien du flip-book + image de Une. Visible ensuite à l’accueil et dans Magazines.</p>" +
      '<label>Titre <input id="m-title" value="Magazine League Soccer"></label>' +
      '<label>Numéro / date <input id="m-issue" placeholder="N° 3 — Septembre 2026"></label>' +
      '<label>Lien Heyzine <input id="m-url" placeholder="https://heyzine.com/flip-book/….html"></label>' +
      '<label>Pages <input id="m-pages" type="number" value="48"></label>' +
      '<label>Chapeau <textarea id="m-excerpt" rows="2"></textarea></label>' +
      '<label>Couverture (lien ou fichier)' +
      '<input id="m-cover" placeholder="img/….jpg ou https://…">' +
      '<input id="m-cover-file" type="file" accept="image/*"></label>' +
      '<div class="redac-actions">' +
      '<button class="btn" type="button" id="m-save">Ajouter le magazine</button>' +
      '<button class="btn ghost" type="button" id="m-export">Télécharger magazines.js</button>' +
      "</div>" +
      '<div id="m-list" class="redac-list"></div>';
    host.appendChild(box);
    function refreshList() {
      document.getElementById("m-list").innerHTML = (window.FOLIO_MAGAZINES || []).map(function (m) {
        return "<div class='redac-item'><strong>" + esc(m.issue || m.title) + "</strong><span>" + esc(m.embedUrl || "") + "</span></div>";
      }).join("");
    }
    refreshList();
    document.getElementById("m-cover-file").onchange = function (ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () { document.getElementById("m-cover").value = reader.result; };
      reader.readAsDataURL(file);
    };
    document.getElementById("m-save").onclick = function () {
      const url = document.getElementById("m-url").value.trim();
      const issue = document.getElementById("m-issue").value.trim();
      if (!url || !/^https?:\/\//i.test(url)) {
        alert("Colle le lien Heyzine (https://heyzine.com/flip-book/…)");
        return;
      }
      if (!issue) { alert("Indique le numéro."); return; }
      const id = slugify(issue);
      const item = {
        id: id,
        title: document.getElementById("m-title").value.trim() || "Magazine League Soccer",
        issue: issue,
        category: "Magazine",
        date: issue,
        pages: parseInt(document.getElementById("m-pages").value, 10) || 48,
        featured: true,
        cover: document.getElementById("m-cover").value.trim() || "img/logo.png",
        excerpt: document.getElementById("m-excerpt").value.trim(),
        description: document.getElementById("m-excerpt").value.trim(),
        mode: "heyzine",
        embedUrl: url
      };
      const others = window.folioMagsLocal().filter(function (m) { return m.id !== id; });
      others.unshift(item);
      window.folioSaveMags(others);
      if (window.folioPushSync) window.folioPushSync();
      const map = {};
      (window.FOLIO_MAGAZINES || []).concat(others).forEach(function (m) { if (m && m.id) map[m.id] = m; });
      window.FOLIO_MAGAZINES = Object.keys(map).map(function (k) { return map[k]; });
      refreshList();
      alert("Magazine ajouté sur cet appareil.");
    };
    document.getElementById("m-export").onclick = function () {
      const blob = new Blob(["window.FOLIO_MAGAZINES = " + JSON.stringify(window.FOLIO_MAGAZINES || [], null, 2) + ";\n"], { type: "text/javascript" });
      const aEl = document.createElement("a");
      aEl.href = URL.createObjectURL(blob);
      aEl.download = "magazines.js";
      aEl.click();
    };
  }

  function currentId() {
    return decodeURIComponent((location.hash || "").replace(/^#/, ""));
  }
  function openFromHash() {
    const go = function () { desk(currentId() || null); };
    if (window.folioPullSync) window.folioPullSync().then(go, go);
    else go();
  }

  if (!localStorage.getItem(AUTH_KEY)) {
    loginView();
    return;
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
})();
