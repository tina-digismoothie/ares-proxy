export default async function handler(req, res) {
  const { ico } = req.query;
  if (!ico) {
    return res.status(400).json({ error: 'Missing IČO' });
  }

  try {
    // ID resource-u pre Register právnických osôb (Datastore)
    const resourceId = 'bffb6d1a-0d7c-4c42-b67a-0f04c95c5d50'; // toto si over na data.gov.sk

    // CKAN Datastore API – query priamo na pole ico
    const apiUrl = `https://data.gov.sk/api/3/action/datastore_search?resource_id=${resourceId}&q={"ico":"${ico}"}`;

    const r = await fetch(apiUrl);
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const preview = await r.text();
      throw new Error(`Non‑JSON (${ct}): ${preview.slice(0, 200)}`);
    }

    const data = await r.json();
    if (!data.success) {
      throw new Error('Datastore API nevrátilo success=true');
    }

    const record = data.result.records.find(rec => String(rec.ico) === String(ico));
    if (!record) {
      return res.status(404).json({ error: 'Firma nenájdená' });
    }

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
