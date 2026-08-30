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
    return window.FOLIO_ARTICLES || [];
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
        location.reload();
        return;
      }
      if (v === localStorage.getItem(PASS_KEY)) {
        localStorage.setItem(AUTH_KEY, "1");
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
      '<div class="redac-grid">' +
      '<aside class="panel">' +
      '<button class="btn" type="button" id="redac-new">Nouvel article</button>' +
      '<label class="btn ghost" style="display:block;text-align:center;margin-top:8px">Importer un Word (.docx)' +
      '<input id="redac-docx" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden></label>' +
      '<div class="redac-list" id="redac-list"></div></aside>' +
      '<div class="panel redac-form" id="redac-form"></div>' +
      "</div>";

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

    const box = document.getElementById("redac-list");
    box.innerHTML = list
      .map(function (a) {
        return (
          '<a class="redac-item' +
          (current && current.id === a.id ? " on" : "") +
          '" href="redaction.html#' +
          encodeURIComponent(a.id) +
          '"><strong>' +
          esc(a.title) +
          "</strong><span>" +
          esc(a.date) +
          "</span></a>"
        );
      })
      .join("");
    box.querySelectorAll(".redac-item").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const id = decodeURIComponent((link.getAttribute("href") || "").split("#")[1] || "");
        if (location.hash !== "#" + id) location.hash = id;
        else paintForm(allArticles().find(function (x) { return x.id === id; }) || null);
        box.querySelectorAll(".redac-item").forEach(function (x) { x.classList.remove("on"); });
        link.classList.add("on");
      });
    });

    paintForm(current);
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
      '<button class="btn" type="button" id="f-save">Publier sur le site</button>' +
      (art ? '<a class="btn ghost" href="article.html?id=' + encodeURIComponent(a.id) + '">Voir</a>' : "") +
      '<button class="btn ghost" type="button" id="f-export">Télécharger articles.js</button>' +
      "</div>" +
      '<p class="comment-note">Publier enregistre sur <strong>ce navigateur</strong> et l’article apparaît tout de suite. Pour le site Netlify de tout le monde : télécharge articles.js et remplace le fichier dans folio/data, ou envoie-le-moi.</p>';

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

    document.getElementById("f-save").onclick = function () {
      const title = document.getElementById("f-title").value.trim();
      if (!title) {
        alert("Il faut un titre.");
        return;
      }
      const iso = document.getElementById("f-date").value || todayISO();
      const id = (art && art.id) || slugify(title);
      const item = {
        id: id,
        title: title,
        dateISO: iso,
        date: frDate(iso),
        category: document.getElementById("f-cat").value,
        excerpt: document.getElementById("f-excerpt").value.trim(),
        cover: document.getElementById("f-cover").value.trim() || "img/logo.png",
        body: document.getElementById("f-body").innerHTML,
        readTime: "6 min",
        source: "La MLS en Français",
      };
      const others = drafts().filter(function (d) { return d.id !== id; });
      others.push(item);
      saveDrafts(others);
      alert("Publié sur ce navigateur.");
      location.href = "redaction.html#" + encodeURIComponent(id);
      location.reload();
    };

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

  function currentId() {
    return decodeURIComponent((location.hash || "").replace(/^#/, ""));
  }
  function openFromHash() {
    desk(currentId() || null);
  }

  if (!localStorage.getItem(AUTH_KEY)) {
    loginView();
    return;
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
})();
