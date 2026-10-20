// Normal production entry; fresh browser context and synthetic DEMO reports/edits.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183',out=path.resolve(process.env.RESIDENT_LAYOUT_OUTPUT_DIR||'outputs/resident-sidebar'),key='coolcorridor-shade-workflow-v1'
;(async()=>{
  await fs.mkdir(out,{recursive:true})
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[]
    context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
    const resident=await context.newPage(),developer=await context.newPage()
    async function enter(page,role){await page.goto(base+'/');await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${role} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
    const card=objective=>resident.locator(`[data-route-objective="${objective}"]`)
    const ids=async objective=>(await card(objective).getAttribute('data-route-segments')).split(',')
    const sidebar=()=>resident.getByRole('region',{name:'Route planning and comparison',exact:true})
    async function coordinates(page){return page.evaluate(()=>({map:document.querySelector('.campus-map').getBoundingClientRect().toJSON(),viewport:document.querySelector('.campus-map-viewport').getBoundingClientRect().toJSON(),sidebar:document.querySelector('.resident-sidebar')?.getBoundingClientRect().toJSON(),bodyOverflow:document.documentElement.scrollWidth>innerWidth}))}
    async function overlayMatches(objective){assert.deepEqual(await resident.locator('[data-route-overlay-id]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-route-overlay-id'))),await ids(objective))}
    await enter(resident,'Resident')
    assert.equal(await resident.locator('.resident-map-pane').evaluate(el=>getComputedStyle(el).position),'sticky')
    assert.equal(await resident.locator('.campus-map-details').count(),1)
    for(const name of ['Starting point','Destination'])assert.equal(await sidebar().getByLabel(name,{exact:true}).count(),1)
    await resident.getByLabel('Starting point',{exact:true}).selectOption('NORTH-WEST');await resident.getByLabel('Destination',{exact:true}).selectOption('L1-ACCESS')
    const desktop=await coordinates(resident);assert.ok(desktop.map.right<desktop.sidebar.left);assert.ok(Math.abs(desktop.map.top-desktop.sidebar.top)<3);assert.equal(desktop.bodyOverflow,false)
    assert.ok(desktop.viewport.top>=0&&desktop.viewport.bottom<=1000)
    assert.equal(await sidebar().getByRole('region',{name:'Calculated route comparison',exact:true}).count(),1)
    for(const objective of ['shortest','exposure']){await card(objective).click();await overlayMatches(objective)}
    // Wheel over the right column; map position and visible image stay fixed.
    await sidebar().evaluate(el=>el.scrollTop=0);const before=(await coordinates(resident)).map
    await sidebar().hover();await resident.mouse.wheel(0,650)
    await resident.waitForFunction(()=>document.querySelector('.resident-sidebar').scrollTop>100)
    const after=(await coordinates(resident)).map;assert.ok(Math.abs(before.x-after.x)<1&&Math.abs(before.y-after.y)<1)
    await sidebar().evaluate(el=>el.scrollTop=0);await resident.screenshot({path:path.join(out,'01-resident-desktop-split.png')})
    // Developer now opts into its own five-tool layout; Resident styles remain scoped.
    await enter(developer,'Developer')
    assert.equal(await developer.locator('.resident-layout,.resident-sidebar').count(),0);assert.equal(await developer.getByRole('tab').count(),5)
    assert.ok(await developer.locator('.campus-map-viewport').evaluate(el=>el.clientHeight)>0)
    assert.equal(await developer.getByRole('heading',{name:'Edit map shade',exact:true}).count(),1)
    assert.equal(await developer.locator('[data-footfall-rank]').count(),10)
    await developer.locator('.campus-map').screenshot({path:path.join(out,'02-developer-sidebar-map.png')})
    // Published updates still recalculate both route cards in the right column.
    async function chooseRoute(from,to){await developer.getByLabel('Developer route from',{exact:true}).selectOption(from);await developer.getByLabel('Developer route to',{exact:true}).selectOption(to);await developer.getByRole('button',{name:'Add route to selection',exact:true}).click()}
    const oldVersion=await card('exposure').getAttribute('data-route-version')
    await chooseRoute('NORTH-WEST','L-NORTH-WEST');await chooseRoute('L-NORTH-WEST','L1-ACCESS')
    await developer.getByLabel('Shade for selected paths',{exact:true}).selectOption('mostly_shaded');await developer.getByRole('button',{name:'Apply shade to Developer draft',exact:true}).click()
    await developer.getByLabel('Map publication note',{exact:true}).fill('Synthetic layout regression: classify two northern links shaded.')
    await developer.getByRole('checkbox',{name:'I reviewed these DEMO shade changes and want to publish them to Resident routing.',exact:true}).check();await developer.getByRole('button',{name:'Publish to Resident map',exact:true}).click()
    await resident.waitForFunction(old=>document.querySelector('[data-route-objective="exposure"]')?.getAttribute('data-route-version')!==old,oldVersion)
    assert.deepEqual(await ids('shortest'),['DEMO-REF-080']);assert.deepEqual(await ids('exposure'),['DEMO-REF-081','DEMO-REF-082']);await overlayMatches('exposure')
    await sidebar().evaluate(el=>el.scrollTop=0);await resident.screenshot({path:path.join(out,'03-comparison-after-publication.png')})
    // Independent manual map reporting is preserved in the right-hand workflow.
    await resident.getByRole('button',{name:'Choose report points on map',exact:true}).click();await resident.locator('[data-campus-node-id="MAIN-GATE"]').click();await resident.locator('[data-campus-node-id="INNER-GATE"]').click()
    await resident.getByRole('button',{name:'Report selected route',exact:true}).click()
    assert.equal(await resident.getByLabel('Report starting point',{exact:true}).inputValue(),'Pintu Masuk Utama');assert.equal(await resident.getByLabel('Report destination',{exact:true}).inputValue(),'Menara Razak access')
    await resident.getByLabel('Describe the problem',{exact:true}).fill('Synthetic Resident layout check; not a field report.');await resident.getByRole('button',{name:'Submit route report',exact:true}).click()
    assert.equal(await resident.evaluate(k=>JSON.parse(localStorage.getItem(k)).reports.length,key),1);assert.equal(await resident.locator('.campus-report').count(),0)
    // Evidence and source remain accessible without taking the map's place.
    await resident.locator('[data-segment-id="DEMO-REF-001"]').focus();await resident.keyboard.press('Enter')
    assert.equal(await resident.locator('.resident-path-evidence').getAttribute('open'),'')
    await resident.getByRole('button',{name:'Report a route',exact:true}).click();await resident.keyboard.press('Escape')
    await resident.locator('.campus-map-details>summary').click();assert.equal(await resident.locator('.campus-map-source').isVisible(),true);await resident.locator('.campus-map-details>summary').click()
    const sizes=[]
    for(const [width,height] of [[1366,768],[1024,768],[390,844]]){
      await resident.setViewportSize({width,height});await resident.evaluate(()=>scrollTo(0,0));await sidebar().evaluate(el=>el.scrollTop=0)
      const c=await coordinates(resident);assert.equal(c.bodyOverflow,false)
      if(width>=960){assert.ok(c.map.right<c.sidebar.left);assert.ok(c.viewport.bottom<=height);assert.equal(await sidebar().evaluate(el=>getComputedStyle(el).overflowY),'auto')}
      else{assert.ok(c.sidebar.top>=c.map.bottom);assert.equal(await sidebar().evaluate(el=>getComputedStyle(el).overflowY),'visible')}
      sizes.push({width,height,map:c.map,sidebar:c.sidebar})
      await resident.screenshot({path:path.join(out,`04-resident-${width}.png`)})
    }
    await resident.getByRole('link',{name:'Plan a route',exact:true}).click();assert.ok((await resident.locator('#resident-route-controls').boundingBox()).y<80)
    await resident.getByRole('link',{name:'View map',exact:true}).click();assert.ok((await resident.locator('#resident-campus-map').boundingBox()).y<80)
    await resident.getByRole('button',{name:'Zoom in campus map',exact:true}).click();await resident.locator('.campus-map-viewport').focus();await resident.keyboard.press('ArrowRight');await resident.keyboard.press('Home')
    assert.equal(await resident.getByLabel('Campus map zoom',{exact:true}).innerText(),'100%')
    assert.deepEqual(errors,[])
    const results={status:'passed',normalEntry:base+'/',checks:['Resident map left and selectors/comparison right on desktop','right column scrolls independently while map position stays fixed','map image visible within laptop and desktop viewport','shortest and exposure cards select identical overlay segment IDs','publication automatically updates right-side cards and shaded route','manual point-to-point reporting still autofills and submits','Resident report numbers stay hidden','selected-path evidence and map source remain accessible','Developer five-tool layout uses the same image map without Resident style leakage','desktop 1440, laptop 1366, tablet 1024 and mobile390 checked','mobile stacks, jump links reach controls/map, no horizontal overflow','zoom/pan/reset still work'],responsiveSizes:sizes,pageErrors:errors}
    await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2))
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
