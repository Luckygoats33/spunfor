"""Spunfor e2e (Playwright + system Chrome), v4. Serve the site first:
   python3 -m http.server 8433 --bind 127.0.0.1 --directory <repo>
   python3 tests/e2e.py [outdir]
Covers landing, chat, preview, unlock modal, promo + TEST checkout, and the demo app (a faithful copy of NOLA V3) at 390 and 1280."""
import sys, os, re
from playwright.sync_api import sync_playwright
BASE = os.environ.get('E2E_BASE', 'http://127.0.0.1:8433/')
OUT = sys.argv[1] if len(sys.argv) > 1 else '/workspace/spunfor-shots/v4'
os.makedirs(OUT, exist_ok=True)
ANS = ['Delta 1234 MSY, arrives Sat 10:30am', '12 Mar to 15 Mar', 'New Orleans', 'jazz, beignets, history, hidden gems', 'loud Bourbon Street party crowds', '$$ moderate', '2 adults, birthday trip', 'vegetarian options']
ANS_TEXT = 'Going to New Orleans, 12 Mar to 15 Mar.'
ANS_FOLLOW = {'flight': 'Delta 1234 MSY, arrives Sat 10:30am', 'likes': 'jazz, beignets, history, hidden gems', 'dislikes': 'loud Bourbon Street party crowds', 'budget': '$$ moderate', 'group': '2 adults, birthday trip', 'needs': 'vegetarian options'}
def intake(pg, text, follow=None, build=True):
    pg.wait_for_selector('#tripText'); pg.fill('#tripText', text); pg.wait_for_timeout(450)
    for k, v in (follow or {}).items():
        if pg.locator(f'#mf-{k}').count(): pg.fill(f'#mf-{k}', v)
    if build: pg.click('#buildBtn')
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
        lt=pg.inner_text('main').lower(); ok(f'{W} landing both audiences + pricing', '$29.99' in lt and 'from $299' in lt and 'vacation planners' in lt and 'travelers' in lt and '$9.99' not in lt)
        ok(f'{W} planners section NOT on home', pg.locator('#planners').count()==0 and pg.locator('#talkBtn').count()==0 and 'planning trips for clients' not in lt)
        ok(f'{W} no preview section on home', pg.locator('#result').count()==0 and 'spun together from your answers' not in lt)
        ok(f'{W} SaaS nav tab visible and inside viewport', pg.evaluate("(()=>{const r=document.querySelector('nav a.saas-tab').getBoundingClientRect();return r.width>20&&r.left>=0&&r.right<=innerWidth})()"))
        ok(f'{W} SaaS nav tab opens new tab', pg.locator('nav a.saas-tab[target=_blank][rel~=noopener]').count()==1 and pg.inner_text('nav a.saas-tab').strip()=='SaaS')
        sp = ctx.new_page(); sp.goto(BASE + 'saas.html'); sp.wait_for_timeout(900); sp.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
        ok(f'{W} saas page content', 'from $299' in sp.inner_text('main') and 'Planning trips for clients' in sp.inner_text('main') and sp.locator('nav a.saas-tab[target=_blank]').count()==1)
        ok(f'{W} all demo links on home/saas open new tab', pg.evaluate("[...document.querySelectorAll('a[href*=\"demo/index.html\"]')].every(a=>a.target=='_blank'&&/noopener/.test(a.rel))") and sp.evaluate("[...document.querySelectorAll('a[href*=\"demo/index.html\"]')].every(a=>a.target=='_blank')"))
        ok(f'{W} demo iframe embeds demo/index.html unchanged', pg.get_attribute('#demoIframe','src')=='demo/index.html')
        ok(f'{W} open-in-new-window link', pg.get_attribute('#demoNew','href')=='demo/index.html' and pg.get_attribute('#demoNew','target')=='_blank' and 'noopener' in pg.get_attribute('#demoNew','rel'))
        pg.locator('#demo').scroll_into_view_if_needed(); pg.wait_for_timeout(900)
        fw = lambda: pg.evaluate("document.getElementById('demoFrame').getBoundingClientRect().width")
        sec_w = pg.evaluate("document.querySelector('#app .wrap').getBoundingClientRect().width")
        if W >= 1000:
            pg.click('#segDesktop'); pg.wait_for_timeout(500); dw = fw()
            ok(f'{W} desktop toggle: frame spans section, chrome bar visible', dw > 800 and abs(dw - sec_w) < 140 and pg.is_visible('#demoFrame .chrome') and pg.get_attribute('#segDesktop','aria-pressed')=='true' and pg.get_attribute('#segMobile','aria-pressed')=='false', f'{dw} vs {sec_w}')
            pg.screenshot(path=f'{OUT}/demo-desktop-{tag}.png')
            pg.focus('#segMobile'); pg.keyboard.press('Enter'); pg.wait_for_timeout(500); mw = fw()
            ok(f'{W} mobile toggle (keyboard) narrows frame to ~390', 330 <= mw <= 420 and pg.get_attribute('#segMobile','aria-pressed')=='true', str(mw))
            ok(f'{W} demo iframe renders', pg.frame_locator('#demoIframe').locator('body').count() == 1)
            pg.screenshot(path=f'{OUT}/demo-mobile-{tag}.png')
        else:
            ok(f'{W} phone: mobile view only, Desktop disabled', pg.is_disabled('#segDesktop') and pg.get_attribute('#segMobile','aria-pressed')=='true' and fw() <= W, str(fw()))
            pg.screenshot(path=f'{OUT}/demo-mobile-{tag}.png')
        ok(f'{W} demo section no hscroll', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        ok(f'{W} honest how-it-works copy', 'Three quick steps' in pg.inner_text('#how') and 'spins' not in pg.inner_text('main').lower().replace('spun',''))
        sp.click('#talkBtn'); ok(f'{W} talk form placeholder marked', 'PLACEHOLDER' in sp.inner_text('#talk') and 'mailto:' in sp.get_attribute('#tMail','href'))
        sp.close()
        pg.screenshot(path=f'{OUT}/landing-full-{tag}.png', full_page=True)
        ok(f'{W} landing contrast', not (c := pg.evaluate(CONTRAST)), str(c))
        intake(pg, ANS_TEXT, ANS_FOLLOW, build=False)
        ok(f'{W} composer chips: New Orleans + resolved dates', 'New Orleans' in pg.inner_text('#chips') and '2027' not in pg.inner_text('#chips') and '→' in pg.inner_text('#chips'), pg.inner_text('#chips'))
        pg.locator('#chat').scroll_into_view_if_needed(); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/chat-{tag}.png')
        pg.click('#buildBtn')
        home = pg
        pg = pgs[-1] if (pgs := [x for x in ctx.pages if 'preview.html' in x.url]) else None
        for _ in range(30):
            if pg: break
            pg = next((x for x in ctx.pages if 'preview.html' in x.url), None); home.wait_for_timeout(200)
        ok(f'{W} intake opens preview in NEW tab', pg is not None and pg is not home and 'index.html' in home.url, str([x.url for x in ctx.pages]))
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.wait_for_selector('#unlockBtn', timeout=15000)
        pt = pg.inner_text('#result')
        ok(f'{W} preview fields separate (no copying)', 'Delta 1234 MSY' in pt and 'vegetarian options' in pt and pg.evaluate("[...document.querySelectorAll('.spec dd')].map(e=>e.textContent).filter((v,i,a)=>a.indexOf(v)!=i).length")==0)
        ok(f'{W} sample trip note for New Orleans', 'sample new orleans trip' in pg.inner_text('#honestNote').lower())
        ok(f'{W} no None given / Not specified', not re.search('none given|not specified', pt, re.I))
        pg.screenshot(path=f'{OUT}/preview-{tag}.png')
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
        intake(p2, ANS_TEXT, ANS_FOLLOW)
        for _ in range(30):
            q2 = next((x for x in c2.pages if 'preview.html' in x.url), None)
            if q2: break
            p2.wait_for_timeout(200)
        p2 = q2; p2.wait_for_selector('#unlockBtn'); p2.wait_for_timeout(1900); p2.wait_for_selector('#promo'); p2.fill('#promo', 'GOAT'); p2.click('#applyPromo'); p2.wait_for_selector('#freeBtn'); ok(f'{W} goat promo makes it free', '$0.00' in p2.inner_text('#modal'))
        p2.click('#freeBtn'); p2.wait_for_selector('#openApp', timeout=8000); ok(f'{W} goat goes straight to success (no payment screen)', p2.locator('#cn').count() == 0)
        c2.close()
        ok(f'{W} landing/chat/modal errors', not errs, str(errs))
        # ---- demo app: faithful V3 copy ----
        ok(f'{W} Open my app is target=_blank', pg.get_attribute('#openApp','target')=='_blank' and 'noopener' in pg.get_attribute('#openApp','rel'))
        with ctx.expect_page() as npi: pg.click('#openApp')
        pg = npi.value; pg.wait_for_url('**/demo/index.html*'); pg.on('pageerror', lambda e: errs.append(str(e))); pg.evaluate("localStorage.setItem('nola3-tour-done','1')"); pg.reload(); pg.wait_for_timeout(1800)
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
        vb = pg.inner_text('body'); pg.click('[data-open] >> nth=-1'); pg.wait_for_timeout(700); shot('venue'); ok(f'{W} venue sheet', pg.inner_text('body') != vb);
        pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
        if pg.locator('#sheet-root .close').count(): pg.locator('#sheet-root .close').first.click(); pg.wait_for_timeout(300)
         # time-of-day dependent list, so open whichever venue is shown pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
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
    # Portland intake, long single sentence, popup blocked fallback, empty optional fields
    for blocked in (False, True):
        ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page()
        if blocked: pg.add_init_script("window.open=function(){return null}")
        pg.goto(BASE + 'index.html'); pg.wait_for_timeout(900)
        intake(pg, 'We fly Alaska AS 123 into PDX on Friday. We are going to Portland, OR from Oct 3 to Oct 7. I love coffee, bookstores and food carts. I want to avoid crowds and early mornings. We need vegetarian options.')
        pv = None
        for _ in range(40):
            pv = next((x for x in ctx.pages if 'preview.html' in x.url), None)
            if pv: break
            pg.wait_for_timeout(200)
        tagp = 'blocked' if blocked else 'popup'
        ok(f'portland {tagp}: preview opened ' + ('same tab (popup blocked fallback)' if blocked else 'in new tab'), pv is not None and ((pv is pg) if blocked else (pv is not pg)))
        pv.wait_for_selector('#unlockBtn'); pt = pv.inner_text('#result'); dd = pv.evaluate("Object.fromEntries([...document.querySelectorAll('.spec dl > div')].map(d=>[d.querySelector('dt').textContent,d.querySelector('dd').textContent]))")
        ok(f'portland {tagp}: fields separated', dd.get('Flight','').lower().startswith('we fly alaska') and 'vegetarian' in dd.get('Needs','').lower() and 'vegetarian' not in dd.get('Flight','').lower() and 'coffee' in dd.get('Likes','').lower() and 'coffee' not in dd.get('Flight','')+dd.get('Needs','') and 'crowds' in dd.get('Avoid','') and 'crowds' not in dd.get('Likes',''), str(dd))
        ok(f'portland {tagp}: honesty note (starter plan, venue data to come)', 'Starter plan' in pv.inner_text('#honestNote') and 'Portland' in pv.inner_text('#honestNote') and 'venue data' in pv.inner_text('#honestNote'), pv.inner_text('#honestNote'))
        ok(f'portland {tagp}: empty fields omitted', not re.search('none given|not specified|Budget|Group', pt))
        pv.screenshot(path=f'{OUT}/preview-portland-{tagp}.png')
        pv.wait_for_timeout(1700); pv.fill('#promo','goat'); pv.click('#applyPromo'); pv.click('#freeBtn'); pv.wait_for_selector('#openApp', timeout=8000)
        ok(f'portland {tagp}: modules/theme saved for demo', pv.evaluate('!!localStorage.getItem("spunfor.modules")&&!!localStorage.getItem("spunfor.theme")'))
        ctx.close()
    # ---- ITEM 4: single-box intake with live chips ----
    def compose(text, follow=None, build=False):
        c = b.new_context(viewport={'width': 390, 'height': 844}); q = c.new_page(); q.add_init_script("window.open=function(){return {closed:false}}"); q.add_init_script("window.__spunforToday='2026-10-15T12:00:00'")
        q.goto(BASE + 'index.html'); q.wait_for_timeout(600); intake(q, text, follow, build=build)
        chips = q.evaluate("Object.fromEntries([...document.querySelectorAll('#chips .chip[data-edit]')].map(c=>[c.dataset.edit,c.textContent.replace(/^[^ ]+( [^ ]+)? ?/,'')]))")
        return c, q, chips
    def vals(q): return q.evaluate("window.SpunforIntake.values()")
    c, q, ch = compose('leaving friday to portland til sunday')
    v = vals(q)
    ok('composer "leaving friday to portland til sunday": Portland, OR + Fri Oct 16 -> Sun Oct 18 (today 2026-10-15)', v.get('dest') == 'Portland, OR' and 'flight' not in v and 'Fri Oct 16 → Sun Oct 18' in q.inner_text('#chips'), str(v) + q.inner_text('#chips'))
    ok('composer: follow-ups only for what is missing (no dest/dates row, has likes/avoid/budget/group/needs)', q.locator('#mf-dest').count() == 0 and q.locator('#mf-dates').count() == 0 and all(q.locator(f'#mf-{k}').count() == 1 for k in ('likes', 'dislikes', 'budget', 'group', 'needs')))
    ok('composer: launch city note shown', 'launch city' in q.inner_text('#destNote'))
    q.screenshot(path=f'{OUT}/intake-chips-390.png')
    q.click('#chips [data-edit=dest]'); q.wait_for_selector('#chipEdit'); ok('composer: chip tap opens editor prefilled', q.input_value('#chipEdit') == 'Portland, OR')
    q.fill('#chipEdit', 'seattle'); q.press('#chipEdit', 'Enter'); q.wait_for_timeout(300)
    ok('composer: edited chip -> Seattle (validated launch city), survives further typing', 'Seattle, WA' in q.inner_text('#chips'))
    q.fill('#tripText', 'leaving friday to portland til sunday and we love jazz'); q.wait_for_timeout(450)
    ok('composer: edited destination is not overwritten by new typing, likes added live', 'Seattle, WA' in q.inner_text('#chips') and 'jazz' in q.inner_text('#chips'))
    q.click('#chips [data-edit=dates]'); q.wait_for_selector('#chipEdit'); q.click('#chips [data-rm=dates]'); q.wait_for_timeout(200)
    ok('composer: chip can be removed (dates row comes back as a follow-up)', 'Dates' not in q.inner_text('#chips') and q.locator('#mf-dates').count() == 1)
    c.close()
    c, q, ch = compose('We fly Alaska AS 123 into PDX on Friday. We are going to Portland, OR from Oct 3 to Oct 7. I love coffee, bookstores and food carts. I want to avoid crowds and early mornings. We need vegetarian options.')
    v = vals(q)
    ok('composer long sentence: every field only its own part', v.get('flight', '').startswith('We fly Alaska') and v.get('dest') == 'Portland, OR' and v.get('likes') == 'coffee, bookstores and food carts' and v.get('dislikes') == 'crowds and early mornings' and v.get('needs') == 'Vegetarian options', str(v))
    ok('composer long sentence: dates Oct 3-7 resolved to the next occurrence (2027, year rollover)', 'Sun Oct 3 → Thu Oct 7' in q.inner_text('#chips'), q.inner_text('#chips'))
    ok('composer long sentence: only budget and group asked', q.locator('#more .mrow').count() == 2 and q.locator('#mf-budget').count() == 1 and q.locator('#mf-group').count() == 1)
    c.close()
    c, q, ch = compose('pdx next weekend'); v = vals(q)
    ok('composer "pdx next weekend": Portland, OR + Fri Oct 23 -> Sun Oct 25', v.get('dest') == 'Portland, OR' and 'Fri Oct 23 → Sun Oct 25' in q.inner_text('#chips'), q.inner_text('#chips'))
    c.close()
    c, q, ch = compose('a week in June in Reykjavik'); v = vals(q)
    ok('composer unknown city accepted but flagged "not yet supported", dates TBD', v.get('dest') == 'Reykjavik' and 'not yet supported' in q.inner_text('#destNote') and 'A week in Jun' in q.inner_text('#chips'), q.inner_text('#destNote') + q.inner_text('#chips'))
    q.screenshot(path=f'{OUT}/intake-unknown-390.png'); c.close()
    c, q, ch = compose('idk'); ok('composer "idk": no chips, destination row required', q.locator('#chips .chip').count() == 0 and q.locator('#mf-dest').count() == 1)
    q.click('#buildBtn'); q.wait_for_timeout(300); ok('composer: Build without a destination is blocked with a clear message', 'destination' in q.inner_text('#buildMsg').lower() and q.evaluate("document.activeElement.id") == 'mf-dest')
    q.fill('#mf-dest', 'pdx'); q.click('#buildBtn'); q.wait_for_timeout(500)
    import json as _j
    trip = _j.loads(q.evaluate("localStorage.getItem('spunfor.trip')") or '{}')
    ok('composer: typed destination "pdx" validated to Portland, OR and saved', trip.get('dest') == 'Portland, OR' and trip.get('cityKnown') is True, str(trip))
    c.close()
    c, q, ch = compose('   '); q.click('#buildBtn'); q.wait_for_timeout(200); ok('composer empty input: nothing built, friendly message', 'tell us' in q.inner_text('#buildMsg').lower() and not q.evaluate("localStorage.getItem('spunfor.trip')")); c.close()
    c, q, ch = compose('lving fri 2 portland thru sun w/ my wife'); v = vals(q)
    ok('composer typos/lowercase ("lving fri 2 portland thru sun w/ my wife")', v.get('dest') == 'Portland, OR' and 'Fri Oct 16 → Sun Oct 18' in q.inner_text('#chips') and 'wife' in v.get('group', ''), str(v)); c.close()
    c, q, ch = compose('trip to Austin Oct 20-25 with the kids, budget is $150/day', build=True)
    trip = _j.loads(q.evaluate("localStorage.getItem('spunfor.trip')") or '{}')
    ok('composer: build saves resolved start/end/label + validated city', trip.get('dest') == 'Austin, TX' and trip.get('start') == '2026-10-20' and trip.get('end') == '2026-10-25' and trip.get('dateLabel') == 'Tue Oct 20 → Sun Oct 25' and trip.get('budget') == '$150/day', str(trip)); c.close()
    for w in (390, 320):
        c = b.new_context(viewport={'width': w, 'height': 700}); q = c.new_page(); q.goto(BASE + 'index.html'); q.wait_for_timeout(500); intake(q, 'We fly Alaska AS 123 into PDX on Friday. Going to Portland, OR Oct 3 to Oct 7. I love coffee, bookstores and food carts. Avoid crowds.', build=False)
        q.wait_for_timeout(1300)
        ok(f'{w} composer with chips + follow-ups: no hscroll', q.evaluate('document.documentElement.scrollWidth<=innerWidth'), str(q.evaluate('document.documentElement.scrollWidth')))
        q.evaluate("document.querySelector('.bp').scrollIntoView()"); q.screenshot(path=f'{OUT}/intake-chips-{w}.png'); c.close()
    # ---- ITEM 1 + 3: personalized trip app, theme + modules + sections ----
    import json as _j2
    def seed(pg, trip, extra=None):
        pg.goto(BASE + 'index.html'); pg.evaluate("t=>{localStorage.clear();localStorage.setItem('spunfor.trip',JSON.stringify(t))}", trip)
        for k, v in (extra or {}).items(): pg.evaluate("([k,v])=>localStorage.setItem('spunfor.'+k,JSON.stringify(v))", [k, v])
    PDX = {'dest': 'Portland, OR', 'dates': 'Fri to Sun', 'start': '2026-10-23', 'end': '2026-10-25', 'dateLabel': 'Fri Oct 23 → Sun Oct 25', 'likes': 'coffee, bookstores, food carts, jazz', 'dislikes': 'crowds', 'budget': 'mid-range', 'group': '2 adults', 'needs': 'vegetarian options'}
    for W, H in ((1280, 800), (390, 844), (320, 700)):
        c = b.new_context(viewport={'width': W, 'height': H}); q = c.new_page(); errs2 = []
        q.on('pageerror', lambda e: errs2.append(str(e)))
        seed(q, PDX); q.goto(BASE + 'trip.html'); q.wait_for_selector('#tripTitle'); q.wait_for_timeout(1200)
        ok(f'{W} app: title uses city, dates + group shown', q.inner_text('#tripTitle') == 'Portland, OR' and 'Fri Oct 23 → Sun Oct 25' in q.inner_text('.facts') and '2 adults' in q.inner_text('.facts'))
        ok(f'{W} app: honesty note names the city', 'Starter plan: add real places as we build out Portland' in q.inner_text('#starterNote'))
        ok(f'{W} app: 3 days x 3 slots from date range', q.locator('.day').count() == 3 and q.locator('.slot').count() == 9 and 'Sun Oct 25' in q.inner_text('.day >> nth=2'))
        pr = q.inner_text('#sec-itinerary').lower()
        ok(f'{W} app: slot prompts come from likes (coffee, bookstore, food cart, live music)', 'coffee spot' in pr and 'bookstore' in pr and 'food cart' in pr and 'live music' in pr)
        ok(f'{W} app: guardrails show avoid/budget/group/needs', all(x in q.inner_text('#guards').lower() for x in ('crowds', 'mid-range', '2 adults', 'vegetarian')))
        ok(f'{W} app: checklist seeded from needs', 'vegetarian' in q.inner_text('#checklist').lower())
        ok(f'{W} app: Google Maps links search-only, new tab, include city', q.evaluate("[...document.querySelectorAll('.slot .links a')].every(a=>a.target=='_blank'&&/noopener/.test(a.rel)&&a.href.startsWith('https://www.google.com/maps/search/')&&decodeURIComponent(a.href).includes('Portland'))"))
        ok(f'{W} app: map renders for Portland', q.locator('#map.leaflet-container').count() == 1)
        ok(f'{W} app: no hscroll', q.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        if W == 390:
            q.screenshot(path=f'{OUT}/app-portland-{W}.png', full_page=True)
            q.locator('[data-check]').first.check(); q.fill('#notes', 'book Powell Street dinner'); q.locator('.slot form input').first.fill('My coffee pick'); q.locator('.slot form button').first.click(); q.wait_for_timeout(200)
            q.reload(); q.wait_for_selector('#tripTitle'); q.wait_for_timeout(500)
            ok('app: edits persist (check, note, own place) after reload', q.locator('[data-check]').first.is_checked() and q.input_value('#notes') == 'book Powell Street dinner' and 'My coffee pick' in q.inner_text('.places'))
            # item 3: theme
            def acc(): return q.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()")
            base = acc(); q.click('[data-theme=generic]'); g = acc(); q.click('[data-theme=custom]'); q.evaluate("(()=>{const i=document.getElementById('accent');i.value='#0a7a3c';i.dispatchEvent(new Event('input',{bubbles:true}))})()"); cu = acc()
            ok('theme picker changes CSS variables in the app', g == '#1d4ed8' and base != g and cu != g and cu != base, f'{base} {g} {cu}')
            ok('theme saved to spunfor.theme', _j2.loads(q.evaluate("localStorage.getItem('spunfor.theme')"))['mode'] == 'custom')
            q.click('[data-theme=city]'); ok('theme city restores palette', acc() == base)
            # item 3: modules
            ok('module Nightlife on: music + bars prompts and explore card present', 'live music' in q.inner_text('#sec-itinerary').lower() and q.locator('#explore [data-mod="Nightlife"]').count() == 1)
            q.uncheck('[data-mod-toggle="Nightlife"]'); q.wait_for_timeout(200)
            ok('toggling Nightlife off removes explore card and music prompts from DOM', q.locator('#explore [data-mod="Nightlife"]').count() == 0 and 'live music' not in q.inner_text('#sec-itinerary').lower() and 'Nightlife' not in _j2.loads(q.evaluate("localStorage.getItem('spunfor.modules')")))
            q.uncheck('[data-sec-toggle=map]'); q.wait_for_timeout(200)
            ok('sections toggle hides the map section', not q.is_visible('#sec-map') and not q.locator('#tabs [data-go=sec-map]').count())
            q.uncheck('[data-sec-toggle=notes]'); q.uncheck('[data-sec-toggle=checklist]'); q.wait_for_timeout(200)
            ok('sections toggles hide notes and checklist', not q.is_visible('#sec-notes') and not q.is_visible('#sec-checklist'))
            q.reload(); q.wait_for_selector('#tripTitle'); ok('sections + modules persist after reload', not q.is_visible('#sec-map') and q.locator('#explore [data-mod="Nightlife"]').count() == 0)
            q.check('[data-sec-toggle=map]'); q.wait_for_timeout(300); q.screenshot(path=f'{OUT}/app-customize-{W}.png')
        else:
            q.screenshot(path=f'{OUT}/app-portland-{W}.png', full_page=(W == 1280))
        ok(f'{W} app: no page errors', not errs2, str(errs2))
        c.close()
    c = b.new_context(viewport={'width': 390, 'height': 844}); q = c.new_page()
    seed(q, {'dest': 'Reykjavik', 'dates': '3 days', 'likes': 'hot springs'}); q.goto(BASE + 'trip.html'); q.wait_for_selector('#tripTitle'); q.wait_for_timeout(600)
    ok('unknown city: map-less state + not-launch-city flag, still a starter plan', q.locator('#map').count() == 0 and q.locator('#nomap').count() == 1 and 'launch city' in q.inner_text('#unsupported') and q.locator('.day').count() == 3 and 'hot springs' in q.inner_text('#sec-itinerary').lower())
    q.screenshot(path=f'{OUT}/app-unknown-390.png', full_page=True)
    seed(q, {'dest': 'New Orleans', 'dates': 'Fri to Sun', 'likes': 'jazz'}); q.goto(BASE + 'trip.html'); q.wait_for_selector('#tripTitle')
    ok('New Orleans: links to the real V3 demo in a new tab', q.get_attribute('#nolaLink', 'href') == 'demo/index.html#home' and q.get_attribute('#nolaLink', 'target') == '_blank')
    seed(q, {}); q.goto(BASE + 'trip.html'); q.wait_for_timeout(300); ok('app with no trip: friendly empty state', 'No trip yet' in q.inner_text('main'))
    # unlock flow routes to the right app
    for dest, want in (('Portland, OR', 'trip.html'), ('New Orleans', 'demo/index.html#home')):
        seed(q, {'dest': dest, 'dates': 'Fri to Sun', 'likes': 'coffee'}); q.goto(BASE + 'preview.html'); q.wait_for_selector('#unlockBtn'); q.wait_for_timeout(1700)
        ok(f'preview modal has 4 section toggles ({dest})', q.locator('input[name=sec]').count() == 4)
        q.uncheck('input[name=sec][value=notes]'); q.fill('#promo', 'goat'); q.click('#applyPromo'); q.click('#freeBtn'); q.wait_for_selector('#openApp', timeout=9000)
        ok(f'Open my app for {dest} -> {want} in new tab', q.get_attribute('#openApp', 'href') == want and q.get_attribute('#openApp', 'target') == '_blank')
        ok(f'unlock saves sections ({dest})', _j2.loads(q.evaluate("localStorage.getItem('spunfor.sections')")).get('notes') is False)
        if want == 'trip.html':
            with c.expect_page() as npi: q.click('#openApp')
            ap = npi.value; ap.wait_for_selector('#tripTitle'); ap.wait_for_timeout(400)
            ok('unlock then Open my app lands on personalized app with notes section off', ap.inner_text('#tripTitle') == 'Portland, OR' and not ap.is_visible('#sec-notes'))
            ap.close()
    # does the V3 demo respond? (it is byte-identical; its own built-in spunfor.theme / spunfor.modules layer is what is read)
    seed(q, {'dest': 'New Orleans'}, {'theme': {'mode': 'generic', 'accent': '#E4572E'}, 'modules': ['Nature'], 'sections': {}})
    q.add_init_script("localStorage.setItem('nola3-tour-done','1')"); q.goto(BASE + 'demo/index.html'); q.wait_for_timeout(1500)
    ok('V3 demo reads spunfor.theme (generic) and spunfor.modules (hides unselected module entry points)', q.get_attribute('html', 'data-spun-theme') == 'generic' and q.locator('style#spun-modules').count() == 1 and q.evaluate("getComputedStyle(document.querySelector('[data-tab=ink]')).display") == 'none')
    c.close()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce'); pg = ctx.new_page(); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(600)
    ok('reduced motion: animations off', pg.evaluate('getComputedStyle(document.querySelector(".badge-ring")).animationName')=='none' and pg.evaluate('getComputedStyle(document.querySelector(".reveal")).opacity')=='1')
    b.close()
fails = [r for r in res if not r[1]]
print(f'\n{len(res)-len(fails)}/{len(res)} passed'); sys.exit(1 if fails else 0)
