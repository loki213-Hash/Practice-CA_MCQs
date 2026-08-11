// Scrape all States, Cities, and Test Centers from ICAI SPOM portal
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive'
};

const AJAX_HEADERS = {
  ...HEADERS,
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Accept': '*/*'
};

async function getSessionCookie() {
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', { headers: HEADERS });
  const cookie = res.headers.get('set-cookie') || '';
  const jsession = cookie.split(';')[0];
  const html = await res.text();
  
  // Extract all states with their IDs
  const stateMatch = html.match(/<select name="cmbState"[^>]*>([\s\S]*?)<\/select>/i);
  const states = [];
  if (stateMatch) {
    const opts = stateMatch[1].matchAll(/<option value="([^"]+)"[^>]*>([^<]+)<\/option>/gi);
    for (const m of opts) {
      if (m[1] !== '-1') states.push({ id: m[1], name: m[2].trim() });
    }
  }
  return { cookie: jsession, states };
}

async function getCities(stateId, cookie) {
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_getCity.action', {
    method: 'POST',
    headers: { ...AJAX_HEADERS, 'Cookie': cookie },
    body: `cmbState=${stateId}`
  });
  const text = await res.text();
  // Parse pipe-delimited city list: id1#name1#id2#name2...
  const parts = text.trim().split('#');
  const cities = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    if (parts[i] && parts[i + 1] && !parts[i].includes('<')) {
      cities.push({ id: parts[i].trim(), name: parts[i + 1].trim() });
    }
  }
  return cities;
}

async function getCenters(cityId, cookie) {
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_getTestCenter.action', {
    method: 'POST',
    headers: { ...AJAX_HEADERS, 'Cookie': cookie },
    body: `cmbCity=${cityId}`
  });
  const text = await res.text();
  // Parse pipe-delimited: id1#name1#id2#name2...
  const parts = text.trim().split('#');
  const centers = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    if (parts[i] && parts[i + 1] && !parts[i].includes('<')) {
      centers.push({ id: parts[i].trim(), name: parts[i + 1].trim() });
    }
  }
  return centers;
}

async function main() {
  console.log('Starting ICAI SPOM data scrape...');
  const { cookie, states } = await getSessionCookie();
  
  console.log(`Found ${states.length} states:`, states.map(s => `${s.name}(${s.id})`).join(', '));
  
  const fullData = {};
  
  for (const state of states) {
    console.log(`\n--- Fetching cities for ${state.name} (ID: ${state.id}) ---`);
    await new Promise(r => setTimeout(r, 300)); // polite delay
    
    const cities = await getCities(state.id, cookie);
    console.log(`  Cities: ${cities.map(c => c.name).join(', ')}`);
    
    fullData[state.name] = { stateId: state.id, cities: [] };
    
    for (const city of cities) {
      await new Promise(r => setTimeout(r, 200));
      const centers = await getCenters(city.id, cookie);
      console.log(`    ${city.name}: [${centers.map(c => c.name).join(' | ')}]`);
      fullData[state.name].cities.push({
        cityId: city.id,
        cityName: city.name,
        centers: centers
      });
    }
  }
  
  // Output as JS for copy-paste
  console.log('\n\n====== FULL DATA JSON ======');
  console.log(JSON.stringify(fullData, null, 2));
}

main().catch(console.error);
