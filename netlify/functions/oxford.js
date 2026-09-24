exports.handler = async function(event) {
  const word = String(event.queryStringParameters?.word || "").trim();
  const dialect = event.queryStringParameters?.dialect === "en-us" ? "en-us" : "en-gb";
  const appId = process.env.OXFORD_APP_ID;
  const appKey = process.env.OXFORD_APP_KEY;

  if (!word) return { statusCode: 400, headers: {"content-type":"application/json"}, body: JSON.stringify({error:"Word is required."}) };
  if (!appId || !appKey) return { statusCode: 503, headers: {"content-type":"application/json"}, body: JSON.stringify({error:"Oxford API is not configured. Add OXFORD_APP_ID and OXFORD_APP_KEY in Netlify environment variables."}) };

  const url = `https://od-api.oxforddictionaries.com/api/v2/words/${dialect}/${encodeURIComponent(word.toLowerCase())}?fields=definitions,pronunciations,examples,lexicalCategories`;
  try {
    const response = await fetch(url, { headers: { app_id: appId, app_key: appKey, Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { statusCode: response.status, headers: {"content-type":"application/json"}, body: JSON.stringify({error: data?.error || "Oxford lookup failed."}) };

    const entry = data?.results?.[0];
    const pronunciation = entry?.lexicalEntries?.flatMap(x => x.pronunciations || []).find(x => x.audioFile);
    const ipa = entry?.lexicalEntries?.flatMap(x => x.pronunciations || []).find(x => x.phoneticSpelling)?.phoneticSpelling;
    const definition = entry?.lexicalEntries?.flatMap(x => (x.entries || []).flatMap(e => e.senses || [])).flatMap(s => s.definitions || [])[0] || "";
    const example = entry?.lexicalEntries?.flatMap(x => (x.entries || []).flatMap(e => e.senses || [])).flatMap(s => s.examples || []).map(e => e.text)[0] || "";

    return {
      statusCode: 200,
      headers: {"content-type":"application/json", "cache-control":"public, max-age=300"},
      body: JSON.stringify({ word: entry?.id || word, ipa, audioFile: pronunciation?.audioFile || null, definition, example, source: "Oxford Languages", dialect })
    };
  } catch (error) {
    return { statusCode: 502, headers: {"content-type":"application/json"}, body: JSON.stringify({error:"Unable to reach Oxford Dictionaries API."}) };
  }
};