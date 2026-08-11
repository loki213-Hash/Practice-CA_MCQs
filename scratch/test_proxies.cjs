// Try ShriCasa API proxy and other CORS proxies
async function tryUrl(label, url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    console.log(`\n=== ${label} === (status: ${res.status}, len: ${text.length})`);
    console.log(text.substring(0, 500));
    return text;
  } catch (e) {
    console.log(`\n=== ${label} === ERROR: ${e.message}`);
    return null;
  }
}

async function main() {
  // Try ShriCasa's own batch API
  await tryUrl('ShriCasa batch API', 'https://shricasa.com/api/batch');
  await tryUrl('ShriCasa batches list', 'https://shricasa.com/api/batches');
  await tryUrl('ShriCasa ICAI proxy', 'https://shricasa.com/api/icai');
  await tryUrl('ShriCasa pou list', 'https://shricasa.com/api/pou');
  await tryUrl('ShriCasa regions', 'https://shricasa.com/api/regions');
  
  // Try via allorigins CORS proxy for ICAI BOS
  const bosUrl = encodeURIComponent('https://www.icaionlineregistration.org/launchbatchdetail.aspx');
  await tryUrl('AllOrigins BOS', `https://api.allorigins.win/raw?url=${bosUrl}`);
  
  // Try via corsproxy.io
  await tryUrl('CorsProxy BOS', `https://corsproxy.io/?url=${bosUrl}`);
  
  // Try SPOM via allorigins
  const spomUrl = encodeURIComponent('https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action');
  await tryUrl('AllOrigins SPOM', `https://api.allorigins.win/raw?url=${spomUrl}`);
  
  // Try ShriCasa page source to find API endpoint
  await tryUrl('ShriCasa batch page', 'https://shricasa.com/batch');
}

main().catch(console.error);
