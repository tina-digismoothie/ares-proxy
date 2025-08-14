export default async function handler(req, res) {
  const { ico } = req.query;
  if (!ico) {
    return res.status(400).json({ error: 'Missing IČO' });
  }

  try {
    // 1. Získať URL na dump
    const metaRes = await fetch(
      'https://data.gov.sk/api/action/package_show?id=register-pravnickych-osob'
    );
    const meta = await metaRes.json();
    const jsonUrl = meta.result.resources.find(
      r => String(r.format).toLowerCase() === 'json'
    )?.url;
    if (!jsonUrl) throw new Error('No JSON resource found');

    // 2. Stiahnuť dáta s kontrolou Content-Type
    const dataRes = await fetch(jsonUrl);
    const ct = dataRes.headers.get('content-type') || '';
    if (!ct.toLowerCase().includes('application/json')) {
      const preview = await dataRes.text();
      throw new Error(
        `Upstream returned non‑JSON (${ct}): ${preview.slice(0, 200)}`
      );
    }

    const all = await dataRes.json();

    // 3. Filtrovať podľa IČO
    const found = all.find(item => String(item.ico) === String(ico));
    if (!found) {
      return res.status(404).json({ error: 'Firma nenájdená' });
    }

    res.status(200).json(found);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.details || undefined
    });
  }
}
