(function () {
  const form = document.getElementById("form-article");
  const status = document.getElementById("status");
  const preview = document.getElementById("preview");

  const saved = localStorage.getItem("folio-brouillon");
  if (saved) {
    try {
      const d = JSON.parse(saved);
      titre.value = d.titre || "";
      categorie.value = d.categorie || "Culture";
      extrait.value = d.extrait || "";
      texte.value = d.texte || "";
    } catch (e) {}
  }

  function payload() {
    return {
      titre: titre.value.trim(),
      categorie: categorie.value,
      extrait: extrait.value.trim(),
      texte: texte.value.trim()
    };
  }

  function paragraphs(text) {
    return text
      .split(/\n{2,}|\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => "<p>" + p.replace(/</g, "&lt;") + "</p>")
      .join("");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const d = payload();
    localStorage.setItem("folio-brouillon", JSON.stringify(d));
    document.getElementById("prev-title").textContent = d.titre;
    document.getElementById("prev-meta").textContent = d.categorie + " · brouillon sur cet appareil";
    document.getElementById("prev-body").innerHTML = paragraphs(d.texte);
    preview.hidden = false;
    status.hidden = false;
    status.textContent =
      "Brouillon enregistré sur ce téléphone. Les visiteurs du site ne le voient pas encore. Appuie sur « Copier pour envoyer », puis envoie-le pour publication.";
    preview.scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("btn-copy").addEventListener("click", async function () {
    const d = payload();
    const msg =
      "Nouvel article pour Folio\n\nTitre : " +
      d.titre +
      "\nRubrique : " +
      d.categorie +
      "\nAccroche : " +
      d.extrait +
      "\n\n" +
      d.texte;
    try {
      await navigator.clipboard.writeText(msg);
      status.hidden = false;
      status.textContent = "Texte copié. Colle-le dans un message pour le faire publier sur le site public.";
    } catch (err) {
      status.hidden = false;
      status.textContent = "Copie automatique impossible. Sélectionne ton texte et copie-le à la main.";
    }
  });
})();
