(function () {
  const ID_KEY = "folio_sync_id";
  const API = "https://jsonblob.com/api/jsonBlob";

  function pack() {
    return {
      drafts: window.folioDrafts ? window.folioDrafts() : [],
      mags: window.folioMagsLocal ? window.folioMagsLocal() : [],
      t: Date.now(),
    };
  }

  function apply(data) {
    if (!data) return;
    if (data.drafts && window.folioSaveDrafts) window.folioSaveDrafts(data.drafts);
    if (data.mags && window.folioSaveMags) window.folioSaveMags(data.mags);
  }

  window.folioPushSync = function () {
    const id = localStorage.getItem(ID_KEY);
    if (!id) return Promise.resolve();
    return fetch(API + "/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(pack()),
    }).catch(function () {});
  };

  window.folioPullSync = function () {
    const id = localStorage.getItem(ID_KEY);
    if (!id) return Promise.resolve(false);
    return fetch(API + "/" + id, { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("sync"); return r.json(); })
      .then(function (data) {
        apply(data);
        return true;
      })
      .catch(function () { return false; });
  };

  window.folioCreateSync = function () {
    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(pack()),
    }).then(function (r) {
      const loc = r.headers.get("Location") || r.headers.get("location") || "";
      const id = loc.split("/").pop() || "";
      if (!id) throw new Error("no id");
      localStorage.setItem(ID_KEY, id);
      return id;
    });
  };

  window.folioJoinSync = function (id) {
    id = String(id || "").trim();
    if (!id) return Promise.reject();
    localStorage.setItem(ID_KEY, id);
    return window.folioPullSync();
  };
})();
