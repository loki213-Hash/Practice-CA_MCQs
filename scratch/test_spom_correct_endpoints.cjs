// Test correct SPOM AJAX endpoints discovered from page JS
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function getSession() {
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', {
    headers: BROWSER_HEADERS
  });
  const cookie = (res.headers.get('set-cookie') || '').split(';')[0];
  const html = await res.text();
  
  // Extract the select options for state/country
  const stateSelect = html.match(/id="cmbState"[^>]*>?([\s\S]*?)<\/select>/i)?.[1] || '';
  const countrySelect = html.match(/id="cmbCountry"[^>]*>?([\s\S]*?)<\/select>/i)?.[1] || '';
  const stateListSelect = html.match(/id="cmbStateList"[^>]*>?([\s\S]*?)<\/select>/i)?.[1] || '';
  
  const stateOpts = [...stateSelect.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi)];
  const countryOpts = [...countrySelect.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi)];
  const stateListOpts = [...stateListSelect.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi)];
  
  console.log('cmbState options:', stateOpts.slice(0,5).map(o => `${o[1]}:${o[2]}`).join(', '));
  console.log('cmbCountry options:', countryOpts.slice(0,5).map(o => `${o[1]}:${o[2]}`).join(', '));
  console.log('cmbStateList options:', stateListOpts.slice(0,5).map(o => `${o[1]}:${o[2]}`).join(', '));
  
  // Find all select IDs on page
  const selects = [...html.matchAll(/<select[^>]*id="([^"]*)"[^>]*/gi)];
  console.log('\nAll selects:', selects.map(s => s[1]).join(', '));
  
  // Look for country dropdown values
  const countryMatch = html.match(/cmbCountry[^>]*>([\s\S]*?)<\/select>/i);
  if (countryMatch) {
    console.log('\nCountry select content:', countryMatch[1].substring(0, 300));
  }
  
  // Find the full JS for city loading
  const cityFuncMatch = html.match(/getCityForTestCenters[\s\S]{0,800}/);
  if (cityFuncMatch) console.log('\nCity function context:', cityFuncMatch[0].substring(0, 400));
  
  return { cookie, html };
}

async function testEndpoints(cookie) {
  const BASE = 'https://spmt.icai.org/ICAI/';
  const HEADERS = {
    ...BROWSER_HEADERS,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Origin': 'https://spmt.icai.org',
    'Referer': 'https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action',
    'Cookie': cookie
  };
  
  // Test GetStatesForCountry with India (country=1 or 99 or "India")
  const countryTests = [
    { endpoint: 'LoginAction_getStatesForCountry.action', body: 'cmbCountry=1' },
    { endpoint: 'LoginAction_getStatesForCountry.action', body: 'cmbCountry=99' },
    { endpoint: 'LoginAction_getStatesForCountry.action', body: 'cmbCountry=India' },
    { endpoint: 'LoginAction_getStatesForCountry.action', body: 'country=1' },
  ];
  
  console.log('\n=== Testing getStatesForCountry ===');
  for (const t of countryTests) {
    const res = await fetch(BASE + t.endpoint, {
      method: 'POST', headers: HEADERS, body: t.body
    });
    const text = await res.text();
    console.log(`  ${t.body}: status=${res.status} len=${text.length} preview="${text.substring(0, 150).replace(/\n/g, ' ')}"`);
  }
  
  // Test getCityForTestCenters with state IDs  
  const cityTests = [
    { endpoint: 'LoginAction_getCityForTestCenters.action', body: 'cmbState=1' },
    { endpoint: 'LoginAction_getCityForTestCenters.action', body: 'cmbState=13' },
    { endpoint: 'LoginAction_getCityForTestCenters.action', body: 'cmbState=14' },
    { endpoint: 'LoginAction_getCityForTestCenters.action', body: 'state=1' },
    { endpoint: 'LoginAction_getCityForTestCenters.action', body: 'stateId=1' },
    // From the page: cmbStateList instead of cmbState
    { endpoint: 'LoginAction_getCityForTestCenters.action', body: 'cmbStateList=1' },
    { endpoint: 'LoginAction_getCityForTestCenters.action', body: 'cmbStateList=13' },
  ];
  
  console.log('\n=== Testing getCityForTestCenters ===');
  for (const t of cityTests) {
    const res = await fetch(BASE + t.endpoint, {
      method: 'POST', headers: HEADERS, body: t.body
    });
    const text = await res.text();
    console.log(`  ${t.body}: status=${res.status} len=${text.length} preview="${text.substring(0, 200).replace(/\n/g, ' ')}"`);
    if (text.length > 10 && res.status === 200 && !text.includes('DOCTYPE')) {
      console.log('  *** GOT DATA ***:', text.substring(0, 500));
    }
  }
  
  // Test getTestCentreForCity
  console.log('\n=== Testing getTestCentreForCity ===');
  const centerTests = [
    { body: 'cmbCity=1' },
    { body: 'cmbCityList=1' },
    { body: 'city=Bangalore' },
  ];
  for (const t of centerTests) {
    const res = await fetch(BASE + 'LoginAction_getTestCentreForCity.action', {
      method: 'POST', headers: HEADERS, body: t.body
    });
    const text = await res.text();
    console.log(`  ${t.body}: status=${res.status} len=${text.length} preview="${text.substring(0, 150)}"`);
  }
}

async function main() {
  const { cookie, html } = await getSession();
  
  // Also extract all JS to find parameter names
  const scriptContent = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1])
    .join('\n');
  
  const paramNames = [...scriptContent.matchAll(/data\s*=\s*[\'"](cmbState[^=]*=[^'"]*)['"]/gi)];
  console.log('\nData params in JS:', paramNames.map(m => m[1]).join(', '));
  
  const dataStrings = [...scriptContent.matchAll(/dataString\s*=\s*[^;]+;/gi)];
  console.log('\ndataString assignments:');
  dataStrings.slice(0, 10).forEach(m => console.log(' ', m[0].substring(0, 200)));
  
  await testEndpoints(cookie);
}

main().catch(console.error);
