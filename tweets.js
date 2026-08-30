exports.handler = async function () {
  const token = process.env.X_BEARER_TOKEN;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  if (!token) {
    return { statusCode: 501, headers, body: JSON.stringify({ error: "no_token" }) };
  }
  try {
    const u = await fetch("https://api.x.com/2/users/by/username/MLS_FRA2", {
      headers: { Authorization: "Bearer " + token },
    });
    const uj = await u.json();
    const id = uj && uj.data && uj.data.id;
    if (!id) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: "no_user", raw: uj }) };
    }
    const t = await fetch(
      "https://api.x.com/2/users/" +
        id +
        "/tweets?max_results=5&exclude=replies&tweet.fields=created_at",
      { headers: { Authorization: "Bearer " + token } }
    );
    const tj = await t.json();
    const items = (tj.data || []).map(function (tw) {
      return {
        text: tw.text,
        link: "https://x.com/MLS_FRA2/status/" + tw.id,
        date: tw.created_at,
      };
    });
    return { statusCode: 200, headers, body: JSON.stringify({ items }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e) }) };
  }
};
