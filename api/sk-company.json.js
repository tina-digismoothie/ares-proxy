export default async function handler(req, res) {
  const { ico } = req.query;
  if (!ico) return res.status(400).json({ error: 'Missing IČO' });

  try {
    // 1. Získať URL na dump
    const metaRes = await fetch('https://data.gov.sk/api/action/package_show?id=register-pravnickych-osob');
    const meta = await metaRes.json();
    const jsonUrl = meta.result.resources.find(r => r.format === 'JSON')?.url;
    if (!jsonUrl) throw new Error('No JSON resource found');

    // 2. Stiahnuť dáta
    const dataRes = await fetch(jsonUrl);
    const all = await dataRes.json();

    // 3. Filtrovať podľa IČO
    const found = all.find(item => item.ico === ico);
    if (!found) return res.status(404).json({ error: 'Firma nenájdená' });

    res.status(200).json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
