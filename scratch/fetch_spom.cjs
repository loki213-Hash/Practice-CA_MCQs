const fs = require('fs');

async function testSpom() {
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();

  // Find JS references or inline scripts
  const inlineScripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  console.log(`Found ${inlineScripts.length} inline scripts.`);

  inlineScripts.forEach((sc, i) => {
    if (sc.includes('cmbState') || sc.includes('city') || sc.includes('Center') || sc.includes('ajax') || sc.includes('Action')) {
      console.log(`\n--- Script ${i} ---`);
      console.log(sc);
    }
  });

  const stateMatch = html.match(/<select name="cmbState"[\s\S]*?<\/select>/i);
  if (stateMatch) {
    console.log('\n--- STATES OPTION TAGS ---');
    console.log(stateMatch[0]);
  }
}

testSpom().catch(console.error);
