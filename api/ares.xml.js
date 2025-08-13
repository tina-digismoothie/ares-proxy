export default async function handler(req, res) {
  try {
    const { ico } = req.query;
    if (!ico || !/^\d{8}$/.test(ico)) {
      res.status(400).setHeader('Access-Control-Allow-Origin', '*');
      return res.send('Invalid ICO');
    }

    const url = `https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi?ico=${ico}`;
    const r = await fetch(url);
    if (!r.ok) {
      res.status(r.status).setHeader('Access-Control-Allow-Origin', '*');
      return res.send('ARES upstream error');
    }
    const xml = await r.text();

    res.status(200);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(xml);
  } catch (e) {
    res.status(500).setHeader('Access-Control-Allow-Origin', '*');
    return res.send('Proxy error');
  }
}
