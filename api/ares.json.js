export default async function handler(req, res) {
  try {
    const { ico } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!ico || !/^\d{8}$/.test(ico)) {
      return res.status(400).json({ error: 'Invalid ICO' });
    }

    const url = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;
    console.log('Fetching from ARES:', url);

    const r = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VercelProxy/1.0'
      }
    });

    console.log('ARES status:', r.status);

    if (!r.ok) {
      const text = await r.text();
      console.error('ARES response body:', text);
      return res.status(r.status).json({ error: 'ARES upstream error', body: text });
    }

    const data = await r.json();
    console.log('ARES data received:', data);

    return res.status(200).json({
      ico: data.ico,
      name: data.obchodniJmeno,
      address: data.sidlo?.textovaAdresa,
      dic: data.dic
    });
  } catch (e) {
    console.error('Proxy exception:', e);
    return res.status(500).json({ error: 'Proxy error', details: e.message });
  }
}
