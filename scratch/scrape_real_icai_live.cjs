// Correct ASP.NET ViewState & EventValidation propagation across steps
const fs = require('fs');

async function getRealBosBatches(regionId = '4', pouId = '102', courseId = '48') {
  console.log(`\n=== Pulling REAL BOS Batches (Region=${regionId}, POU=${pouId}, Course=${courseId}) ===`);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  function extractValue(html, name) {
    // Search by name="<name>" or id="<name>"
    const m = html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`, 'i')) ||
              html.match(new RegExp(`id="${name}"[^>]*value="([^"]*)"`, 'i'));
    return m ? m[1] : '';
  }

  // Step 1: GET initial page
  const pageRes = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', { headers });
  const cookie = (pageRes.headers.get('set-cookie') || '').split(';')[0];
  let html = await pageRes.text();

  let vs = extractValue(html, '__VIEWSTATE');
  let ev = extractValue(html, '__EVENTVALIDATION');
  let vsg = extractValue(html, '__VIEWSTATEGENERATOR');

  console.log('Step 1 -> VS len:', vs.length, 'EV len:', ev.length);

  // Step 2: Postback for Region (ddl_reg)
  let body = new URLSearchParams({
    '__EVENTTARGET': 'ddl_reg',
    '__EVENTARGUMENT': '',
    '__LASTFOCUS': '',
    '__VIEWSTATE': vs,
    '__VIEWSTATEGENERATOR': vsg,
    '__EVENTVALIDATION': ev,
    'ddl_reg': regionId,
    'ddlPou': '0',
    'ddl_course': '0'
  });

  let res = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie,
      'Referer': 'https://www.icaionlineregistration.org/launchbatchdetail.aspx'
    },
    body: body.toString()
  });

  html = await res.text();
  const vs2 = extractValue(html, '__VIEWSTATE');
  const ev2 = extractValue(html, '__EVENTVALIDATION');
  const vsg2 = extractValue(html, '__VIEWSTATEGENERATOR');

  if (vs2) vs = vs2;
  if (ev2) ev = ev2;
  if (vsg2) vsg = vsg2;

  console.log('Step 2 -> VS len:', vs.length, 'EV len:', ev.length);

  // Extract valid POU options
  const pouMatch = html.match(/<select[^>]*id="ddlPou"[^>]*>([\s\S]*?)<\/select>/i);
  let selectedPou = pouId;
  if (pouMatch) {
    const opts = [...pouMatch[1].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi)];
    console.log(`Step 2 POUs (${opts.length}):`, opts.slice(0, 8).map(o => `${o[1]}:${o[2]}`).join(', '));
    const match = opts.find(o => o[1] === pouId);
    if (!match && opts.length > 1) {
      selectedPou = opts[1][1];
      console.log('Using POU:', selectedPou, opts[1][2]);
    }
  }

  // Step 3: Postback for POU (ddlPou)
  body = new URLSearchParams({
    '__EVENTTARGET': 'ddlPou',
    '__EVENTARGUMENT': '',
    '__LASTFOCUS': '',
    '__VIEWSTATE': vs,
    '__VIEWSTATEGENERATOR': vsg,
    '__EVENTVALIDATION': ev,
    'ddl_reg': regionId,
    'ddlPou': selectedPou,
    'ddl_course': '0'
  });

  res = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie,
      'Referer': 'https://www.icaionlineregistration.org/launchbatchdetail.aspx'
    },
    body: body.toString()
  });

  html = await res.text();
  const vs3 = extractValue(html, '__VIEWSTATE');
  const ev3 = extractValue(html, '__EVENTVALIDATION');
  const vsg3 = extractValue(html, '__VIEWSTATEGENERATOR');

  if (vs3) vs = vs3;
  if (ev3) ev = ev3;
  if (vsg3) vsg = vsg3;

  console.log('Step 3 -> VS len:', vs.length, 'EV len:', ev.length);

  // Extract Course options
  const courseMatch = html.match(/<select[^>]*id="ddl_course"[^>]*>([\s\S]*?)<\/select>/i);
  if (courseMatch) {
    const opts = [...courseMatch[1].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi)];
    console.log(`Step 3 Courses (${opts.length}):`, opts.map(o => `${o[1]}:${o[2]}`).join(', '));
  }

  // Step 4: Click Search Button (btn_search)
  body = new URLSearchParams({
    '__EVENTTARGET': 'btn_search',
    '__EVENTARGUMENT': '',
    '__LASTFOCUS': '',
    '__VIEWSTATE': vs,
    '__VIEWSTATEGENERATOR': vsg,
    '__EVENTVALIDATION': ev,
    'ddl_reg': regionId,
    'ddlPou': selectedPou,
    'ddl_course': courseId,
    'btn_search': 'Search'
  });

  res = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie,
      'Referer': 'https://www.icaionlineregistration.org/launchbatchdetail.aspx'
    },
    body: body.toString()
  });

  html = await res.text();
  console.log('Step 4 -> HTML len:', html.length);

  // Parse batches table
  const trMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  console.log(`Total <tr> tags in response: ${trMatches.length}`);

  // Find table rows containing batch details (look for grid or date strings)
  const batchRows = trMatches.filter(m => 
    m[0].includes('B0') || m[0].includes('Batch') || m[0].includes('2026') || m[0].includes('2025') || m[0].includes('RS') || m[0].includes('Rs')
  );

  console.log(`\nMatching Batch Rows found: ${batchRows.length}`);
  batchRows.forEach((r, i) => {
    const text = r[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`Row ${i+1}: ${text.substring(0, 200)}`);
  });

  fs.writeFileSync('scratch/step4_response.html', html);
  console.log('Saved step 4 HTML to scratch/step4_response.html');
}

getRealBosBatches('4', '102', '48').catch(console.error);
