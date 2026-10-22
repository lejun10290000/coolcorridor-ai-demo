// Normal production entry; fresh browser storage and synthetic DEMO data only.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183',out=path.resolve(process.env.DEVELOPER_LAYOUT_OUTPUT_DIR||'outputs/developer-sidebar'),key='coolcorridor-shade-workflow-v1'
;(async()=>{
  await fs.mkdir(out,{recursive:true})
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[]
    context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
    const developer=await context.newPage(),resident=await context.newPage(),publisher=await context.newPage()
    async function enter(page,role){await page.goto(base+'/');await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${role} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
    const tab=name=>developer.getByRole('tab',{name:name==='Resident reports'?/^Resident reports/:name,exact:name!=='Resident reports'})
    const scroll=()=>developer.locator('.developer-panel-scroll')
    const stored=()=>developer.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)
    const color=(page,id)=>page.locator(`[data-segment-id="${id}"] .campus-shade-stroke`).getAttribute('stroke')
    async function route(page,from,to){await page.getByLabel('Developer route from',{exact:true}).selectOption(from);await page.getByLabel('Developer route to',{exact:true}).selectOption(to);await page.getByRole('button',{name:'Add route to selection',exact:true}).click()}
    async function publish(page,note){await page.getByLabel('Map publication note',{exact:true}).fill(note);await page.getByRole('checkbox',{name:'I reviewed these DEMO shade changes and want to publish them to Resident routing.',exact:true}).check();await page.getByRole('button',{name:'Publish to Resident map',exact:true}).click()}
    async function coords(){return developer.evaluate(()=>({map:document.querySelector('.campus-map').getBoundingClientRect().toJSON(),pane:document.querySelector('.developer-map-pane').getBoundingClientRect().toJSON(),image:document.querySelector('.campus-map-viewport').getBoundingClientRect().toJSON(),right:document.querySelector('.developer-right-pane').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth}))}
    async function grid(selector){const boxes=await developer.locator(selector).evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().toJSON()));assert.equal(boxes.length,10);assert.equal(new Set(boxes.map(b=>Math.round(b.x))).size,2);for(let i=0;i<10;i+=2){assert.ok(Math.abs(boxes[i].y-boxes[i+1].y)<1);if(i)assert.ok(boxes[i].y>boxes[i-2].y)}return boxes}
    async function gridScreenshot(selector,name,height){const size=developer.viewportSize();await developer.setViewportSize({width:1440,height});await scroll().evaluate(e=>e.scrollTop=0);await developer.locator(selector).screenshot({path:path.join(out,name)});await developer.setViewportSize(size)}
    async function screenshot(name){await developer.evaluate(()=>scrollTo(0,0));await scroll().evaluate(e=>e.scrollTop=0);await developer.screenshot({path:path.join(out,name)})}
    await enter(developer,'Developer')
    assert.equal(await developer.getByRole('tab').count(),5);assert.equal(await tab('Edit shade / publish').getAttribute('aria-selected'),'true')
    const initial=await coords();assert.ok(initial.map.right<initial.right.left);assert.equal(initial.overflow,false);assert.ok(initial.image.bottom<=1000)
    await route(developer,'MAIN-GATE','INNER-GATE');const selected=await developer.getByTestId('developer-selection').getAttribute('data-selected-segments');assert.equal(selected,'DEMO-REF-001')
    await tab('Footfall').click();await tab('Edit shade / publish').click();assert.equal(await developer.getByTestId('developer-selection').getAttribute('data-selected-segments'),selected)
    await developer.getByLabel('Shade for selected paths',{exact:true}).selectOption('mostly_shaded');await developer.getByRole('button',{name:'Apply shade to Developer draft',exact:true}).click()
    await developer.getByLabel('Map publication note',{exact:true}).fill('Synthetic preserved draft note')
    const version=(await stored()).current_version,originalSnapshot=JSON.stringify((await stored()).snapshots[0])
    assert.equal(await color(developer,'DEMO-REF-001'),'#35745A')
    await screenshot('01-edit-shade-publish.png')
    await tab('Budget optimiser').click();assert.equal(await color(developer,'DEMO-REF-001'),'#707580')
    const budgetGrid=await grid('.wf-budget-candidates>[data-footfall-rank]')
    await developer.getByLabel('Shade option for footfall 1',{exact:true}).selectOption('roof')
    await developer.getByRole('button',{name:'Optimise plan',exact:true}).click()
    assert.match(await developer.getByTestId('plan-result').innerText(),/RM 12,700 total/)
    // Right column wheel leaves the map and tab buttons stationary.
    await scroll().evaluate(e=>e.scrollTop=0);const before=await coords(),navBefore=await developer.getByRole('tablist').boundingBox()
    await scroll().hover();await developer.mouse.wheel(0,1000);await developer.waitForFunction(()=>document.querySelector('.developer-panel-scroll').scrollTop>100)
    const after=await coords(),navAfter=await developer.getByRole('tablist').boundingBox();assert.ok(Math.abs(before.map.y-after.map.y)<1);assert.ok(Math.abs(navBefore.y-navAfter.y)<1)
    await developer.locator('.wf-budget-candidates').scrollIntoViewIfNeeded();await developer.screenshot({path:path.join(out,'03-budget-two-column-grid.png')})
    await gridScreenshot('.wf-budget-candidates','03b-budget-two-by-five.png',4000)
    await tab('Footfall').click();const footfallGrid=await grid('.wf-footfall-priorities>.priority');await screenshot('05-footfall-two-column-grid.png')
    await gridScreenshot('.wf-footfall-priorities','05b-footfall-two-by-five.png',2000)
    await developer.locator('.wf-footfall-priorities>.priority').first().click();assert.equal(await developer.locator('[data-segment-id="DEMO-REF-008"]').getAttribute('aria-pressed'),'true')
    assert.equal((await stored()).map_shade_draft.assignments.length,1)
    await tab('Simulated scenario').click();assert.match(await developer.getByTestId('map-view').innerText(),/SIMULATED/)
    assert.equal(await color(developer,'DEMO-REF-008'),'#35745A');assert.equal(await color(developer,'DEMO-REF-001'),'#707580')
    assert.equal((await stored()).current_version,version);assert.equal(JSON.stringify((await stored()).snapshots[0]),originalSnapshot)
    await screenshot('04-simulated-scenario.png')
    await tab('Edit shade / publish').click();assert.equal(await developer.getByLabel('Map publication note',{exact:true}).inputValue(),'Synthetic preserved draft note');assert.equal(await color(developer,'DEMO-REF-001'),'#35745A')
    // A separate Developer publication refreshes an open simulation; draft never leaks.
    await tab('Simulated scenario').click();await enter(publisher,'Developer');await route(publisher,'MAIN-GATE','INNER-GATE')
    await publisher.getByLabel('Shade for selected paths',{exact:true}).selectOption('mixed');await publisher.getByRole('button',{name:'Apply shade to Developer draft',exact:true}).click();await publish(publisher,'Synthetic baseline publication from another tab')
    const newVersion=(await stored()).current_version;assert.notEqual(newVersion,version)
    await developer.getByTestId('scenario-baseline-version').filter({hasText:newVersion}).waitFor();assert.equal(await color(developer,'DEMO-REF-001'),'#BD8B16')
    // Three actual Resident reports, then deliberately unordered creation dates in isolated storage.
    await enter(resident,'Resident')
    await resident.getByRole('button',{name:'Select path on map',exact:true}).click();await resident.locator('[data-campus-node-id="MAIN-GATE"]').focus();await resident.keyboard.press('Enter');await resident.locator('[data-campus-node-id="INNER-GATE"]').focus();await resident.keyboard.press('Enter')
    for(let i=1;i<=3;i++){if(i>1)await resident.getByRole('button',{name:'Report issue ↗',exact:true}).click();await resident.getByRole('button',{name:'Continue to describe →',exact:true}).click();await resident.getByLabel('Describe the problem',{exact:true}).fill(`Synthetic layout report ${i}; not a field observation`);await resident.getByRole('button',{name:'Review report →',exact:true}).click();await resident.getByRole('button',{name:'Submit route report →',exact:true}).click();await resident.getByRole('button',{name:/Back to map/}).click()}
    const reportIds=(await stored()).reports.map(r=>r.report_id),reviewId=reportIds[1]
    await resident.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.reports[0].created_at='2026-10-18T12:00:00+08:00';s.reports[1].created_at='2026-10-20T12:00:00+08:00';s.reports[2].created_at='2026-10-19T12:00:00+08:00';localStorage.setItem(k,JSON.stringify(s))},key)
    await tab('Resident reports').click();await developer.waitForFunction(id=>document.querySelector('.wf-report-inbox [data-report-id]')?.getAttribute('data-report-id')===id,reviewId)
    assert.deepEqual(await developer.locator('.wf-report-inbox [data-report-id]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-report-id'))),[reportIds[1],reportIds[2],reportIds[0]])
    assert.deepEqual((await stored()).reports.map(r=>r.report_id),reportIds)
    const review=developer.locator(`[data-report-id="${reviewId}"]`);await review.getByLabel(`Report review note — ${reviewId}`,{exact:true}).fill('Synthetic review text survives tab changes')
    await tab('Budget optimiser').click();assert.equal(await developer.getByLabel('Shade option for footfall 1',{exact:true}).inputValue(),'roof')
    await developer.getByLabel('Available budget (whole RM)',{exact:true}).fill('1.5');await tab('Simulated scenario').click();assert.match(await developer.getByTestId('map-view').innerText(),/BASELINE/);assert.equal(await developer.locator('.campus-report').count(),0)
    await developer.getByRole('button',{name:'Open budget optimiser',exact:true}).click();await developer.getByLabel('Available budget (whole RM)',{exact:true}).fill('20000')
    await tab('Resident reports').click();assert.equal(await review.getByLabel(`Report review note — ${reviewId}`,{exact:true}).inputValue(),'Synthetic review text survives tab changes')
    await screenshot('02-reports-newest-first.png')
    await review.getByRole('button',{name:'Accept report',exact:true}).click();assert.equal(await color(developer,'DEMO-REF-001'),'#BD8B16')
    await resident.waitForFunction(v=>document.querySelector('[data-route-objective="shortest"]')?.getAttribute('data-route-version')!==v,newVersion);assert.equal(await resident.locator('.campus-report').count(),0)
    // Legacy manual proposal linking and explicit scenario projection stay available.
    await tab('Edit shade / publish').click();await route(developer,'MAIN-GATE','INNER-GATE');await tab('Budget optimiser').click();await developer.locator('.developer-planning-configuration>summary').click()
    await developer.getByLabel('Planning method',{exact:true}).selectOption('manual');await developer.getByRole('button',{name:'Use selected map paths for INT-03',exact:true}).click();await developer.getByRole('button',{name:'Optimise plan',exact:true}).click()
    await tab('Simulated scenario').click();await developer.getByLabel('Simulated shade projection for DEMO-REF-001',{exact:true}).selectOption('mostly_shaded');assert.equal(await color(developer,'DEMO-REF-001'),'#35745A');assert.equal(await color(resident,'DEMO-REF-001'),'#BD8B16')
    await tab('Budget optimiser').click();await developer.getByLabel('Planning method',{exact:true}).selectOption('footfall')
    // Roving tab focus and keyboard activation.
    await tab('Edit shade / publish').click();await tab('Edit shade / publish').focus();await developer.keyboard.press('ArrowRight');assert.equal(await tab('Resident reports').getAttribute('aria-selected'),'true');await developer.keyboard.press('End');assert.equal(await tab('Footfall').getAttribute('aria-selected'),'true');await developer.keyboard.press('Home');assert.equal(await tab('Edit shade / publish').getAttribute('aria-selected'),'true')
    const sizes=[]
    for(const [width,height] of [[1366,768],[1024,768],[390,844]]){
      await developer.setViewportSize({width,height});await developer.evaluate(()=>scrollTo(0,0));const c=await coords();assert.equal(c.overflow,false)
      if(width>=960){assert.ok(c.map.right<c.right.left);assert.ok(c.image.bottom<=height);assert.equal(await scroll().evaluate(e=>getComputedStyle(e).overflowY),'auto')}
      else{assert.ok(c.right.top>=c.pane.bottom);assert.equal(await scroll().evaluate(e=>getComputedStyle(e).overflowY),'visible')}
      for(const name of ['Edit shade / publish','Resident reports','Budget optimiser','Simulated scenario','Footfall']){await tab(name).click();assert.equal(await developer.getByRole('tabpanel').count(),1);assert.equal(await developer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
      await tab('Budget optimiser').click();if(width>=960)await grid('.wf-budget-candidates>[data-footfall-rank]');else assert.equal(await developer.locator('.wf-budget-candidates').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1)
      sizes.push({width,height,map:c.map,right:c.right});await screenshot(`06-developer-${width}.png`);if(width<960){await developer.locator('.developer-right-pane').scrollIntoViewIfNeeded();const toolsBox=await developer.getByRole('tab',{name:'Budget optimiser',exact:true}).boundingBox();assert.ok(toolsBox.y>=0&&toolsBox.y<height);await developer.screenshot({path:path.join(out,'07-mobile-tools.png')})}
    }
    assert.deepEqual(errors,[])
    const results={status:'passed',normalEntry:base+'/',checks:['five accessible tool tabs, default shade editor','map remains left while right tool panel scrolls; tabs stay visible','budget and footfall each form two columns by five rows on desktop','map selection, draft note, treatment choices and report notes persist across tabs','budget/footfall maps exclude drafts; scenarios exclude drafts and never publish','publication from another tab refreshes scenario baseline and inherited shade','Resident reports sorted by actual date descending without mutating stored order','report acceptance still publishes mixed shade and recalculates Resident routes','legacy manual candidate assignment and explicit scenario projections preserved','invalid/unavailable scenario shows baseline with no report markers or draft leakage','keyboard Arrow/Home/End tab navigation','1440,1366,1024 desktop and390 mobile; no horizontal overflow in all five sections','mobile stacks map above tools and cards into one column'],budgetGrid,footfallGrid,responsiveSizes:sizes,pageErrors:errors}
    await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({status:results.status,checks:results.checks,pageErrors:errors},null,2))
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
