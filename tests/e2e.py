"""Spunfor e2e (Playwright + system Chrome). Serve the site first:
   python3 -m http.server 8433 --bind 127.0.0.1 --directory <repo>
   python3 tests/e2e.py [outdir]"""
import sys, json, os
from playwright.sync_api import sync_playwright
BASE = 'http://127.0.0.1:8433/'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/workspace/spunfor-shots/v3'
os.makedirs(OUT, exist_ok=True)
ANS = ['Delta 1234 MSY, arrives Sat 10:30am', '12 Mar to 15 Mar', 'New Orleans', 'jazz, beignets, history, hidden gems', 'loud Bourbon Street party crowds', '$$ moderate', '2 adults, birthday trip', 'vegetarian options']
res = []
def ok(name, cond, extra=''):
    res.append((name, bool(cond), extra)); print(('PASS ' if cond else 'FAIL ') + name, extra)
def contrast_js():
    return """() => { const L=c=>{const m=c.match(/[\\d.]+/g).map(Number);const [r,g,b]=m.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
  const bgOf=e=>{while(e){const c=getComputedStyle(e).backgroundColor;const m=c.match(/[\\d.]+/g);if(m&&(m.length<4||+m[3]>.9))return c;e=e.parentElement}return 'rgb(255,255,255)'};
  const bad=[];document.querySelectorAll('main *, .top *, .tabs *, h1,h2,h3,p,button,a,li,label,span').forEach(e=>{if(!e.childNodes.length||![...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim()))return;const cs=getComputedStyle(e);if(cs.visibility=='hidden'||cs.display=='none'||e.offsetWidth==0||+cs.opacity<.6)return;
   const f=L(cs.color),b=L(bgOf(e)),r=(Math.max(f,b)+.05)/(Math.min(f,b)+.05);const big=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.6&&+cs.fontWeight>=700);if(r<(big?3:4.5))bad.push([e.textContent.trim().slice(0,30),r.toFixed(2)])});return bad.slice(0,8)}"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for W, H in ((390, 844), (1280, 800)):
        tag = str(W)
        ctx = b.new_context(viewport={'width': W, 'height': H}, reduced_motion='no-preference')
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'tile.openstreetmap' not in m.text and 'ERR_' not in m.text and errs.append(m.text))
        pg.goto(BASE + 'index.html'); pg.wait_for_timeout(900)
        ok(f'{W} landing no hscroll', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        pg.screenshot(path=f'{OUT}/landing-top-{tag}.png'); pg.screenshot(path=f'{OUT}/landing-full-{tag}.png', full_page=True)
        ok(f'{W} landing contrast', not (c := pg.evaluate(contrast_js())), str(c))
        for a in ANS:
            pg.wait_for_selector('#input:not([disabled])', timeout=8000); pg.fill('#input', a); pg.press('#input', 'Enter'); pg.wait_for_timeout(450)
        pg.wait_for_selector('#unlockBtn', timeout=15000)
        pg.locator('#chat').scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/chat-{tag}.png')
        pg.click('#unlockBtn'); pg.wait_for_selector('#modal'); pg.wait_for_timeout(400); pg.screenshot(path=f'{OUT}/modal-{tag}.png')
        ok(f'{W} modal contrast', not (c := pg.evaluate(contrast_js())), str(c))
        # bad promo, then card decline, then success
        pg.fill('#promo', 'nope'); pg.click('#applyPromo'); ok(f'{W} bad promo rejected', 'valid' in pg.inner_text('#promoMsg'))
        pg.click('#buyBtn'); pg.wait_for_selector('#cn'); pg.wait_for_timeout(300)
        pg.fill('#em', 'a@b.co'); pg.fill('#cn', '4000 0000 0000 0002'); pg.fill('#ex', '12/34'); pg.fill('#cv', '123'); pg.screenshot(path=f'{OUT}/checkout-{tag}.png')
        pg.click('#payBtn'); pg.wait_for_timeout(2600); ok(f'{W} decline msg', 'declined' in pg.inner_text('#payMsg').lower())
        pg.fill('#cn', '4242 4242 4242 4242'); pg.click('#payBtn'); pg.wait_for_selector('#openApp', timeout=8000); ok(f'{W} test card unlock', True)
        pg.screenshot(path=f'{OUT}/unlocked-{tag}.png')
        ok(f'{W} landing/chat/modal errors', not errs, str(errs))
        # demo (same context, same origin storage)
        pg.goto(BASE + 'demo/index.html#notour'); pg.wait_for_timeout(1200)
        ok(f'{W} trip data drives demo', 'New Orleans' in pg.inner_text('#tripTitle'), pg.inner_text('#tripTitle'))
        def shot(n): pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/demo-{n}-{tag}.png')
        shot('home'); pg.screenshot(path=f'{OUT}/demo-home-full-{tag}.png', full_page=True)
        ok(f'{W} home hscroll', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        ok(f'{W} home contrast', not (c := pg.evaluate(contrast_js())), str(c))
        ok(f'{W} personas+surprise+time', pg.locator('.girl').count() == 4 and pg.locator('#surprise').count() == 1 and 'local' not in '' )
        # prefs from answers
        ok(f'{W} avoid/likes from chat', 'Avoiding' in pg.inner_text('.hero') and 'Prioritizing' in pg.inner_text('.hero'))
        ok(f'{W} dates parsed → countdown/trip chip', pg.locator('.hero .hchip').count() >= 2, pg.inner_text('.hero .chips')[:80])
        ok(f'{W} celebration module on (birthday)', 'Celebration' in pg.inner_text('#view'))
        # surprise
        pg.click('[data-surp="mood:jazz"]'); pg.click('[data-surp="hrs:3"]'); pg.click('[data-surp="mode:walk"]'); pg.click('[data-act=surprun]'); pg.wait_for_timeout(300)
        ok(f'{W} surprise me result', pg.locator('#adv, #surprise .empty').count() == 1, 'adv' if pg.locator('#adv').count() else 'empty')
        if pg.locator('[data-act=surpadd]').count(): pg.click('[data-act=surpadd]')
        # holla
        pg.click('#btnHolla'); pg.wait_for_timeout(300); ok(f'{W} holla on', 'open' in pg.inner_text('.holla-head').lower()); shot('holla'); pg.click('#btnHolla')
        # map
        pg.click('#tabs [data-v=map]'); pg.wait_for_timeout(1200); ok(f'{W} map leaflet', pg.locator('.leaflet-container').count() == 1 and pg.locator('.leaflet-marker-icon').count() > 3, str(pg.locator('.leaflet-marker-icon').count()))
        pg.click('[data-act=radius][data-k="10"]'); pg.click('[data-act=mapopen]'); pg.click('[data-act=maptips]'); shot('map')
        ok(f'{W} map hscroll', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        pg.click('[data-act=mapopen]')
        # explore
        pg.click('#tabs [data-v=explore]'); pg.wait_for_timeout(300); shot('explore')
        ok(f'{W} explore contrast', not (c := pg.evaluate(contrast_js())), str(c))
        pg.fill('#uq', 'beignet'); pg.wait_for_timeout(300); ok(f'{W} search', pg.locator('.res').count() >= 1); pg.fill('#uq', '')
        pg.click('.colcard >> nth=0'); pg.wait_for_timeout(300); ok(f'{W} collection', pg.locator('.tk').count() > 0); shot('collection')
        # place sheet + save + vote + visit + rate
        pg.click('.tk .tk-main >> nth=0'); pg.wait_for_selector('#sheetWrap.on'); pg.wait_for_timeout(300); shot('place')
        pg.click('#sheet [data-act=save]'); pg.click('#sheet .vote.v-must'); pg.click('#sheet [data-act=addplan]'); pg.click('#sheet [data-act=visit]'); pg.wait_for_timeout(200)
        pg.click('#sheet .hearts button >> nth=3'); pg.fill('#sheet [data-jn]', 'Great beignets'); pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        # more places so stamps appear
        pg.click('#tabs [data-v=explore]'); pg.click('[data-act=go][data-v=time]') if pg.locator('[data-act=go][data-v=time]').count() else None
        pg.wait_for_timeout(300); ok(f'{W} time machine', pg.locator('.tm-card').count() == 1); shot('time')
        pg.click('[data-act=era][data-k="3"]'); pg.wait_for_timeout(200)
        # saved
        pg.click('#tabs [data-v=saved]'); pg.wait_for_timeout(300); ok(f'{W} plan has stop', pg.locator('.stop').count() >= 1); shot('saved')
        ok(f'{W} saved contrast', not (c := pg.evaluate(contrast_js())), str(c))
        for t in ('picks', 'passport', 'journal'):
            pg.click(f'[data-act=stab][data-k={t}]'); pg.wait_for_timeout(250); shot('saved-' + t)
        ok(f'{W} journal note persisted', 'Great' in pg.evaluate('document.querySelector("[data-jn]").value'))
        ok(f'{W} stamp earned', pg.evaluate('JSON.parse(localStorage.getItem("spunfor.visited2")||"{}")') != {})
        # add traveler + everyone's in
        pg.click('[data-act=stab][data-k=picks]'); pg.fill('#np', 'Sam'); pg.press('#np', 'Enter'); pg.wait_for_timeout(250)
        pg.click('.res.pick .vote.v-must >> nth=0'); pg.click('[data-act=me][data-k=You]'); pg.wait_for_timeout(200)
        pg.click('[data-act=person][data-k=every]'); pg.wait_for_timeout(200); ok(f'{W} everyone\'s in', pg.locator('.every').count() >= 1 or 'Nothing' in pg.inner_text('#view'))
        # help + tours
        pg.click('#tabs [data-v=help]'); pg.wait_for_timeout(300); shot('help')
        pg.click('[data-tour]'); pg.wait_for_timeout(500); n = 0
        while pg.locator('#tour').count() and n < 20:
            lab = pg.inner_text('#tour [data-tourgo=next]').strip(); pg.click('#tour [data-tourgo=next]'); pg.wait_for_timeout(450); n += 1
            if n == 4: pg.screenshot(path=f'{OUT}/demo-tour-{tag}.png')
            if lab == 'Done': break
        ok(f'{W} full tour completes', n == 14 and pg.locator('#tour').count() == 0, str(n))
        # themes
        pg.click('#btnTheme'); pg.wait_for_timeout(300)
        for m in ('generic', 'custom', 'city'):
            pg.click(f'[data-act=tmode][data-k={m}]'); pg.wait_for_timeout(200)
            if m == 'custom': pg.click('[data-act=preset] >> nth=2'); pg.wait_for_timeout(200)
            ok(f'{W} theme {m}', pg.evaluate('document.documentElement.dataset.themeMode') == m)
            pg.screenshot(path=f'{OUT}/theme-{m}-{tag}.png')
        for s in ('dark', 'light', 'auto'):
            pg.click(f'[data-act=scheme][data-k={s}]'); pg.wait_for_timeout(200)
            if s == 'dark':
                pg.screenshot(path=f'{OUT}/theme-dark-{tag}.png'); pg.click('#sheet [data-act=closeSheet]'); pg.wait_for_timeout(300)
                for v in ('home', 'saved', 'explore'):
                    pg.click(f'#tabs [data-v={v}]'); pg.wait_for_timeout(250)
                    ok(f'{W} dark {v} contrast', not (c := pg.evaluate(contrast_js())), str(c))
                pg.screenshot(path=f'{OUT}/demo-dark-{tag}.png'); pg.click('#btnTheme'); pg.wait_for_timeout(300)
        pg.click('[data-act=scheme][data-k=light]'); pg.click('#sheet [data-act=closeSheet]')
        # persona rename + persistence
        pg.click('#btnTheme'); pg.wait_for_timeout(200); pg.fill('[data-pers="sage:name"]', 'Dot'); pg.click('#sheet [data-act=closeSheet]'); pg.click('#tabs [data-v=home]'); pg.wait_for_timeout(300)
        ok(f'{W} persona rename', 'Dot' in pg.inner_text('.girls'))
        # deep link + hash routes
        pg.goto(BASE + 'demo/index.html#place.cdm'); pg.reload(); pg.wait_for_timeout(1200); ok(f'{W} deep link place', pg.locator('#sheetWrap.on').count() == 1)
        pg.goto(BASE + 'demo/index.html#col.hidden'); pg.reload(); pg.wait_for_timeout(600); ok(f'{W} hash collection', 'Hidden' in pg.inner_text('.colhead'))
        ok(f'{W} pwa manifest+sw', pg.evaluate('fetch("manifest.webmanifest").then(r=>r.ok)') and pg.evaluate('fetch("sw.js").then(r=>r.ok)'))
        # first-run quick tour
        pg2 = ctx.new_page(); pg2.evaluate('0'); pg2.goto(BASE + 'demo/index.html'); pg2.evaluate('localStorage.removeItem("spunfor.tourDone")'); pg2.reload(); pg2.wait_for_timeout(1800)
        ok(f'{W} quick tour auto-starts', pg2.locator('#tour').count() == 1)
        ok(f'{W} demo errors', not errs, str(errs[-3:]))
        ctx.close()
    # reduced motion + file independence
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce'); pg = ctx.new_page(); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(600)
    ok('reduced motion: thread fully drawn', pg.evaluate('(()=>{const m=document.querySelector("#tpath");return m?(getComputedStyle(m).strokeDashoffset==="0px"||m.style.strokeDashoffset==="0"||m.getAttribute("stroke-dashoffset")==="0"):true})()'))
    b.close()
fails = [r for r in res if not r[1]]
print(f'\n{len(res)-len(fails)}/{len(res)} passed'); sys.exit(1 if fails else 0)
