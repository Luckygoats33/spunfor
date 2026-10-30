"""v2 restore checks. Serve repo: python3 -m http.server 8433 --bind 127.0.0.1 --directory <repo>
   python3 tests/e2e_v2.py [outdir]   (E2E_BASE overrides base URL)"""
import os, sys
from playwright.sync_api import sync_playwright
BASE = os.environ.get('E2E_BASE', 'http://127.0.0.1:8433/')
OUT = sys.argv[1] if len(sys.argv) > 1 else '/workspace/qa-shots/v2restore'
os.makedirs(OUT, exist_ok=True)
res = []
def ok(n, c, x=''):
    res.append((n, bool(c))); print(('PASS ' if c else 'FAIL ') + n + (f'  [{x}]' if x and not c else ''))
NOSCROLL = "document.documentElement.scrollWidth <= window.innerWidth"
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(1280, 900), (390, 844), (320, 640)]:
        ctx = b.new_context(viewport={'width': w, 'height': h}); pg = ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE + 'v2/index.html'); pg.wait_for_timeout(1500)
        ok(f'{w}: no horizontal scroll (home)', pg.evaluate(NOSCROLL), pg.evaluate('document.documentElement.scrollWidth'))
        st = pg.evaluate("[...document.querySelectorAll('#sfbar [data-sfs]')].map(b=>b.dataset.sfs)")
        ok(f'{w}: style switcher has only spun+swiss', st == ['spun', 'swiss'], st)
        ok(f'{w}: default style swiss', pg.evaluate("document.documentElement.dataset.style") == 'swiss')
        tab = pg.locator('.nav a.saas-tab')
        ok(f'{w}: SaaS tab visible, new tab', tab.is_visible() and tab.get_attribute('target') == '_blank' and tab.get_attribute('href') == 'saas.html')
        ok(f'{w}: honesty note', pg.locator('#honestNote').is_visible())
        ok(f'{w}: demo new-window link', pg.get_attribute('#demoNew', 'target') == '_blank')
        ok(f'{w}: planners section', 'from $299' in pg.inner_text('#planners'))
        ok(f'{w}: no page errors', not errs, errs)
        pg.screenshot(path=f'{OUT}/v2-top-{w}.png')
        pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
        pg.screenshot(path=f'{OUT}/v2-full-{w}.png', full_page=True)
        if w == 1280:
            pg.click('#segDesktop'); ok('desktop toggle', 'is-desktop' in pg.get_attribute('#nolaFrame', 'class'))
            pg.click('#segMobile'); ok('mobile toggle', 'is-mobile' in pg.get_attribute('#nolaFrame', 'class'))
        else:
            ok(f'{w}: desktop toggle disabled on narrow', pg.is_disabled('#segDesktop'))
        pg.locator('#app').scroll_into_view_if_needed(); pg.wait_for_timeout(800); pg.screenshot(path=f'{OUT}/v2-app-{w}.png')
        pg.click('#spinBtn'); pg.wait_for_timeout(300)
        ok(f'{w}: wheel opens', pg.locator('#wheelModal').is_visible())
        ok(f'{w}: no h-scroll with wheel', pg.evaluate(NOSCROLL))
        for i in range(3):
            pg.click('#wSpin'); pg.wait_for_timeout(1800)
            if i < 2: pg.click('#wNext')
        pg.screenshot(path=f'{OUT}/v2-wheel-{w}.png')
        if pg.evaluate("window.SpunforWheel.get().dest.label") == 'Other…':
            pg.select_option('#wPick', index=1)
        pg.click('#wUse'); pg.wait_for_timeout(1200)
        ok(f'{w}: wheel fills chat', pg.locator('#wheelWrap').is_hidden() and 'Going to' in pg.inner_text('#build'), pg.inner_text('#build')[:200])
        sp = ctx.new_page(); sp.goto(BASE + 'v2/saas.html'); sp.wait_for_timeout(800)
        ok(f'{w}: saas page', 'TEST MODE' in sp.inner_text('body') and sp.evaluate(NOSCROLL) and sp.locator('meta[name=robots]').count() == 1)
        sp.screenshot(path=f'{OUT}/v2-saas-{w}.png', full_page=True)
        ctx.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page()
    pg.goto(BASE + 'v2/saas.html'); pg.evaluate("localStorage.setItem('sf.siteStyle','postcard')"); pg.goto(BASE + 'v2/index.html'); pg.wait_for_timeout(800)
    ok('saved removed style falls back to swiss', pg.evaluate("document.documentElement.dataset.style") == 'swiss' and pg.evaluate("localStorage.getItem('sf.siteStyle')") in (None, 'swiss'), pg.evaluate("localStorage.getItem('sf.siteStyle')"))
    pg.click('#sfbar [data-sfs=spun]'); pg.wait_for_timeout(300)
    ok('switch to spun', pg.evaluate("document.documentElement.dataset.style") == 'spun')
    pg.screenshot(path=f'{OUT}/v2-spun-390.png')
    pg.reload(); pg.wait_for_timeout(600); ok('spun persists', pg.evaluate("document.documentElement.dataset.style") == 'spun')
    ok('spun: no h-scroll 390', pg.evaluate(NOSCROLL))
    pg.goto(BASE + 'v2/index.html?s=postcard'); pg.wait_for_timeout(500); ok('?s=postcard -> swiss', pg.evaluate("document.documentElement.dataset.style") == 'swiss')
    # app: time picker + votes (via hero Boston iframe)
    pg.goto(BASE + 'v2/index.html'); pg.wait_for_timeout(3500)
    fr = pg.frame_locator('#demoFrame')
    src = pg.get_attribute('#demoFrame', 'src') or ''
    ap = ctx.new_page(); ap.goto(BASE + 'v2/' + src); ap.wait_for_timeout(2500); ap.evaluate("location.hash='now'"); ap.wait_for_timeout(1200)
    if ap.locator('#nowAt').count() == 0:
        for t in ap.locator('button, a').all():
            try:
                if 'Open' in t.inner_text() and t.is_visible(): t.click(); ap.wait_for_timeout(800); break
            except Exception: pass
    ok('app: open-at-time picker', ap.locator('#nowAt').count() == 1)
    if ap.locator('#nowAt').count():
        ap.select_option('#nowAt', index=3); ap.wait_for_timeout(500); ap.screenshot(path=f'{OUT}/v2-app-nowAt-390.png')
    ap.evaluate("(()=>{const e=document.querySelector('[data-open]'); e&&e.click();})()"); ap.wait_for_timeout(800)
    v = ap.locator('[data-vote]')
    ok('app: vote buttons on place sheet', v.count() >= 2)
    if v.count():
        v.first.click(); ap.wait_for_timeout(300); ap.screenshot(path=f'{OUT}/v2-app-vote-390.png')
        ok('app: vote saved', 'true' in (v.first.get_attribute('aria-pressed') or '') or ap.evaluate("JSON.stringify(localStorage)").find('vote') >= 0)
    ok('app: no h-scroll', ap.evaluate(NOSCROLL))
    b.close()
f = [r for r in res if not r[1]]
print(f'\n{len(res)-len(f)}/{len(res)} passed'); sys.exit(1 if f else 0)
