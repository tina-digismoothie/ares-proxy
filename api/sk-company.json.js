export default async function handler(req, res) {
  try {
    const { ico } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!ico || !/^\d{8}$/.test(ico)) {
      return res.status(400).json({ error: 'Invalid ICO' });
    }

    // ID datasetu RPO na data.gov.sk — obsahuje základné údaje
    // Zdroje: https://data.gov.sk/dataset/register-pravnickych-osob-a-podnikatelov
    const resourceId = 'd048a701-3f5e-4a9d-b32d-966e8f84c8a0';
    const url = `https://data.gov.sk/api/action/datastore_search?resource_id=${resourceId}&filters={"ico":"${ico}"}`;

    const r = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VercelProxy/1.0'
      }
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('data.gov.sk error:', r.status, text);
      return res.status(r.status).json({ error: 'Upstream error', body: text });
    }

    const data = await r.json();

    if (!data.result || !data.result.records || data.result.records.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const rec = data.result.records[0];

    return res.status(200).json({
      ico: rec.ico,
      name: rec.obchodne_meno,
      dic: rec.dic || rec.ic_dph || ''
    });
  } catch (e) {
    console.error('Proxy exception:', e);
    return res.status(500).json({ error: 'Proxy error', details: e.message });
  }
}
