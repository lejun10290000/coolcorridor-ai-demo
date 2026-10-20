// Normal production entry: shared live legend and unchanged native coordinate alignment.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183',out=path.resolve(process.env.MAP_INFO_OUTPUT_DIR||'outputs/map-information')
;(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),errors=[]
  context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
  const resident=await context.newPage(),developer=await context.newPage()
  async function enter(page,role){await page.goto(base+'/');await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${role} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
  async function aligned(page){
   const value=await page.evaluate(()=>{
    const scene=document.querySelector('.campus-map-scene'),img=scene.querySelector('img'),svg=scene.querySelector('svg'),r=img.getBoundingClientRect(),clip=scene.getBoundingClientRect()
    const errors=[['MAIN-GATE',216,922],['KLINIK-UTM',747,317],['PARKING-SOUTH',623,1164],['REAR-GATE',977,456]].map(([id,x,y])=>{const m=svg.querySelector(`[data-campus-node-id="${id}"]`).getScreenCTM();return Math.max(Math.abs((m.e-r.x)/r.width*1113-x),Math.abs((m.f-r.y)/r.height*1414-y))})
    return {maxError:Math.max(...errors),viewBox:svg.getAttribute('viewBox'),natural:[img.naturalWidth,img.naturalHeight],cropHeight:Number(scene.dataset.mapVisibleHeight),overflow:getComputedStyle(scene).overflow,clipEnd:(clip.bottom-r.top)/r.height*1414,pageOverflow:document.documentElement.scrollWidth>innerWidth}
   })
   assert.equal(value.viewBox,'0 0 1113 1414');assert.deepEqual(value.natural,[1113,1413]);assert.ok(value.maxError<.01);assert.equal(value.cropHeight,1224);assert.equal(value.overflow,'hidden');assert.ok(Math.abs(value.clipEnd-1224)<.1);assert.equal(value.pageOverflow,false);return value
  }
  await enter(resident,'Resident');await enter(developer,'Developer')
  const measurements=[]
  for(const page of [resident,developer]){
   const key=page.getByLabel('Campus map key',{exact:true});await key.waitFor();const labels=await key.innerText();for(const text of ['Unshaded','Mixed shade','Fully shaded','Unknown / needs survey','Purple outline','photo available','From:','To:'])assert.ok(labels.includes(text))
   assert.equal(await page.locator('[data-map-key-from]').innerText(),'Not selected');assert.equal(await page.locator('[data-map-key-to]').innerText(),'Not selected')
   measurements.push(await aligned(page))
  }
  assert.equal(await resident.getByLabel('Campus map key',{exact:true}).getByText(/Numbered badges: pending reports/).count(),0)
  assert.equal(await developer.getByLabel('Campus map key',{exact:true}).getByText(/Numbered badges: pending reports/).count(),1)
  await resident.getByLabel('Starting point',{exact:true}).selectOption('CICT');await resident.getByLabel('Destination',{exact:true}).selectOption('RESIDENSI-UTMKL')
  assert.equal(await resident.locator('[data-map-key-from]').innerText(),'CICT access');assert.equal(await resident.locator('[data-map-key-to]').innerText(),'Residensi UTMKL access')
  await resident.locator('.campus-map').screenshot({path:path.join(out,'01-resident-live-map-key.png')})
  await developer.getByLabel('Developer route from',{exact:true}).selectOption('MAIN-GATE');await developer.getByLabel('Developer route to',{exact:true}).selectOption('INNER-GATE')
  assert.equal(await developer.locator('[data-map-key-from]').innerText(),'Pintu Masuk Utama');assert.equal(await developer.locator('[data-map-key-to]').innerText(),'Menara Razak access')
  await developer.getByRole('button',{name:'Add route to selection',exact:true}).click();assert.equal(await developer.locator('[data-map-key-from]').innerText(),'Not selected');assert.equal(await developer.locator('[data-map-key-to]').innerText(),'Not selected')
  await developer.locator('.campus-map').screenshot({path:path.join(out,'02-developer-live-map-key.png')})
  await resident.getByRole('button',{name:'Start selected route',exact:true}).click();await resident.getByLabel('Campus map key',{exact:true}).getByText('Blue ring: last confirmed point',{exact:true}).waitFor();assert.equal(await resident.getByLabel('Campus map key',{exact:true}).getByText('Orange ring: next point',{exact:true}).count(),1)
  await resident.getByRole('button',{name:'Exit walk / change route',exact:true}).click()
  for(const page of [resident,developer]){
   await page.locator('.campus-map-details>summary').click();const info=await page.locator('.campus-map-details').innerText();assert.ok(info.includes('NOT FOR NAVIGATION'));assert.ok(info.includes('Report photos remain with their reports'));assert.equal(info.includes('Dashed grey centre'),false)
   await page.locator('.campus-map-details>summary').click()
   for(const [width,height] of [[1366,768],[390,844]]){await page.setViewportSize({width,height});await page.getByRole('button',{name:'Full map',exact:true}).click();measurements.push(await aligned(page));await page.getByRole('button',{name:'Zoom in campus map',exact:true}).click();await page.locator('.campus-map-viewport').focus();await page.keyboard.press('ArrowLeft');measurements.push(await aligned(page));await page.keyboard.press('Home')}
   await page.locator('.campus-map').screenshot({path:path.join(out,page===resident?'03-resident-mobile-key.png':'04-developer-mobile-key.png')})
  }
  const bytes=await fs.readFile('public/maps/utmkul-reference-normal-points.png'),sha256=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(sha256,'848ab2273286b8af8ee30142bd5595bd67c8608052b84f99c921edfa8fc5eab5')
  assert.deepEqual(errors,[])
  const result={status:'passed',normalEntry:base+'/',unchangedImageSha256:sha256,nativeCoordinateFrame:[1113,1414],visibleCampusHeight:1224,measurements,checks:['same live shade/route/photo key in both roles','From/To names follow actual selection with no fixed example endpoints','pending report badge key appears only in Developer','walk rings appear only during a Resident walkthrough','obsolete printed footer clipped through layout without modifying bitmap bytes','image/SVG native alignment retained through crop, desktop/phone resize, zoom and pan','updated source/interaction/unsurveyed notes; no stale dashed-grey legend','zero horizontal overflow or page errors'],pageErrors:errors}
  await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
