// Try multiple approaches to get SPOM city data
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-Requested-With': 'XMLHttpRequest',
  'Referer': 'https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action',
  'Origin': 'https://spmt.icai.org',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
};

async function getSessionData() {
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,*/*',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  
  const allCookies = [];
  // Collect set-cookie headers
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) allCookies.push(setCookie.split(';')[0]);
  
  const html = await res.text();
  
  // Look for CSRF / struts token
  const tokenMatch = html.match(/name="token"\s+value="([^"]+)"/i);
  const token = tokenMatch ? tokenMatch[1] : '';
  console.log('Token:', token);
  console.log('Cookies:', allCookies.join('; '));
  
  return { cookies: allCookies.join('; '), token };
}

async function testGetCities(stateId, cookies, token) {
  // Try GET
  const getRes = await fetch(`https://spmt.icai.org/ICAI/LoginAction_getCity.action?cmbState=${stateId}`, {
    headers: { ...HEADERS, 'Cookie': cookies }
  });
  const getText = await getRes.text();
  console.log(`GET cities for state ${stateId} (status ${getRes.status}):`, getText.substring(0, 200));
  
  // Try POST with token
  const postRes = await fetch('https://spmt.icai.org/ICAI/LoginAction_getCity.action', {
    method: 'POST',
    headers: { ...HEADERS, 'Cookie': cookies },
    body: `cmbState=${stateId}&token=${encodeURIComponent(token)}`
  });
  const postText = await postRes.text();
  console.log(`POST cities for state ${stateId} (status ${postRes.status}):`, postText.substring(0, 200));
  
  return { getText, postText };
}

async function main() {
  const { cookies, token } = await getSessionData();
  
  // Try Karnataka (ID=13) cities as seen in screenshot
  console.log('\n--- Testing Karnataka (ID=13) ---');
  await testGetCities('13', cookies, token);
  
  // Try Andhra Pradesh (ID=1)
  console.log('\n--- Testing Andhra Pradesh (ID=1) ---');
  await testGetCities('1', cookies, token);
  
  // Try Kerala (ID=14)
  console.log('\n--- Testing Kerala (ID=14) ---');
  await testGetCities('14', cookies, token);
}

main().catch(console.error);
