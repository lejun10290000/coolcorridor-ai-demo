const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path')
const out=path.resolve(process.env.ALIGNMENT_OUTPUT_DIR||'outputs/alignment-preview')
;(async()=>{
 await fs.mkdir(out,{recursive:true})
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH})
 try{
  const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage(),errors=[],results=[]
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000)
  for(const width of [1868,1440,1280,390]){
   await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:4183/')
   await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:'Enter Developer Mode',exact:true}).click();await page.locator('.campus-map-overlay').waitFor()
   const rect=selector=>page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,width:r.width,client:e.clientHeight,scroll:e.scrollHeight}})
   const map=await rect('.developer-map-pane'),tools=await rect('.developer-right-pane'),intro=await rect('.developer-topbar')
   if(width>980){assert.ok(Math.abs(map.top-tools.top)<1);assert.ok(Math.abs(map.bottom-tools.bottom)<1)}
   if(width>1380){assert.ok(Math.abs(map.top-intro.top)<1);assert.ok(Math.abs(map.bottom-intro.bottom)<1)}
   if(width>980){const source=await rect('.developer-map-pane .campus-map-details');assert.ok(source.bottom<=map.bottom+1,'Closed map information must fit completely inside the stage');assert.ok(map.bottom-source.bottom<20,'Map fills its column without an empty tail');const viewport=await rect('.developer-map-pane .campus-map-viewport');assert.ok(viewport.height>300)}
   const evidence=await rect('.developer-path-evidence')
   assert.ok(evidence.scroll<=evidence.client+2,'Empty evidence content must fit without being cut off')
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
   await page.screenshot({path:path.join(out,`developer-${width}.png`),fullPage:true})
   for(const name of ['Resident reports','Budget optimiser','Simulated scenario','Footfall']){
    await page.getByRole('tab',{name:new RegExp(name)}).click()
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
   }
   await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/Resident/}).click()
   const mode=page.locator('.map-point-mode'),buttons=mode.getByRole('button'),a=await buttons.nth(0).boundingBox(),b=await buttons.nth(1).boundingBox()
   assert.ok(Math.abs(a.y-b.y)<1);assert.ok(Math.abs(a.width-b.width)<1)
   const report=await rect('.resident-report-panel'),pathInfo=await rect('.resident-path-evidence')
   if(width>1000){assert.ok(Math.abs(report.top-pathInfo.top)<1);assert.ok(pathInfo.height<=147,'Closed evidence card has no empty tail')}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
   await page.screenshot({path:path.join(out,`resident-${width}.png`),fullPage:true})
   await page.locator('.resident-path-evidence>summary').click();await page.locator('.resident-evidence-empty').waitFor()
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
   results.push({width,map,tools,intro,report,pathInfo})
  }
  assert.deepEqual(errors,[])
  await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify({status:'passed',results,pageErrors:errors},null,2))
  console.log('Passed alignment, unclipped empty evidence, all Developer tabs, endpoint buttons, disclosure and overflow checks at 1868, 1440, 1280 and 390 px.')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
