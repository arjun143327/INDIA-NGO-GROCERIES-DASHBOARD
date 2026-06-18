const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.text());
    });

    page.on('response', async (response) => {
      if (response.status() >= 400) {
        console.log(`HTTP ${response.status()} from ${response.url()}`);
        try {
          console.log('Response body:', await response.text());
        } catch(e) {}
      }
    });

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    
    await page.type('#email', 'staff@school.edu');
    await page.type('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 5000));
    
    const html = await page.content();
    console.log('HTML after login:', html.includes('Sign In') ? 'Still on login page' : 'Logged in, HTML snippet:', html.substring(0, 300));
    
    await browser.close();
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  }
})();
