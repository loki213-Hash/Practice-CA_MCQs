// Test OFFICIAL ICAI APIs with proper session + exact browser headers
// Goal: Find exactly what request format the official ICAI endpoints need

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive'
};

const AJAX_HEADERS = {
  ...BROWSER_HEADERS,
  'Accept': '*/*',
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Origin': 'https://spmt.icai.org',
  'Referer': 'https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin'
};

async function getSpomSession() {
  console.log('1. Getting SPOM session...');
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', {
    headers: BROWSER_HEADERS,
    redirect: 'follow'
  });
  
  const cookies = res.headers.raw?.()?.['set-cookie'] || [];
  const setCookieHeader = res.headers.get('set-cookie') || '';
  const jsession = setCookieHeader.split(';')[0];
  
  console.log('   Status:', res.status);
  console.log('   JSESSIONID:', jsession);
  
  const html = await res.text();
  
  // Find all hidden inputs
  const hiddenInputs = [...html.matchAll(/<input[^>]*type="hidden"[^>]*>/gi)];
  hiddenInputs.forEach(m => {
    const nameM = m[0].match(/name="([^"]*)"/i);
    const valM = m[0].match(/value="([^"]*)"/i);
    if (nameM && valM) console.log(`   Hidden: ${nameM[1]} = ${valM[1].substring(0, 50)}`);
  });
  
  // Check for struts token
  const tokenMatch = html.match(/token[^"]*"[^>]*value="([^"]+)"/i);
  console.log('   Struts Token:', tokenMatch?.[1] || 'not found');
  
  // Check all form action URLs
  const formMatches = [...html.matchAll(/<form[^>]*action="([^"]*)"[^>]*>/gi)];
  formMatches.forEach(m => console.log('   Form action:', m[1]));
  
  return { jsession, html };
}

async function testSpomCityEndpoints(jsession) {
  console.log('\n2. Testing SPOM city endpoints...');
  
  const variants = [
    { url: 'https://spmt.icai.org/ICAI/LoginAction_getCity.action', method: 'POST', body: 'cmbState=1' },
    { url: 'https://spmt.icai.org/ICAI/LoginAction_getCity.action', method: 'POST', body: 'cmbState=13' },
    { url: 'https://spmt.icai.org/ICAI/slotDetails_getCity.action', method: 'POST', body: 'cmbState=1' },
    { url: 'https://spmt.icai.org/ICAI/getCity.action', method: 'POST', body: 'cmbState=1' },
    { url: 'https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', method: 'POST', body: 'cmbState=1&cmbCity=&cmbTestCenter=' },
  ];
  
  for (const v of variants) {
    try {
      const res = await fetch(v.url, {
        method: v.method,
        headers: { ...AJAX_HEADERS, 'Cookie': jsession },
        body: v.body
      });
      const text = await res.text();
      console.log(`   ${v.url.split('/').pop()} body=${v.body}: status=${res.status}, len=${text.length}, preview=${text.substring(0, 100).replace(/\s+/g, ' ')}`);
    } catch (e) {
      console.log(`   ERROR: ${e.message}`);
    }
  }
}

async function testBosEndpoints() {
  console.log('\n3. Testing BOS icaionlineregistration.org endpoints...');
  
  // Step 1: Get initial page + ViewState
  const initRes = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    headers: BROWSER_HEADERS
  });
  const initHtml = await initRes.text();
  const initCookie = initRes.headers.get('set-cookie') || '';
  const sessionCookie = initCookie.split(';')[0];
  
  // Extract all form fields
  const vs = initHtml.match(/id="__VIEWSTATE"[^>]*value="([^"]*)"/i)?.[1] || '';
  const ev = initHtml.match(/id="__EVENTVALIDATION"[^>]*value="([^"]*)"/i)?.[1] || '';
  const vsg = initHtml.match(/id="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"/i)?.[1] || '';
  const sm = initHtml.match(/id="ScriptManager1"[^>]*value="([^"]*)"/i)?.[1] || 
             initHtml.match(/ScriptManager1\|([^"<]+)/)?.[1] || 'ScriptManager1';
  
  console.log(`   ViewState length: ${vs.length}, EventVal length: ${ev.length}`);
  console.log(`   Session: ${sessionCookie.substring(0, 30)}`);
  
  // Extract ScriptManager ID
  const smMatch = initHtml.match(/id="(ScriptManager[^"]*)"[^>]*/i);
  console.log('   ScriptManager:', smMatch?.[1]);
  
  // Step 2: Try ScriptManager UpdatePanel postback for region change
  for (const regionId of ['4', '1', '2', '3', '5']) {
    const body = new URLSearchParams({
      'ScriptManager1': `ScriptManager1|ddl_reg`,
      '__EVENTTARGET': 'ddl_reg',
      '__EVENTARGUMENT': '',
      '__LASTFOCUS': '',
      '__VIEWSTATE': vs,
      '__VIEWSTATEGENERATOR': vsg,
      '__EVENTVALIDATION': ev,
      '__ASYNCPOST': 'true',
      'ddl_reg': regionId,
      'ddlPou': '',
      'ddl_course': ''
    });
    
    const res = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
      method: 'POST',
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-MicrosoftAjax': 'Delta=true',
        'Cache-Control': 'no-cache',
        'Cookie': sessionCookie,
        'Referer': 'https://www.icaionlineregistration.org/launchbatchdetail.aspx'
      },
      body: body.toString()
    });
    
    const text = await res.text();
    
    // Look for option elements in the delta response
    const pouCount = (text.match(/<option/gi) || []).length;
    const firstPou = text.match(/value="(\d+)"[^>]*>([^<]+)<\/option>/i);
    
    console.log(`   Region ${regionId}: status=${res.status}, len=${text.length}, pous=${pouCount}, first=${firstPou?.[2] || 'none'}`);
    if (pouCount > 0) {
      console.log('   RESPONSE:', text.substring(0, 500));
    }
    
    await new Promise(r => setTimeout(r, 300));
  }
}

async function testBosAjaxSearch() {
  console.log('\n4. Testing BOS batch search...');
  
  // Try the actual batch detail fetch
  const body = new URLSearchParams({
    'ddl_reg': '4',
    'ddlPou': '102', // BENGALURU
    'ddl_course': '48'
  });
  
  const res = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    method: 'POST',
    headers: { ...BROWSER_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': 'https://www.icaionlineregistration.org/launchbatchdetail.aspx' },
    body: body.toString()
  });
  
  const html = await res.text();
  const tableRows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  console.log(`   Table rows found: ${tableRows.length}`);
  tableRows.slice(0, 5).forEach(r => {
    const cells = (r[0].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map(c => c.replace(/<[^>]+>/g, '').trim());
    if (cells.some(c => c.length > 2)) console.log('   Row:', cells.join(' | '));
  });
}

async function main() {
  const { jsession, html } = await getSpomSession();
  await testSpomCityEndpoints(jsession);
  await testBosEndpoints();
  await testBosAjaxSearch();
}

main().catch(console.error);
