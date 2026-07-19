import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', // Standard Edge path on Windows
      headless: 'new'
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    await page.goto('http://localhost:5173/contabilidad/tipos-documento', { waitUntil: 'networkidle2' });
    
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
