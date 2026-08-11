// Scrape BOS Adv ITT / Adv MCS data from icaionlineregistration.org
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function main() {
  console.log('Fetching ICAI BOS launch batch page...');
  const res = await fetch('https://www.icaionlineregistration.org/launchbatchdetail.aspx', { headers: HEADERS });
  const html = await res.text();
  
  // Extract Region dropdown
  const regionMatch = html.match(/<select[^>]*name="[^"]*[Rr]egion[^"]*"[^>]*>([\s\S]*?)<\/select>/i);
  if (regionMatch) {
    console.log('\n=== REGIONS ===');
    const opts = regionMatch[1].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi);
    for (const m of opts) console.log(`  ${m[1]}: ${m[2].trim()}`);
  } else {
    console.log('No region select found, searching all selects...');
  }
  
  // Extract POU dropdown
  const pouMatch = html.match(/<select[^>]*name="[^"]*[Pp]ou[^"]*"[^>]*>([\s\S]*?)<\/select>/i);
  if (pouMatch) {
    console.log('\n=== POUS ===');
    const opts = pouMatch[1].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi);
    for (const m of opts) console.log(`  ${m[1]}: ${m[2].trim()}`);
  }
  
  // Extract Course dropdown
  const courseMatch = html.match(/<select[^>]*name="[^"]*[Cc]ourse[^"]*"[^>]*>([\s\S]*?)<\/select>/i);
  if (courseMatch) {
    console.log('\n=== COURSES ===');
    const opts = courseMatch[1].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi);
    for (const m of opts) console.log(`  ${m[1]}: ${m[2].trim()}`);
  }
  
  // Also extract any table data (batch list)
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
  if (tableMatch) {
    console.log(`\nFound ${tableMatch.length} tables`);
    tableMatch.forEach((t, i) => {
      if (t.includes('Batch') || t.includes('Available')) {
        console.log(`\nTable ${i}:`);
        const rows = t.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
        rows.slice(0, 5).forEach(r => {
          const cells = (r.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [])
            .map(c => c.replace(/<[^>]+>/g, '').trim());
          console.log('  ', cells.join(' | '));
        });
      }
    });
  }
  
  // Print all select options
  const allSelects = html.match(/<select[^>]*>([\s\S]*?)<\/select>/gi) || [];
  console.log(`\n=== ALL SELECTS (${allSelects.length}) ===`);
  allSelects.forEach((sel, i) => {
    const nameMatch = sel.match(/name="([^"]*)"/i);
    const idMatch = sel.match(/id="([^"]*)"/i);
    console.log(`\nSelect ${i}: name=${nameMatch?.[1]} id=${idMatch?.[1]}`);
    const opts = sel.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi);
    for (const m of opts) console.log(`  "${m[1]}" => "${m[2].trim()}"`);
  });
}

main().catch(console.error);
