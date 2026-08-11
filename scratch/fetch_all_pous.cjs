// Get ALL POUs for ALL regions and test live batch API with correct key IDs
const BASE = 'https://shricasa.com';

async function getCatalog(regionId) {
  const res = await fetch(`${BASE}/api/batches/catalog?region=${regionId}`, { signal: AbortSignal.timeout(10000) });
  return res.json();
}

async function getLiveBatches(region, pou, course) {
  const res = await fetch(`${BASE}/api/batches/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region, pou, course }),
    signal: AbortSignal.timeout(15000)
  });
  return res.json();
}

async function main() {
  const regions = [
    { id: '1', name: 'Eastern' },
    { id: '2', name: 'Western' },
    { id: '3', name: 'Northern' },
    { id: '4', name: 'Southern' },
    { id: '5', name: 'Central' }
  ];
  
  const allData = {};
  
  for (const r of regions) {
    const data = await getCatalog(r.id);
    allData[r.name] = { id: r.id, pous: data.pous || [] };
    console.log(`\n${r.name} (${r.id}): ${data.pous?.length || 0} POUs`);
    if (data.pous?.length) {
      console.log(data.pous.map(p => `  ${p.key}: ${p.label}`).join('\n'));
    }
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n\n===== Testing live batches API with real key IDs =====');
  
  // Test with Southern BENGALURU key=102
  const tests = [
    { region: '4', pou: '102', course: '48', label: 'Southern/BENGALURU/AdvITT' },
    { region: '4', pou: '138', course: '48', label: 'Southern/CHENNAI/AdvITT' },
    { region: '4', pou: '111', course: '48', label: 'Southern/HYDERABAD/AdvITT' },
    { region: '4', pou: '102', course: '45', label: 'Southern/BENGALURU/AdvMCS' },
    { region: '2', pou: allData['Western']?.pous?.[0]?.key || '201', course: '48', label: 'Western/firstPOU/AdvITT' }
  ];
  
  for (const t of tests) {
    console.log(`\n--- ${t.label} ---`);
    try {
      const result = await getLiveBatches(t.region, t.pou, t.course);
      console.log(JSON.stringify(result).substring(0, 1500));
    } catch(e) {
      console.log('Error:', e.message);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n\n===== FULL CATALOG JSON =====');
  console.log(JSON.stringify(allData, null, 2));
}

main().catch(console.error);
