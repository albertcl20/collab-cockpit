const baseUrl = process.env.DEPLOY_URL;
const password = process.env.APP_PASSWORD;

if (!baseUrl) {
  console.error('DEPLOY_URL is required');
  process.exit(1);
}

async function fetchWithCookies(url, init = {}) {
  return fetch(url, {
    redirect: 'manual',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function verifyHttpRoutes(cookieHeader) {
  const checks = ['/', '/login', '/api/health', '/brief'];
  for (const route of checks) {
    const response = await fetchWithCookies(`${baseUrl}${route}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });

    if (response.status !== 200) {
      throw new Error(`${route} returned ${response.status}`);
    }

    const body = await response.text();
    if (route === '/' && (!body.includes('Decision sprint') || !body.includes('Collaboration debt queue') || !body.includes('Operating memo') || !body.includes('Stakeholder comms studio') || !body.includes('Delegation board') || !body.includes('Collaborator memory') || !body.includes('Board portfolio') || !body.includes('Open brief view'))) {
      throw new Error('Home page is up but missing expected collaboration features');
    }

    if (route === '/brief' && !body.includes('Loading brief')) {
      throw new Error('Brief route did not return the expected shell');
    }

    console.log(`ok ${route} -> ${response.status}`);
  }
}

async function verifyBrowserFlow() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });

  if (password) {
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Unlock' }).click();
    await page.waitForLoadState('networkidle');
  }

  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=Open brief view', { timeout: 30000 });
  console.log('ok browser / -> rendered');

  await page.goto(`${baseUrl}/brief`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Brief view', { timeout: 30000 });
  await page.waitForSelector('text=What David should care about first', { timeout: 30000 });
  await page.waitForSelector('text=Copy markdown brief', { timeout: 30000 });
  console.log('ok browser /brief -> rendered');

  await browser.close();
}

async function main() {
  const loginPage = await fetchWithCookies(`${baseUrl}/login`);
  if (loginPage.status !== 200) {
    throw new Error(`/login returned ${loginPage.status}`);
  }

  let cookieHeader = '';
  if (password) {
    const login = await fetchWithCookies(`${baseUrl}/api/login`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (login.status !== 200) {
      throw new Error(`/api/login returned ${login.status}`);
    }

    const setCookie = login.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('collab-cockpit-auth=')) {
      throw new Error('Login did not return auth cookie');
    }
    cookieHeader = setCookie.split(';')[0];
  }

  await verifyHttpRoutes(cookieHeader);
  await verifyBrowserFlow();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
