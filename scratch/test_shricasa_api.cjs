// Test ShriCasa's proxy APIs for live ICAI data
const BASE = 'https://shricasa.com';

async function testApi(label, url, opts = {}) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(10000) });
  const text = await res.text();
  console.log(`\n=== ${label} === status:${res.status}`);
  console.log(text.substring(0, 2000));
  return { status: res.status, text };
}

async function main() {
  // Get catalog (regions + POUs)
  const cat = await testApi('GET /api/batches/catalog', `${BASE}/api/batches/catalog`);
  
  // Get catalog for Southern region
  await testApi('GET /api/batches/catalog?region=Southern', `${BASE}/api/batches/catalog?region=Southern`);
  await testApi('GET /api/batches/catalog?region=4', `${BASE}/api/batches/catalog?region=4`);
  
  // Try live batches
  await testApi('POST /api/batches/live (Southern+BENGALURU+ITT)', `${BASE}/api/batches/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region: 'Southern', pou: 'BENGALURU', course: '48' })
  });
  
  await testApi('POST /api/batches/live (Southern+CHENNAI+MCS)', `${BASE}/api/batches/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region: 'Southern', pou: 'CHENNAI', course: '45' })
  });
  
  // Try with ID-based region
  await testApi('POST /api/batches/live (region=4)', `${BASE}/api/batches/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region: '4', pou: 'BENGALURU', course: '48' })
  });
}

main().catch(console.error);
