import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const SITE = 'https://bensbonkjuice.com/';

test('renders the product, usage and pricing', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('img', "Ben's Bonk Juice Logo")).toBeVisible();
  await expect(screen.getByRole('heading', 'High Carb Sports Drink Mix')).toBeVisible();
  for (const section of ['How to use it', "What's in it", 'Open Source', 'Pricing']) {
    await expect(screen.getByRole('heading', section)).toBeVisible();
  }
  await expect(screen.getByText('$29')).toBeVisible();
  await expect(screen.getByText('$0.58')).toBeVisible();
});

test('every referenced asset resolves', async ({ app, browser }) => {
  await app.open('/');
  const refs = await browser.evaluate(() =>
    [...document.querySelectorAll('img[src], link[href], meta[property="og:image"]')].map(
      (el) => el.getAttribute('src') ?? el.getAttribute('href') ?? el.getAttribute('content')!,
    ),
  );
  expect(refs.length).toBeGreaterThan(0);
  for (const ref of refs) {
    const path = new URL(ref, SITE).pathname;
    const response = await fetch(new URL(path, app.baseUrl));
    expect({ ref, status: response.status }).toEqual({ ref, status: 200 });
  }
});

test('ships share and search metadata', async ({ app, browser }) => {
  await app.open('/');
  await expect(browser).toHaveTitle("Ben's Bonk Juice");
  const meta = await browser.evaluate(() => {
    const content = (selector: string) => document.querySelector(selector)?.getAttribute('content') ?? null;
    return {
      description: content('meta[name="description"]'),
      ogTitle: content('meta[property="og:title"]'),
      ogDescription: content('meta[property="og:description"]'),
      ogImage: content('meta[property="og:image"]'),
      ogUrl: content('meta[property="og:url"]'),
      icon: document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? null,
    };
  });
  expect(meta.description).toMatch(/sports drink mix/i);
  expect(meta.ogTitle).toBe("Ben's Bonk Juice");
  expect(meta.ogDescription).toBe(meta.description);
  expect(meta.ogImage).toBe(`${SITE}bens-bonk-juice-logo.webp`);
  expect(meta.ogUrl).toBe(SITE);
  expect(meta.icon).toBeTruthy();
});

test('fits a phone without sideways scrolling', async ({ app, browser, screen }) => {
  await browser.setViewport({ width: 320, height: 640 });
  await app.open('/');
  await expect(screen.getByText('PH 1000 Precision Hydration: $2.42')).toBeVisible();
  const layout = await browser.evaluate(() => {
    const logo = document.querySelector('.logo img') as HTMLImageElement;
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      logoRight: logo.getBoundingClientRect().right,
      viewport: window.innerWidth,
    };
  });
  expect(layout.overflow).toBe(0);
  expect(layout.logoRight).toBeLessThanOrEqual(layout.viewport);
});

test('loads with no console or resource errors', async ({ app, browser, screen }) => {
  await browser.addInitScript(() => {
    const errors: string[] = [];
    (window as any).__errors = errors;
    const original = console.error;
    console.error = (...args) => { errors.push(args.join(' ')); original(...args); };
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement & { src?: string; href?: string };
      errors.push(event.message || `failed to load ${target.src ?? target.href ?? target.tagName}`);
    }, true);
  });
  await app.open('/');
  await expect(screen.getByRole('img', "Ben's Bonk Juice Logo")).toBeVisible();
  const loaded = await browser.evaluate(() => {
    const logo = document.querySelector('.logo img') as HTMLImageElement;
    return {
      complete: logo.complete,
      natural: logo.naturalWidth,
      shown: logo.clientWidth,
      reserved: logo.hasAttribute('width') && logo.hasAttribute('height'),
      errors: (window as any).__errors,
    };
  });
  expect(loaded.errors).toEqual([]);
  expect(loaded.complete).toBe(true);
  expect(loaded.natural).toBeGreaterThan(0);
  // A 2x asset is enough for retina; more is wasted bytes on a phone.
  expect(loaded.natural).toBeLessThanOrEqual(loaded.shown * 2);
  // Intrinsic size on the tag stops the text jumping down when the logo arrives.
  expect(loaded.reserved).toBe(true);
});
