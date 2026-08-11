const fs = require('fs');

async function testSpom() {
  const res = await fetch('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();

  // Find AJAX endpoints for city and center dropdowns
  const ajaxCalls = html.match(/$.get\([^\)]*\)|$.post\([^\)]*\)|url:\s*['"][^'"]+['"]/gi);
  console.log('AJAX Calls in HTML:', ajaxCalls);

  // Find scripts
  const scripts = html.match(/<script[^>]*src=['"]([^'"]+)['"]/gi);
  console.log('Script Sources:', scripts);

  // Extract States option list
  const stateMatch = html.match(/<select name="cmbState"[\s\S]*?<\/select>/i);
  if (stateMatch) {
    console.log('--- STATES LIST ---');
    console.log(stateMatch[0]);
  }
}

testSpom().catch(console.error);
