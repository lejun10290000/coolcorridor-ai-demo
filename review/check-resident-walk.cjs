// Normal production entry; fresh isolated storage, manual confirmations, no GPS.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183',out=path.resolve(process.env.WALK_OUTPUT_DIR||'outputs/resident-walk'),key='coolcorridor-shade-workflow-v1'
;(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[]
  context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
  const resident=await context.newPage(),developer=await context.newPage()
  async function enter(page,role){await page.goto(base+'/');await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${role} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
  const panel=()=>resident.getByRole('region',{name:'Step-by-step walk',exact:true})
  const card=objective=>resident.locator(`[data-route-objective="${objective}"]`)
  const overlays=()=>resident.locator('[data-route-overlay-id]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-route-overlay-id')))
  async function plan(from,to,objective='shortest'){
   await resident.getByLabel('Starting point',{exact:true}).selectOption(from);await resident.getByLabel('Destination',{exact:true}).selectOption(to);await card(objective).click()
   const ids=(await card(objective).getAttribute('data-route-segments')).split(',')
   await resident.getByRole('button',{name:'Start selected route',exact:true}).click();await panel().waitFor();return ids
  }
  async function position(){return {current:await panel().getAttribute('data-walk-current'),next:await panel().getAttribute('data-walk-next')}}
  async function assertMapPoint(){const p=await position();assert.equal(await resident.locator('[data-walk-point="current"]').getAttribute('data-campus-node-id'),p.current);if(p.next)assert.equal(await resident.locator('[data-walk-point="next"]').getAttribute('data-campus-node-id'),p.next);else assert.equal(await resident.locator('[data-walk-point="next"]').count(),0)}
  await enter(resident,'Resident')
  assert.equal(await resident.getByRole('button',{name:'Start selected route',exact:true}).count(),0)
  await resident.getByLabel('Starting point',{exact:true}).selectOption('PA9-SPUR');await resident.getByLabel('Destination',{exact:true}).selectOption('MAIN-GATE');assert.equal(await resident.getByRole('button',{name:'Start selected route',exact:true}).count(),0)
  const route=await plan('MAIN-GATE','KLINIK-UTM')
  assert.equal(await resident.getByRole('link',{name:'Walk progress',exact:true}).getAttribute('href'),'#resident-walk-progress')
  assert.deepEqual(await overlays(),route);assert.equal(await resident.getByLabel('Starting point',{exact:true}).isDisabled(),true);assert.equal(await resident.getByLabel('Destination',{exact:true}).isDisabled(),true)
  assert.equal(await resident.locator('[data-route-objective]').count(),0);await assertMapPoint()
  const first=await position();assert.equal(first.current,'MAIN-GATE');assert.notEqual(first.next,'MAIN-GATE');await panel().getByText('No reference photo is published for this point. Use its map label to identify it.',{exact:true}).waitFor()
  await resident.locator('[data-campus-node-id="REAR-GATE"]').focus();await resident.keyboard.press('Enter')
  assert.deepEqual(await position(),first);assert.deepEqual(await overlays(),route);assert.equal(await resident.getByLabel('Starting point',{exact:true}).inputValue(),'MAIN-GATE')
  await resident.getByRole('button',{name:'Close point photo panel',exact:true}).click()
  await resident.getByRole('button',{name:'Next',exact:true}).click();await resident.getByRole('button',{name:'Previous point',exact:true}).click();assert.deepEqual(await position(),first)
  const reached=[first.current],photoSteps=[]
  while((await position()).next){
   const p=await position();await assertMapPoint();assert.deepEqual(await overlays(),route)
   if(await panel().locator('img').count()){await panel().locator('img').evaluate(img=>img.decode());photoSteps.push({node:p.next,src:await panel().locator('img').getAttribute('src')});if(p.next==='J-TENNIS')await resident.screenshot({path:path.join(out,'01-resident-next-photo.png')})}
   reached.push(p.next);await resident.getByRole('button',{name:'Next',exact:true}).click()
  }
  assert.equal(reached.length,route.length+1);assert.equal(new Set(reached).size,reached.length);assert.equal(reached.at(-1),'KLINIK-UTM')
  await panel().getByRole('heading',{name:'Destination reached',exact:true}).waitFor();await assertMapPoint();assert.equal(await resident.getByRole('button',{name:'Next',exact:true}).count(),0)
  assert.equal(await panel().getByRole('link',{name:'View destination on map',exact:true}).getAttribute('href'),'#resident-campus-map')
  await resident.screenshot({path:path.join(out,'02-destination-reached.png')});await resident.getByRole('button',{name:'Previous point',exact:true}).click();assert.equal((await position()).next,'KLINIK-UTM');await resident.getByRole('button',{name:'Next',exact:true}).click();await resident.getByRole('button',{name:'Finish walk',exact:true}).click()
  assert.equal(await resident.getByLabel('Starting point',{exact:true}).isEnabled(),true)
  // Most-shaded route must stay fixed across a publication that changes its optimum.
  const locked=await plan('NORTH-WEST','L1-ACCESS','exposure'),lockedVersion=await panel().getAttribute('data-walk-version'),lockedPosition=await position()
  await enter(developer,'Developer');assert.equal(await developer.getByRole('region',{name:'Step-by-step walk',exact:true}).count(),0)
  for(const [from,to] of [['NORTH-WEST','L-NORTH-WEST'],['L-NORTH-WEST','L1-ACCESS']]){await developer.getByLabel('Developer route from',{exact:true}).selectOption(from);await developer.getByLabel('Developer route to',{exact:true}).selectOption(to);await developer.getByRole('button',{name:'Add route to selection',exact:true}).click()}
  await developer.getByLabel('Shade for selected paths',{exact:true}).selectOption('mostly_shaded');await developer.getByRole('button',{name:'Apply shade to Developer draft',exact:true}).click();await developer.getByLabel('Map publication note',{exact:true}).fill('Synthetic walkthrough lock test.');await developer.getByRole('checkbox',{name:'I reviewed these DEMO shade changes and want to publish them to Resident routing.',exact:true}).check();await developer.getByRole('button',{name:'Publish to Resident map',exact:true}).click()
  await panel().getByText('A newer map is published. This walk keeps your selected route and map version. Exit to compare routes using the latest map.',{exact:true}).waitFor()
  assert.deepEqual(await overlays(),locked);assert.deepEqual(await position(),lockedPosition);assert.equal(await panel().getAttribute('data-walk-version'),lockedVersion)
  for(const id of locked)assert.equal(await resident.locator(`[data-route-overlay-id="${id}"]`).getAttribute('data-route-version'),lockedVersion)
  await resident.screenshot({path:path.join(out,'03-published-map-route-lock.png')});await resident.getByRole('button',{name:'Exit walk / change route',exact:true}).click()
  const recalculated=(await card('exposure').getAttribute('data-route-segments')).split(',');assert.notDeepEqual(recalculated,locked);assert.notEqual(await card('exposure').getAttribute('data-route-version'),lockedVersion)
  // Reverse route and single-link completion on phone; photo belongs to the next point.
  await resident.setViewportSize({width:390,height:844});const mobileRoute=await plan('KLINIK-UTM','MAIN-GATE')
  await panel().scrollIntoViewIfNeeded();assert.equal(await resident.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await resident.screenshot({path:path.join(out,'04-mobile-walk.png')})
  await resident.getByRole('button',{name:'Next',exact:true}).click();assert.deepEqual(await overlays(),mobileRoute)
  await resident.getByRole('button',{name:'Exit walk / change route',exact:true}).click()
  await plan('INNER-GATE','MAIN-GATE');assert.ok((await panel().locator('img').getAttribute('src')).endsWith('/main-gate.jpg'));await resident.getByRole('button',{name:'Next',exact:true}).click();await resident.getByRole('button',{name:'Finish walk',exact:true}).click()
  // Leaving/reloading is an explicit session boundary; persistent report/shade data survives.
  const stored=await resident.evaluate(k=>localStorage.getItem(k),key);await plan('MAIN-GATE','INNER-GATE');await enter(resident,'Resident');assert.equal(await panel().count(),0);assert.equal(await resident.evaluate(k=>localStorage.getItem(k),key),stored)
  assert.deepEqual(errors,[])
  const result={status:'passed',normalEntry:base+'/',mainGateToKlinikPoints:reached,photoSteps,lockedMostShadedBefore:locked,recalculatedAfterExit:recalculated,checks:['no start for missing/disconnected routes','chosen overlay stays fixed; endpoint and objective controls locked','every graph point in order, including internal corridors and destination','matching reference photo or honest missing-photo state','map clicks do not change route or manual progress','Next, Previous, arrival and Finish semantics','Developer shade publication cannot reroute active walk or alter its map version','exit recalculates most shaded using latest baseline','Developer workspace has no walkthrough UI','phone reverse route, single-link arrival and zero horizontal overflow','refresh ends only session progress; persistent shade/report state preserved'],pageErrors:errors}
  await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
