export default async function handler(req, res) {
  try {
    const { ico } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Validácia formátu IČO
    if (!ico || !/^\d{8}$/.test(ico)) {
      return res.status(400).json({ error: 'Invalid ICO' });
    }

    // Volanie RPO API (v2 endpoint s query parametrom ico)
    const url = `https://rpo.statistics.sk/rpo-api/v2/subjects?ico=${ico}`;
    const r = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VercelProxy/1.0'
      }
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('RPO error:', r.status, text);
      return res.status(r.status).json({ error: 'RPO upstream error', body: text });
    }

    const data = await r.json();

    // Očakávame pole – ak je prázdne, firma sa nenašla
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const subj = data[0];

    return res.status(200).json({
      ico: subj.ico || ico,
      name: subj.obchodneMeno || '',
      dic: subj.dic || subj.icDph || ''
    });
  } catch (e) {
    console.error('Proxy exception:', e);
    return res.status(500).json({ error: 'Proxy error', details: e.message });
  }
}
