const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log('PAGE_LOG:', msg.text()));
    page.on('error', err => console.error('PAGE_ERROR:', err));

    // Step 1: Navigate to login
    console.log('Step 1: Navigating to login...');
    await page.goto('http://localhost:4000/auth/login.html', { waitUntil: 'networkidle0' });

    // Step 2: Fill login form
    console.log('Step 2: Logging in as company...');
    await page.fill('input[name="email"]', 'company@techcorp.com');
    await page.fill('input[name="password"]', 'company123');

    // Step 3: Wait for redirect after login
    console.log('Step 3: Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    // Step 4: Check token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Token exists:', !!token);
    if (token) {
      console.log('Token sample:', token.substring(0, 50) + '...');
    }

    // Step 5: Navigate to attendance page
    console.log('Step 5: Navigating to internship attendance...');
    await page.goto('http://localhost:4000/company/internship-attendance.html', { waitUntil: 'networkidle0' });

    // Step 6: Wait for DOM to settle
    await page.waitForTimeout(2000);

    // Step 7: Check dropdown
    console.log('Step 7: Checking dropdown options...');
    const dropdownOptions = await page.evaluate(() => {
      const select = document.getElementById('internshipSelect');
      if (!select) return 'SELECT_NOT_FOUND';
      const options = Array.from(select.options).map(o => ({
        value: o.value,
        text: o.text
      }));
      return options;
    });

    console.log('Dropdown options:', JSON.stringify(dropdownOptions, null, 2));

    // Step 8: Check if internships were loaded
    const hasInternships = await page.evaluate(() => {
      const select = document.getElementById('internshipSelect');
      return select && select.options.length > 1;
    });

    console.log('Has internships:', hasInternships);

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})();
