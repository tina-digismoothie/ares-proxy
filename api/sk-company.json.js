export default async function handler(req, res) {
  try {
    const { ico } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!ico || !/^\d{8}$/.test(ico)) {
      return res.status(400).json({ error: 'Invalid ICO' });
    }

    // voláme Register právnických osôb (RPO)
    const url = `https://rpo.statistics.sk/rpo-api/v1/subject/${ico}`;
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

    return res.status(200).json({
      ico: data.ico || ico,
      name: data.obchodneMeno || '',
      dic: data.dic || data.icDph || '' // RPO môže mať len jedno z toho
    });
  } catch (e) {
    console.error('Proxy exception:', e);
    return res.status(500).json({ error: 'Proxy error', details: e.message });
  }
}
