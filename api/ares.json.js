export default async function handler(req, res) {
  try {
    const { ico } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!ico || !/^\d{8}$/.test(ico)) {
      return res.status(400).json({ error: 'Invalid ICO' });
    }

    const url = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(r.status).json({ error: 'ARES upstream error' });
    }

    const data = await r.json();
    return res.status(200).json({
      ico: data.ico,
      name: data.obchodniJmeno,
      address: data.sidlo?.textovaAdresa,
      dic: data.dic
    });
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error' });
  }
}
