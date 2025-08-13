function getText(node, tag) {
  return node?.getElementsByTagName(tag)?.[0]?.textContent?.trim() || '';
}

export default async function handler(req, res) {
  try {
    const { ico } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!ico || !/^\d{8}$/.test(ico)) {
      return res.status(400).json({ error: 'Invalid ICO' });
    }

    const r = await fetch(`https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi?ico=${ico}`);
    if (!r.ok) return res.status(502).json({ error: 'ARES upstream error' });

    const xml = await r.text();

    // very light XML parse using DOMParser via JSDOM-like approach not available on Vercel edge; use xml2js-like manual extraction
    // Fallback: regex-safe-ish reads for common tags in ARES base response
    const name = (xml.match(/<Obchodni_firma>([^<]+)<\/Obchodni_firma>/)?.[1] || '').trim();
    const street = (xml.match(/<NU>([^<]+)<\/NU>/)?.[1] || '').trim();
    const city = (xml.match(/<N>([^<]+)<\/N>/)?.[1] || '').trim();
    const zip = (xml.match(/<PSC>([^<]+)<\/PSC>/)?.[1] || '').trim();
    const dic = (xml.match(/<DIC>([^<]+)<\/DIC>/)?.[1] || '').trim();

    return res.json({
      ico,
      name,
      address: [street, city, zip].filter(Boolean).join(', '),
      dic
    });
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error' });
  }
}
