async function testLiveIcaiSession() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest'
  };

  // Step 1: Initial GET to obtain session cookie & page HTML
  console.log('Step 1: Fetching initial page for session cookies...');
  const initRes = await fetch('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', { headers });
  const setCookie = initRes.headers.get('set-cookie');
  console.log('Set-Cookie Header:', setCookie);

  const cookies = setCookie ? setCookie.split(';')[0] : '';
  const requestHeaders = {
    ...headers,
    'Cookie': cookies,
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  };

  // Step 2: POST to get cities for State ID 1 (Andhra Pradesh)
  console.log('\nStep 2: Fetching Cities for State ID 1 (Andhra Pradesh)...');
  const cityRes = await fetch('https://spmt.icai.org/ICAI/LoginAction_getCity.action', {
    method: 'POST',
    headers: requestHeaders,
    body: 'cmbState=1'
  });
  const cityText = await cityRes.text();
  console.log('City POST Response:', cityText);

  // Step 3: Parse cities (format in Struts is ID#NAME,ID#NAME...)
  const cityPairs = cityText.trim().split('#');
  console.log(`Parsed raw city string (Length: ${cityPairs.length})`);
  
  // Pick first city ID
  if (cityPairs.length >= 2) {
    const firstCityId = cityPairs[0];
    console.log(`\nStep 3: Fetching Test Centers for City ID: ${firstCityId}...`);
    const centerRes = await fetch('https://spmt.icai.org/ICAI/LoginAction_getTestCenter.action', {
      method: 'POST',
      headers: requestHeaders,
      body: `cmbCity=${firstCityId}`
    });
    const centerText = await centerRes.text();
    console.log('Test Center POST Response:', centerText);

    // Pick first center ID
    const centerPairs = centerText.trim().split('#');
    if (centerPairs.length >= 2) {
      const firstCenterId = centerPairs[0];
      console.log(`\nStep 4: Fetching Dates & Address for Center ID: ${firstCenterId}...`);
      const addrRes = await fetch('https://spmt.icai.org/ICAI/LoginAction_getTestCenterAddress.action', {
        method: 'POST',
        headers: requestHeaders,
        body: `cmbTstCenter=${firstCenterId}`
      });
      const addrText = await addrRes.text();
      console.log('Address & Dates Response:', addrText);
    }
  }
}

testLiveIcaiSession().catch(console.error);
