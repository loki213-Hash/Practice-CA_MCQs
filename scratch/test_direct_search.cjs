// Test ASP.NET standard form submit vs UpdatePanel for BOS
const fs = require('fs');

async function testFullPagePostback() {
  console.log('=== Testing Full Page Postback ===\n');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  // Step 1: GET
  const res1 = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', { headers });
  const cookie = (res1.headers.get('set-cookie') || '').split(';')[0];
  const html1 = await res1.text();

  function getVal(html, id) {
    const m = html.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`, 'i'));
    return m ? m[1] : '';
  }

  const vs1 = getVal(html1, '__VIEWSTATE');
  const ev1 = getVal(html1, '__EVENTVALIDATION');
  const vsg1 = getVal(html1, '__VIEWSTATEGENERATOR');

  console.log('Initial VS len:', vs1.length, 'EV len:', ev1.length);

  // Submit search directly with initial ViewState
  const body = new URLSearchParams({
    '__EVENTTARGET': '',
    '__EVENTARGUMENT': '',
    '__LASTFOCUS': '',
    '__VIEWSTATE': vs1,
    '__VIEWSTATEGENERATOR': vsg1,
    '__EVENTVALIDATION': ev1,
    'ddl_reg': '4',
    'ddlPou': '102',
    'ddl_course': '48',
    'btn_search': 'Search'
  });

  const res2 = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie,
      'Referer': 'https://www.icaionlineregistration.org/launchbatchdetail.aspx'
    },
    body: body.toString()
  });

  const html2 = await res2.text();
  console.log('Direct search status:', res2.status, 'HTML len:', html2.length);

  // Check if error or table
  if (html2.includes('Invalid postback')) {
    console.log('❌ Invalid postback error.');
  } else {
    console.log('✅ Success! Checking for batch grid...');
    const hasGrid = html2.includes('grid') || html2.includes('Grid') || html2.includes('Table') || html2.includes('table');
    console.log('Grid present:', hasGrid);
    fs.writeFileSync('scratch/direct_search.html', html2);
  }
}

testFullPagePostback().catch(console.error);
