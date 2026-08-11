// Find ShriCasa's batch fetching logic by searching all JS chunks
const chunks = [
  '0~wns~1sqjsjb',
  '0fg~qvx_0jc0v',
  '07gnfk.54nxxn',
  '0g.8va0ebzw3h',
  '02dy.hc3x-c8r',
  '0.om4iw1bthpt',
  '0x7fw.j-h4lyu',
  '128aahewwf1we',
  '03krgv4k0bwpm'
];

const DPL = 'dpl_9BDgqQjm4uHXp2DLUoJbGDihz8bE';

async function fetchChunk(name) {
  const url = `https://shricasa.com/_next/static/chunks/${name}.js?dpl=${DPL}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { name, found: false };
    const text = await res.text();
    
    // Search for ICAI-related content
    const hasIcai = text.includes('icai') || text.includes('ICAI') || text.includes('launchbatch') || text.includes('spmt');
    const hasBatch = text.includes('batch') || text.includes('pou') || text.includes('region');
    const hasFetch = text.includes('fetch(') || text.includes('axios') || text.includes('XMLHttpRequest');
    
    if (hasIcai || hasBatch) {
      // Find icai URLs
      const icaiMatches = [...text.matchAll(/https?:\/\/[^"'\s]*(icai|spmt|icairegistration)[^"'\s]*/gi)];
      const fetchMatches = [...text.matchAll(/fetch\([^;]{0,200}/gi)];
      const apiMatches = [...text.matchAll(/\/api\/[^"'\s]{1,50}/gi)];
      
      return {
        name,
        found: true,
        size: text.length,
        hasIcai,
        hasBatch,
        hasFetch,
        icaiUrls: icaiMatches.map(m => m[0]),
        apiRoutes: apiMatches.map(m => m[0]),
        fetchSnippets: fetchMatches.slice(0, 3).map(m => m[0].substring(0, 200))
      };
    }
    return { name, found: false, size: text.length };
  } catch (e) {
    return { name, error: e.message };
  }
}

async function main() {
  console.log('Searching ShriCasa JS chunks for ICAI/batch logic...\n');
  const results = await Promise.all(chunks.map(fetchChunk));
  results.forEach(r => {
    if (r.found) {
      console.log(`\n✅ FOUND in: ${r.name} (${r.size} bytes)`);
      if (r.icaiUrls?.length) console.log('  ICAI URLs:', r.icaiUrls);
      if (r.apiRoutes?.length) console.log('  API Routes:', r.apiRoutes);
      if (r.fetchSnippets?.length) console.log('  Fetch calls:', r.fetchSnippets);
    } else {
      console.log(`❌ ${r.name}: ${r.error || `no ICAI content (${r.size} bytes)`}`);
    }
  });
}

main().catch(console.error);
