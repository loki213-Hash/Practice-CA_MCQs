// Fetch BOS POUs by region (AJAX)
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'X-Requested-With': 'XMLHttpRequest',
  'Referer': 'https://www.icaionlineregistration.org/launchbatchdetail.aspx',
  'Content-Type': 'application/x-www-form-urlencoded'
};

// Region IDs from scrape: Central=5, Eastern=1, Foreign=6, Northern=3, Southern=4, Western=2
const REGIONS = [
  { id: '5', name: 'Central' },
  { id: '1', name: 'Eastern' },
  { id: '3', name: 'Northern' },
  { id: '4', name: 'Southern' },
  { id: '2', name: 'Western' }
];

async function getSession() {
  const res = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    headers: { 'User-Agent': HEADERS['User-Agent'], 'Accept': 'text/html' }
  });
  const cookies = res.headers.get('set-cookie') || '';
  const sessionCookie = cookies.split(';')[0];
  const html = await res.text();
  
  // Extract ASP.NET viewstate/eventvalidation
  const vsMatch = html.match(/<input[^>]*name="__VIEWSTATE"[^>]*value="([^"]*)"/i);
  const evMatch = html.match(/<input[^>]*name="__EVENTVALIDATION"[^>]*value="([^"]*)"/i);
  const vsGenMatch = html.match(/<input[^>]*name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"/i);
  
  return {
    cookie: sessionCookie,
    viewstate: vsMatch?.[1] || '',
    eventvalidation: evMatch?.[1] || '',
    viewstategenerator: vsGenMatch?.[1] || ''
  };
}

async function getPousByRegion(regionId, session) {
  // ASP.NET ScriptManager postback for dropdown change
  const body = new URLSearchParams({
    '__EVENTTARGET': 'ddl_reg',
    '__EVENTARGUMENT': '',
    '__VIEWSTATE': session.viewstate,
    '__VIEWSTATEGENERATOR': session.viewstategenerator,
    '__EVENTVALIDATION': session.eventvalidation,
    'ddl_reg': regionId,
    'ddlPou': '',
    'ddl_course': '48'
  });
  
  const res = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    method: 'POST',
    headers: { 
      ...HEADERS, 
      'Cookie': session.cookie,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });
  
  const html = await res.text();
  
  // Extract POUs from ddlPou select
  const pouMatch = html.match(/<select[^>]*name="ddlPou"[^>]*>([\s\S]*?)<\/select>/i);
  const pous = [];
  if (pouMatch) {
    const opts = pouMatch[1].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi);
    for (const m of opts) {
      if (m[1] && m[1] !== 'Select') pous.push({ id: m[1], name: m[2].trim() });
    }
  }
  return pous;
}

async function main() {
  console.log('Fetching BOS session...');
  const session = await getSession();
  console.log('Session cookie:', session.cookie.substring(0, 30));
  console.log('Viewstate length:', session.viewstate.length);
  
  const allPousByRegion = {};
  
  for (const region of REGIONS) {
    console.log(`\n--- Fetching POUs for ${region.name} (ID: ${region.id}) ---`);
    await new Promise(r => setTimeout(r, 500));
    const pous = await getPousByRegion(region.id, session);
    console.log(`  POUs:`, pous.map(p => p.name).join(', '));
    allPousByRegion[region.name] = { regionId: region.id, pous };
  }
  
  console.log('\n====== FULL BOS POUS JSON ======');
  console.log(JSON.stringify(allPousByRegion, null, 2));
}

main().catch(console.error);
