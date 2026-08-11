// Deep dive: 
// 1. Check what the 520-byte BOS delta response contains
// 2. Find correct ScriptManager ID for BOS
// 3. Extract SPOM JS to find actual AJAX call format

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function analyzeBos() {
  console.log('=== BOS Analysis ===\n');
  
  const initRes = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    headers: { ...BROWSER_HEADERS, Accept: 'text/html' }
  });
  const html = await initRes.text();
  const cookie = (initRes.headers.get('set-cookie') || '').split(';')[0];
  
  // Find ScriptManager
  const smMatch = html.match(/id="([\w_]+ScriptManager[\w_]*)"/i);
  const smId = smMatch?.[1] || 'ScriptManager1';
  console.log('ScriptManager ID:', smId);
  
  // Find all hidden inputs
  console.log('\nHidden inputs:');
  const hiddenInputs = [...html.matchAll(/<input[^>]*type="hidden"[^>]*/gi)];
  const formData = {};
  hiddenInputs.forEach(m => {
    const nameM = m[0].match(/name="([^"]*)"/i);
    const valM = m[0].match(/value="([^"]*)"/i) || m[0].match(/value='([^']*)'/i);
    if (nameM) {
      formData[nameM[1]] = valM?.[1] || '';
      console.log(`  ${nameM[1]}: ${(valM?.[1] || '').substring(0, 80)}`);
    }
  });
  
  // Extract the OnChange JS for region dropdown
  const regionSelect = html.match(/id="ddl_reg"[^>]*/i)?.[0];
  console.log('\nRegion select tag:', regionSelect);
  
  // Find the postback function call
  const postbackMatch = html.match(/__doPostBack[^;)]+/gi);
  console.log('\nPostback calls:', postbackMatch?.slice(0,3));
  
  // Find UpdatePanel / ScriptManager scripts
  const updatePanelMatch = html.match(/Sys\.WebForms\.PageRequestManager[^;]+/gi);
  console.log('\nUpdatePanel refs:', updatePanelMatch?.slice(0,2));
  
  // Try correct UpdatePanel postback format
  const body = new URLSearchParams({
    [`${smId}`]: `${smId}|ddl_reg`,
    '__EVENTTARGET': 'ddl_reg',
    '__EVENTARGUMENT': '',
    '__LASTFOCUS': '',
    '__VIEWSTATE': formData['__VIEWSTATE'] || '',
    '__VIEWSTATEGENERATOR': formData['__VIEWSTATEGENERATOR'] || '',
    '__EVENTVALIDATION': formData['__EVENTVALIDATION'] || '',
    '__ASYNCPOST': 'true',
    'ddl_reg': '4',
    'ddlPou': '',
    'ddl_course': ''
  });
  
  console.log('\n\nSending UpdatePanel postback (region=4)...');
  const postRes = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-MicrosoftAjax': 'Delta=true',
      'Cache-Control': 'no-cache',
      'Cookie': cookie,
      'Referer': 'https://www.icaionlineregistration.org/launchbatchdetail.aspx',
      'Accept': '*/*',
      'Origin': 'https://www.icaionlineregistration.org'
    },
    body: body.toString()
  });
  
  const deltaText = await postRes.text();
  console.log('Status:', postRes.status);
  console.log('Length:', deltaText.length);
  console.log('Full delta response:\n', deltaText);
}

async function analyzeSpomJs() {
  console.log('\n\n=== SPOM JS Analysis ===\n');
  
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', {
    headers: { ...BROWSER_HEADERS, Accept: 'text/html' }
  });
  const html = await res.text();
  
  // Find the JS that makes the city AJAX call
  const ajaxCalls = [...html.matchAll(/\$\.ajax[^;]{0,500}/gi)];
  const xhrCalls = [...html.matchAll(/XMLHttpRequest[^;]{0,300}/gi)];
  const changeCalls = [...html.matchAll(/onChange[^;]{0,200}/gi)];
  const funcCalls = [...html.matchAll(/function[^(]*\([^)]*\)[^{]*{[^}]*city[^}]*/gi)];
  
  console.log('jQuery AJAX calls:');
  ajaxCalls.slice(0, 5).forEach(m => console.log(' ', m[0].substring(0, 300)));
  
  console.log('\nXHR calls:');
  xhrCalls.slice(0, 5).forEach(m => console.log(' ', m[0].substring(0, 200)));
  
  console.log('\nonChange refs:');
  changeCalls.slice(0, 5).forEach(m => console.log(' ', m[0].substring(0, 200)));
  
  // Extract linked JS files
  const jsFiles = [...html.matchAll(/<script[^>]*src="([^"]*)"[^>]*>/gi)];
  console.log('\nLinked JS files:');
  jsFiles.forEach(m => console.log(' ', m[1]));
  
  // Look for action URLs in JS
  const actionUrls = [...html.matchAll(/['"](\/ICAI\/[^'"]+\.action[^'"]*)['"]/gi)];
  console.log('\nICai action URLs in page:');
  actionUrls.forEach(m => console.log(' ', m[1]));
}

async function main() {
  await analyzeBos();
  await analyzeSpomJs();
}

main().catch(console.error);
