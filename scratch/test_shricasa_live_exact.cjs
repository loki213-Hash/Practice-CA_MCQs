// Test ShriCasa live batch endpoint with exact payloads
const BASE = 'https://shricasa.com';

async function testLive(region, pou, course) {
  const payloads = [
    { region, pou, course },
    { region: String(region), pou: String(pou), course: String(course) },
    { regionId: region, pouId: pou, courseId: course },
    { region: Number(region), pou: Number(pou), course: Number(course) }
  ];

  for (const p of payloads) {
    try {
      const res = await fetch(`${BASE}/api/batches/live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Referer': 'https://shricasa.com/batch',
          'Origin': 'https://shricasa.com'
        },
        body: JSON.stringify(p)
      });
      const text = await res.text();
      console.log(`Payload ${JSON.stringify(p)} -> status: ${res.status}, len: ${text.length}`);
      if (res.status === 200) {
        console.log('✅ GOT REAL LIVE BATCH DATA:', text.substring(0, 1000));
        return text;
      }
    } catch(e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

async function main() {
  console.log('Testing Southern (4), Bengaluru (102), Course (48)...');
  await testLive('4', '102', '48');
  await testLive('Southern', 'BENGALURU', '48');
  await testLive('4', '138', '45');
}

main().catch(console.error);
