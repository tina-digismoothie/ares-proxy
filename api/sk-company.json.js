export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { ico } = req.query;

    if (!ico || !/^\d{8}$/.test(String(ico))) {
      return res.status(400).json({ error: 'Invalid ICO' });
    }

    const resourceId = 'd048a701-3f5e-4a9d-b32d-966e8f84c8a0';

    // SPRÁVNE: filters musí byť JSON.stringify + percent-enkódované
    const params = new URLSearchParams({
      resource_id: resourceId,
      filters: JSON.stringify({ ico: String(ico) }),
      limit: '1'
    });

    const url = `https://data.gov.sk/api/action/datastore_search?${params.toString()}`;

    // Timeout, aby funkcia nevisela
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);

    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
        // Niektoré brány blokujú neštandardné UA – použi "bežný"
        'User-Agent': 'Mozilla/5.0 (compatible; AresProxy/1.0; +https://example.org)'
      },
      signal: controller.signal,
      // cache: 'no-store' // ak nechceš žiadny caching
    }).catch(e => {
      // Sieťové chyby/timeout
      throw new Error(`Fetch failed: ${e.name === 'AbortError' ? 'timeout' : e.message}`);
    });

    clearTimeout(t);

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      console.error('data.gov.sk error:', r.status, text?.slice(0, 500));
      // 502 lepšie signalizuje, že zlyhal upstream (nie klient)
      return res.status(502).json({
        error: 'Upstream error',
        upstreamStatus: r.status,
        body: text
      });
    }

    const data = await r.json().catch(() => null);
    if (!data || data.success === false) {
      return res.status(502).json({ error: 'Upstream JSON error', body: data });
    }

    const records = data?.result?.records || [];
    if (records.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const rec = records[0];

    return res.status(200).json({
      ico: rec.ico,
      name: rec.obchodne_meno || rec.obchodné_meno || rec.nazov || '',
      dic: rec.dic || rec.ic_dph || rec.icdph || ''
    });
  } catch (e) {
    console.error('Proxy exception:', e);
    const details = typeof e?.message === 'string' ? e.message : String(e);
    return res.status(500).json({ error: 'Proxy error', details });
  }
}
