"""Spunfor e2e (Playwright + system Chrome), v4. Serve the site first:
   python3 -m http.server 8433 --bind 127.0.0.1 --directory <repo>
   python3 tests/e2e.py [outdir]
Covers landing, chat, preview, unlock modal, promo + TEST checkout, and the demo app (a faithful copy of NOLA V3) at 390 and 1280."""
import sys, os, re
from playwright.sync_api import sync_playwright
BASE = 'http://127.0.0.1:8433/'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/workspace/spunfor-shots/v4'
os.makedirs(OUT, exist_ok=True)
ANS = ['Delta 1234 MSY, arrives Sat 10:30am', '12 Mar to 15 Mar', 'New Orleans', 'jazz, beignets, history, hidden gems', 'loud Bourbon Street party crowds', '$$ moderate', '2 adults, birthday trip', 'vegetarian options']
res = []
def ok(name, cond, extra=''):
    res.append((name, bool(cond), extra)); print(('PASS ' if cond else 'FAIL ') + name, extra)
CONTRAST = """() => { const L=c=>{const m=c.match(/[\\d.]+/g).map(Number);const [r,g,b]=m.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
  const bgOf=e=>{while(e){const c=getComputedStyle(e).backgroundColor;const m=c.match(/[\\d.]+/g);if(m&&(m.length<4||+m[3]>.9))return c;e=e.parentElement}return 'rgb(255,255,255)'};
  const bad=[];document.querySelectorAll('main *, .nav *, .modal *, h1,h2,h3,p,button,a,li,label,span').forEach(e=>{if(![...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim()))return;const cs=getComputedStyle(e);if(cs.visibility=='hidden'||cs.display=='none'||e.offsetWidth==0||+cs.opacity<.6||e.closest('.reveal:not(.in)')||e.closest('.badge-ring')||e.closest('.pv-lockrow'))return;
   const f=L(cs.color),b=L(bgOf(e)),r=(Math.max(f,b)+.05)/(Math.min(f,b)+.05);const big=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.6&&+cs.fontWeight>=700);if(r<(big?3:4.5))bad.push([e.textContent.trim().slice(0,30),r.toFixed(2)])});return bad.slice(0,8)}"""
PERSONAL = re.compile(r'\b(Emily|Tara|Lauren|niece|Olivier|Toulouse St\b(?! Wharf)|525-8456|Southwest|Portland|Denver)\b|21st')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for W, H in ((390, 844), (1280, 800)):
        tag = str(W)
        ctx = b.new_context(viewport={'width': W, 'height': H}, reduced_motion='no-preference')
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'tile.openstreetmap' not in m.text and 'ERR_' not in m.text and 'Failed to load resource' not in m.text and errs.append(m.text))
        pg.on('response', lambda r: r.status >= 400 and r.url.startswith(BASE) and errs.append(f'{r.status} {r.url}'))  # external services (tiles, weather) may 503; local files must not
        pg.goto(BASE + 'index.html'); pg.wait_for_timeout(1200)
        ok(f'{W} landing no hscroll', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        html = pg.content().lower(); 
        ok(f'{W} no stitch/thread/perforation imagery', not re.search(r'stitch|thread|perfor|boarding', html))
        ok(f'{W} display font is Unbounded', 'unbounded' in pg.evaluate('getComputedStyle(document.querySelector("h1")).fontFamily').lower() and int(pg.evaluate('getComputedStyle(document.querySelector("h1")).fontWeight')) >= 800)
        pg.screenshot(path=f'{OUT}/landing-top-{tag}.png')
        pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))"); pg.wait_for_timeout(1100)
        lt=pg.inner_text('main').lower(); ok(f'{W} landing both audiences + pricing', '$29.99' in lt and 'from $299' in lt and 'vacation planners' in lt and 'travelers' in lt and '$9.99' not in lt and pg.locator('#talkBtn').count()==1)
        pg.click('#talkBtn'); ok(f'{W} talk form placeholder marked', 'PLACEHOLDER' in pg.inner_text('#talk') and 'mailto:' in pg.get_attribute('#tMail','href'))
        pg.screenshot(path=f'{OUT}/landing-full-{tag}.png', full_page=True)
        ok(f'{W} landing contrast', not (c := pg.evaluate(CONTRAST)), str(c))
        for a in ANS:
            pg.wait_for_selector('#input:not([disabled])', timeout=8000); pg.fill('#input', a); pg.press('#input', 'Enter'); pg.wait_for_timeout(450)
        pg.wait_for_selector('#unlockBtn', timeout=15000)
        ok(f'{W} dial completes', pg.inner_text('#dialNo').strip() == '✓')
        pg.locator('#chat').scroll_into_view_if_needed(); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/chat-{tag}.png')
        pg.evaluate("document.querySelector('.result').scrollIntoView()"); pg.wait_for_timeout(800); pg.screenshot(path=f'{OUT}/preview-{tag}.png')
        pg.wait_for_timeout(1700)
        if pg.locator('#modalWrap.on').count()==0: pg.click('#unlockBtn')
        pg.wait_for_selector('#modal'); pg.wait_for_timeout(900); pg.screenshot(path=f'{OUT}/modal-{tag}.png')
        ok(f'{W} modal contrast', not (c := pg.evaluate(CONTRAST)), str(c))
        ok(f'{W} modal price + promo box', '$29.99' in pg.inner_text('#modal') and pg.locator('input[name=scheme]').count()==3 and pg.locator('input[name=mod]').count()==7 and pg.locator('#promo').count() == 1)
        pg.fill('#promo', 'nope'); pg.click('#applyPromo'); ok(f'{W} bad promo rejected', 'valid' in pg.inner_text('#promoMsg'))
        pg.click('#buyBtn'); pg.wait_for_selector('#cn'); pg.wait_for_timeout(500)
        ok(f'{W} TEST MODE label', 'TEST MODE' in pg.inner_text('#modal'))
        pg.fill('#em', 'a@b.co'); pg.fill('#cn', '4000 0000 0000 0002'); pg.fill('#ex', '12/34'); pg.fill('#cv', '123'); pg.screenshot(path=f'{OUT}/checkout-{tag}.png')
        pg.click('#payBtn'); pg.wait_for_timeout(2600); ok(f'{W} decline msg', 'declined' in pg.inner_text('#payMsg').lower())
        pg.fill('#cn', '1111 2222 3333 4444'); pg.click('#payBtn'); pg.wait_for_timeout(300); ok(f'{W} non-test card rejected + cleared', 'test cards' in pg.inner_text('#payMsg').lower() and pg.input_value('#cn') == '')
        pg.fill('#cn', '4242 4242 4242 4242'); pg.click('#payBtn'); pg.wait_for_selector('#openApp', timeout=8000); ok(f'{W} test card unlock', True)
        pg.screenshot(path=f'{OUT}/unlocked-{tag}.png')
        ok(f'{W} receipt shows test price + customization', '(TEST' in pg.inner_text('#modal') and 'City colors' in pg.inner_text('#modal'))
        ok(f'{W} unlock stored', pg.evaluate('!!localStorage.getItem("spunfor.unlock")'))
        # promo "goat" path in a fresh context
        c2 = b.new_context(viewport={'width': W, 'height': H}); p2 = c2.new_page()
        p2.goto(BASE + 'index.html'); p2.wait_for_timeout(900)
        for a in ANS:
            p2.wait_for_selector('#input:not([disabled])'); p2.fill('#input', a); p2.press('#input', 'Enter'); p2.wait_for_timeout(550)
        p2.wait_for_selector('#unlockBtn'); p2.wait_for_timeout(1900); p2.wait_for_selector('#promo'); p2.fill('#promo', 'GOAT'); p2.click('#applyPromo'); p2.wait_for_selector('#freeBtn'); ok(f'{W} goat promo makes it free', '$0.00' in p2.inner_text('#modal'))
        p2.click('#freeBtn'); p2.wait_for_selector('#openApp', timeout=8000); ok(f'{W} goat goes straight to success (no payment screen)', p2.locator('#cn').count() == 0)
        c2.close()
        ok(f'{W} landing/chat/modal errors', not errs, str(errs))
        # ---- demo app: faithful V3 copy ----
        pg.click('#openApp'); pg.wait_for_url('**/demo/index.html*'); pg.evaluate("localStorage.setItem('nola3-tour-done','1')"); pg.reload(); pg.wait_for_timeout(1800)
        ok(f'{W} chat unlock leads into demo', '/demo/' in pg.url)
        def shot(n): pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/demo-{n}-{tag}.png')
        ok(f'{W} six tabs like V3', pg.locator('.tab').count() == 6 and [t.strip() for t in pg.locator('.tab').all_inner_texts()][:6] == ['Home', 'Map', 'Explore', 'Saved', 'Ink', 'Help'], str(pg.locator('.tab').all_inner_texts()))
        shot('home'); ok(f'{W} home hscroll', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        ok(f'{W} golden girls personas', all(n in pg.inner_text('#main') for n in ('Dorothy', 'Blanche', 'Rose', 'Sophia')))
        pg.click('[data-surp="mood:jazz"]'); pg.click('[data-surp="hrs:3"]'); pg.wait_for_timeout(200); shot('surprise')
        pg.click('[data-holla]'); pg.wait_for_timeout(500); shot('holla'); ok(f'{W} holla opens (open now list)', 'holla holla' in pg.inner_text('#meowpop').lower()); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        if pg.locator('#meowpop').count(): pg.locator('#meowpop button').first.click(); pg.wait_for_timeout(300)
        pg.locator('.tab:nth-child(2)').click(); pg.wait_for_timeout(1800); ok(f'{W} map leaflet markers', pg.locator('.leaflet-container').count() == 1 and pg.locator('.leaflet-marker-icon').count() > 3, str(pg.locator('.leaflet-marker-icon').count())); shot('map')
        ok(f'{W} map hscroll', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        pg.locator('.tab:nth-child(3)').click(); pg.wait_for_timeout(500); shot('explore')
        pg.locator('.tab:nth-child(4)').click(); pg.wait_for_timeout(500); shot('saved')
        pg.locator('.tab:nth-child(5)').click(); pg.wait_for_timeout(700); shot('ink'); ok(f'{W} ink tab kept', pg.locator('#main img').count() > 3)
        pg.locator('.tab:nth-child(1)').click(); pg.wait_for_timeout(300)
        pg.click('[data-open="preshall"] >> nth=-1'); pg.wait_for_timeout(700); shot('venue'); ok(f'{W} venue sheet', 'Preservation Hall' in pg.inner_text('body')); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        pg.click('[data-go="time"]'); pg.wait_for_timeout(500); shot('time-machine')
        pg.locator('.tab:nth-child(1)').click(); pg.click('[data-go="birthday"]'); pg.wait_for_timeout(500); shot('big-night'); ok(f'{W} big night keeps names out', not PERSONAL.search(pg.inner_text('#main')))
        pg.locator('.tab:nth-child(6)').click(); pg.wait_for_timeout(400); shot('help')
        pg.click('[data-tour]'); pg.wait_for_timeout(600); n = 0
        while pg.locator('#tour').count() and n < 25:
            btn = pg.locator('#tour button').last; lab = btn.inner_text().strip(); btn.click(); pg.wait_for_timeout(350); n += 1
            if n == 3: pg.screenshot(path=f'{OUT}/demo-tour-{tag}.png')
            if lab.lower() in ('done', 'finish'): break
        ok(f'{W} help tour completes', pg.locator('#tour').count() == 0, str(n))
        # theme picker lives in Trip details & settings
        pg.locator('.tab:nth-child(6)').click(); pg.click('[data-go="info"]'); pg.wait_for_timeout(500)
        ok(f'{W} no personal data in trip details', not PERSONAL.search(pg.inner_text('#main')), str(PERSONAL.findall(pg.inner_text('#main'))))
        pg.evaluate("localStorage.setItem('nola2-mode','day')"); pg.reload(); pg.wait_for_timeout(1200); pg.locator('.tab:nth-child(6)').click(); pg.click('[data-go="info"]'); pg.wait_for_timeout(500)
        base_acc = pg.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--coral")')
        for m in ('generic', 'custom', 'city'):
            pg.click(f'[data-spun-theme={m}]'); pg.wait_for_timeout(250)
            col = pg.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--coral").trim()')
            if m == 'custom': pg.evaluate("(()=>{const i=document.getElementById('spunAccent');i.value='#0a7a3c';i.dispatchEvent(new Event('input',{bubbles:true}))})()"); pg.wait_for_timeout(200); col = pg.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--coral").trim()')
            ok(f'{W} theme {m} overrides V3 vars' if m != 'city' else f'{W} theme city restores V3 palette', (m == 'city' and col.lower() == base_acc.strip().lower()) or (m == 'generic' and col.lower() == '#1d4ed8') or (m == 'custom' and col.lower() != base_acc.strip().lower()), col)
            pg.screenshot(path=f'{OUT}/theme-{m}-{tag}.png')
        pg.click('[data-spun-theme=generic]'); pg.evaluate("localStorage.setItem('nola2-mode','night')"); pg.reload(); pg.wait_for_timeout(1200); pg.locator('.tab:nth-child(1)').click(); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/theme-generic-dark-{tag}.png')
        ok(f'{W} generic dark', pg.evaluate('document.documentElement.dataset.mode')=='night')
        pg.evaluate("localStorage.removeItem('spunfor.theme');localStorage.setItem('nola2-mode','night')"); pg.reload(); pg.wait_for_timeout(1200); pg.screenshot(path=f'{OUT}/demo-dark-{tag}.png')
        ok(f'{W} demo hscroll end', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        ok(f'{W} demo errors', not errs, str(errs[-3:]))
        # first-run tour
        pg3 = ctx.new_page(); pg3.add_init_script("localStorage.clear()"); pg3.goto(BASE + 'demo/index.html'); pg3.wait_for_timeout(1800)
        ok(f'{W} first-run quick tour auto-starts', pg3.locator('#tour').count() == 1)
        ctx.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce'); pg = ctx.new_page(); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(600)
    ok('reduced motion: animations off', pg.evaluate('getComputedStyle(document.querySelector(".badge-ring")).animationName')=='none' and pg.evaluate('getComputedStyle(document.querySelector(".reveal")).opacity')=='1')
    b.close()
fails = [r for r in res if not r[1]]
print(f'\n{len(res)-len(fails)}/{len(res)} passed'); sys.exit(1 if fails else 0)
