import { expect, test } from '@playwright/test';

test('blocked sockets retain automatic kickoff, five-second updates, and settled wallet balances', async ({ page }) => {
  await page.route('**/socket.io/**', route => route.abort());
  await page.routeWebSocket('**/socket.io/**', socket => socket.close());
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  expect((await page.request.post('/api/auth/signup', { data: {
    email: `fallback${unique}@example.com`, username: `fallback${unique}`,
    displayName: 'REST Matchday Viewer', password: 'browser-fixture-password',
  } })).ok()).toBeTruthy();
  expect((await page.request.post('/api/dev/open-round')).ok()).toBeTruthy();
  const round = await (await page.request.get('/api/rounds/current')).json();
  const match = round.matches[0];
  // One pick must win, so the wallet must visibly change after full time.
  for (const selection of ['HOME', 'DRAW', 'AWAY']) {
    expect((await page.request.post('/api/bets', { data: {
      matchId: match.id, market: 'MATCH_RESULT', selection, stake: 20,
    } })).ok()).toBeTruthy();
  }
  expect((await page.request.post(`http://127.0.0.1:3100/__test/schedule/${match.id}`)).ok()).toBeTruthy();
  await page.goto(`/matches/${match.id}/live`);
  await expect(page.getByText('The stage is set.')).toBeVisible();
  // The first five-second poll must discover kickoff, not wait ten seconds
  // and allow the REST audience lease to expire between alternate polls.
  await expect(page.locator('svg .live-player')).toHaveCount(22, { timeout: 7500 });
  const next = await page.waitForResponse(response => response.url().endsWith(`/api/matches/${match.id}/live`)
    && response.ok(), { timeout: 6500 });
  expect((await next.json()).live.phase).toBe('LIVE');
  expect((await page.request.post(`http://127.0.0.1:3100/__test/advance/${match.id}?seconds=600`)).ok()).toBeTruthy();
  const account = await page.request.get('/api/users/me');
  expect(account.ok()).toBeTruthy();
  const me = await account.json();
  const balance = await page.evaluate(value => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value)), me.coinBalance);
  await expect(page.getByText('Result confirmed · pre-match bets settled')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Pending full time')).toHaveCount(0, { timeout: 16000 });
  await expect(page.locator('header').getByText(balance, { exact: true })).toBeVisible({ timeout: 16000 });
});

test('automatic kickoff, smooth movement, reconnect, half time and locked-bet settlement', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const signup = await page.request.post('/api/auth/signup', { data: {
    email: `watcher${unique}@example.com`, username: `watcher${unique}`, displayName: 'Matchday Viewer', password: 'browser-fixture-password',
  } });
  expect(signup.ok()).toBeTruthy();
  expect((await page.request.post('/api/dev/open-round')).ok()).toBeTruthy();
  const round = await (await page.request.get('/api/rounds/current')).json();
  const match = round.matches[0];
  expect((await page.request.post('/api/bets', { data: {
    matchId: match.id, market: 'TOTAL_CORNERS', selection: 'OVER', stake: 20,
  } })).ok()).toBeTruthy();
  expect((await page.request.post(`http://127.0.0.1:3100/__test/schedule/${match.id}`)).ok()).toBeTruthy();
  await page.goto(`/matches/${match.id}/live`);
  await expect(page.getByText('The stage is set.')).toBeVisible();
  await expect(page.getByText('Kickoff is automatic.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /start.*match/i })).toHaveCount(0);
  await expect(page.getByText('Home ·', { exact: false })).toBeVisible();
  await expect(page.getByText('Your pre-match picks · locked')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start demo match' })).toHaveCount(0);
  await expect(page.getByRole('img', { name: /Live tactical pitch/ })).toBeVisible();
  await expect(page.locator('svg .live-player')).toHaveCount(22, { timeout: 8000 });
  await expect(page.getByRole('button', { name: /place bet|cancel.*refund/i })).toHaveCount(0);
  const denied = await page.request.post('/api/bets', { data: { matchId: match.id, market: 'MATCH_RESULT', selection: 'HOME', stake: 20 } });
  expect(denied.status()).toBe(409);

  const advance = await page.request.post(`http://127.0.0.1:3100/__test/advance/${match.id}?seconds=30`);
  expect(advance.ok()).toBeTruthy();
  const frames = await page.evaluate(() => new Promise<Array<{ at: number; x: number; y: number }>>(resolve => {
    const samples: Array<{ at: number; x: number; y: number }> = [];
    function sample(at: number) {
      const ball = document.querySelector<SVGGElement>('.live-ball')!;
      const matrix = ball.transform.baseVal.consolidate()!.matrix;
      samples.push({ at, x: matrix.e, y: matrix.f });
      if (samples.length >= 40) resolve(samples); else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  expect(new Set(frames.map(p => `${p.x},${p.y}`)).size).toBeGreaterThan(5);
  for (let i = 1; i < frames.length; i++) {
    const current = frames[i]!; const previous = frames[i - 1]!;
    expect(Math.hypot(current.x - previous.x, current.y - previous.y))
      .toBeLessThanOrEqual(900 * Math.min(current.at - previous.at, 50) / 1000 + .05);
  }
  await expect(page.getByRole('tab', { name: 'Players & changes' })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('live-pitch.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await expect(page.getByRole('button', { name: 'Sound on' })).toBeVisible();
  await page.getByRole('button', { name: 'Sound on' }).click();

  // Exercise visibility handling deterministically without relying on whether
  // the headless OS decides to background a second browser window.
  const hiddenFrames = await page.evaluate(async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    const positions: Array<string | null> = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(requestAnimationFrame);
      positions.push(document.querySelector('.live-ball')!.getAttribute('transform'));
    }
    Reflect.deleteProperty(document, 'hidden'); Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
    return positions;
  });
  expect(new Set(hiddenFrames).size).toBe(1);

  // Remounting joins the room and recovers the current score and timeline.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { configurable: true,
      value: class { constructor() { throw new Error('Audio permission denied'); } } });
  });
  await page.reload();
  await expect(page.getByText('Your pre-match picks · locked')).toBeVisible();
  await page.getByRole('button', { name: 'Enable sound' }).click();
  await expect(page.getByText('Sound is unavailable in this browser. The match will continue.')).toBeVisible();
  const snapshot = await (await page.request.get(`/api/matches/${match.id}/live`)).json();
  const activePlayers = [...snapshot.live.home.players, ...snapshot.live.away.players]
    .filter((player: { status: string }) => player.status === 'ACTIVE').length;
  await expect(page.locator('svg .live-player')).toHaveCount(activePlayers);
  const halftime = await page.request.post(`http://127.0.0.1:3100/__test/advance/${match.id}?seconds=150`);
  expect(halftime.ok()).toBeTruthy();
  expect((await halftime.json()).phase).toBe('HALFTIME');
  await expect(page.getByText('Team talks & fresh legs')).toBeVisible();
  await page.getByRole('tab', { name: 'Players & changes' }).click();
  await expect(page.getByText(/\/5 subs/).first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('svg .live-player').first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');

  await page.request.post(`http://127.0.0.1:3100/__test/advance/${match.id}?seconds=600`);
  await expect(page.getByText('Result confirmed · pre-match bets settled')).toBeVisible();
  await expect(page.getByText('Pending full time')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Match feed' }).click();
  await page.getByRole('button', { name: 'Load complete timeline' }).click();
  await expect(page.getByText('The whistle goes. We are underway!')).toBeAttached();
  await page.screenshot({ path: testInfo.outputPath('match-recap.png'), fullPage: true });

  // A slow history read from this recap must not leak into the next match.
  let releaseHistory!: () => void;
  const historyBarrier = new Promise<void>(resolve => { releaseHistory = resolve; });
  const historyUrl = `/api/matches/${match.id}/events`;
  await page.route(`**${historyUrl}?**`, async route => {
    await historyBarrier;
    await route.fulfill({ json: { events: [{ ...snapshot.live.events[0], sequence: 999999,
      important: true, text: 'OLD MATCH HISTORY MUST NOT APPEAR' }], nextSequence: null } });
  });
  await page.getByRole('button', { name: 'Load complete timeline' }).click();
  await expect(page.getByRole('button', { name: 'Loading…', exact: true })).toBeVisible();
  const nextMatch = round.matches[1];
  expect((await page.request.post(`http://127.0.0.1:3100/__test/schedule/${nextMatch.id}`)).ok()).toBeTruthy();
  await page.locator(`a[href="/matches/${nextMatch.id}/live"]`).click();
  await expect(page.locator('svg .live-player')).toHaveCount(22, { timeout: 8000 });
  const historyFinished = page.waitForEvent('requestfinished', request => request.url().includes(historyUrl));
  releaseHistory(); await historyFinished;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.getByText('OLD MATCH HISTORY MUST NOT APPEAR')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Load complete timeline' })).toBeEnabled();
  await page.getByRole('link', { name: 'Matchday board' }).click();
  await expect(page.getByRole('link', { name: 'View match recap →' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /place bet/i })).toHaveCount(0);
  expect(errors).toEqual([]);
});
