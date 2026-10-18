// Production entry acceptance for the shared reference map and its edited background.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183'
const out=path.resolve(process.env.ALIGNMENT_OUTPUT_DIR||'outputs/normal-points-alignment'),key='coolcorridor-shade-workflow-v1'
;(async()=>{
  await fs.mkdir(out,{recursive:true})
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'})
    const errors=[],external=[]
    context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
    context.on('request',r=>{if(!r.url().startsWith(base+'/')&&!r.url().startsWith('data:'))external.push(r.url())})
    const page=await context.newPage()
    async function enter(mode){await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${mode} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
    async function home(){await page.getByRole('button',{name:'← Home',exact:true}).click()}
    const nodes=()=>page.locator('[data-campus-node-id]').evaluateAll(ns=>ns.map(n=>[n.getAttribute('data-campus-node-id'),n.getAttribute('transform')]))
    const lines=()=>page.locator('[data-segment-id] .campus-shade-stroke').evaluateAll(ns=>ns.map(n=>n.getAttribute('points')))
    async function aligned(){
      const result=await page.evaluate(()=>{
        const img=document.querySelector('.campus-map-scene img'),svg=document.querySelector('.campus-map-overlay'),r=img.getBoundingClientRect(),s=svg.getBoundingClientRect()
        const samples={ 'MAIN-GATE':[216,922],'KLINIK-UTM':[747,317],'REAR-GATE':[977,456],'RESIDENSI-UTMKL':[939,731],'NORTH-EAST':[875,100],'PARKING-SOUTH':[623,1164] }
        const error=Object.entries(samples).map(([id,[x,y]])=>{const g=svg.querySelector(`[data-campus-node-id="${id}"]`),m=g.getScreenCTM();return Math.max(Math.abs((m.e-r.x)/r.width*1113-x),Math.abs((m.f-r.y)/r.height*1414-y))})
        return{natural:[img.naturalWidth,img.naturalHeight],viewBox:svg.getAttribute('viewBox'),box:[r.x,r.y,r.width,r.height],svgBox:[s.x,s.y,s.width,s.height],maxPixelError:Math.max(...error),overflow:document.documentElement.scrollWidth>innerWidth}
      })
      assert.deepEqual(result.natural,[1113,1413]);assert.equal(result.viewBox,'0 0 1113 1414')
      assert.deepEqual(result.box,result.svgBox);assert.ok(result.maxPixelError<.01,JSON.stringify(result));assert.equal(result.overflow,false)
    }
    await page.goto(base+'/');await enter('Resident');await aligned()
    const imageURL=await page.locator('.campus-map-scene img').getAttribute('src')
    const served=await(await page.request.get(base+imageURL)).body()
    assert.equal(imageURL,'/maps/utmkul-reference-normal-points.png')
    const supplied=await fs.readFile('public/maps/utmkul-reference-normal-points.png')
    const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex')
    assert.equal(hash(served),hash(supplied))
    const residentNodes=await nodes(),residentLines=await lines()
    assert.equal(residentNodes.length,60);assert.equal(residentLines.length,92)
    await page.locator('.campus-map').screenshot({path:path.join(out,'01-resident-reference-desktop.png')})
    // Actual map dot clicks (including selection mode), not just dropdown/state helpers.
    await page.locator('[data-campus-node-id="MAIN-GATE"]').click()
    await page.getByRole('group',{name:'Choose what the next map dot sets'}).getByRole('button',{name:'To',exact:true}).click()
    await page.locator('[data-campus-node-id="KLINIK-UTM"]').click()
    assert.equal(await page.getByLabel('Starting point',{exact:true}).inputValue(),'MAIN-GATE')
    assert.equal(await page.getByLabel('Destination',{exact:true}).inputValue(),'KLINIK-UTM')
    await page.locator('[data-route-objective="shortest"]').waitFor()
    assert.equal(await page.locator('[data-route-objective]').count(),2)
    for(const objective of ['shortest','exposure']){
      const card=page.locator(`[data-route-objective="${objective}"]`);await card.click()
      const ids=(await card.getAttribute('data-route-segments')).split(',')
      assert.deepEqual(await page.locator('[data-route-overlay-id]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-route-overlay-id'))),ids)
    }
    await page.locator('.campus-map').screenshot({path:path.join(out,'02-selected-reference-route.png')})
    await page.getByLabel('Starting point',{exact:true}).selectOption('CICT')
    await page.getByLabel('Destination',{exact:true}).selectOption('RESIDENSI-UTMKL')
    await page.locator('[data-route-objective="shortest"]').waitFor()
    await page.getByLabel('Starting point',{exact:true}).selectOption('PA9-SPUR')
    assert.equal(await page.locator('[data-route-objective]').count(),0)
    await page.getByText(/Unavailable: no defensible complete path/).first().waitFor()
    await page.getByLabel('Starting point',{exact:true}).selectOption('MAIN-GATE')
    await page.getByLabel('Destination',{exact:true}).selectOption('KLINIK-UTM')
    // Report on the new reference ID and inspect the same record in Developer.
    await page.locator('[data-segment-id="DEMO-REF-001"]').focus();await page.keyboard.press('Enter')
    await page.getByRole('button',{name:'Report this walkway',exact:true}).click()
    await page.getByLabel('Optional note',{exact:true}).fill('DEMO alignment browser test, not a field report')
    await page.getByRole('button',{name:'Submit demo report',exact:true}).click()
    await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).reports.length===1,key)
    for(const [width,height,label] of [[1440,1100,'desktop'],[390,844,'mobile']]){
      await page.setViewportSize({width,height});await page.getByRole('button',{name:'Full map',exact:true}).click();await aligned()
      await page.locator('.campus-map').screenshot({path:path.join(out,`03-resident-${label}.png`)})
      await page.getByRole('button',{name:'Zoom in campus map',exact:true}).click()
      await page.locator('.campus-map-viewport').focus();await page.keyboard.press('ArrowLeft');await aligned()
      await page.locator('.campus-map').screenshot({path:path.join(out,`04-resident-zoom-${label}.png`)})
      await page.keyboard.press('Home');await aligned()
    }
    await home();await enter('Developer');await aligned()
    assert.equal(await page.locator('.campus-map-scene img').getAttribute('src'),imageURL)
    assert.deepEqual(await nodes(),residentNodes);assert.deepEqual(await lines(),residentLines)
    await page.locator('[data-segment-id="DEMO-REF-001"]').focus();await page.keyboard.press('Enter')
    await page.getByRole('button',{name:'View reports for this segment',exact:true}).click()
    assert.match(await page.getByRole('region',{name:'Reports for selected segment',exact:true}).innerText(),/DEMO alignment browser test/)
    await page.getByRole('button',{name:'Optimise plan',exact:true}).click()
    await page.getByRole('button',{name:'Simulated scenario',exact:true}).click()
    assert.deepEqual(await nodes(),residentNodes);assert.equal(await page.locator('.campus-map-scene img').getAttribute('src'),imageURL)
    await page.getByRole('button',{name:'Return to baseline',exact:true}).click()
    for(const [width,height,label] of [[1440,1100,'desktop'],[390,844,'mobile']]){
      await page.setViewportSize({width,height});await page.getByRole('button',{name:'Full map',exact:true}).click();await aligned()
      await page.locator('.campus-map').screenshot({path:path.join(out,`05-developer-${label}.png`)})
      await page.getByRole('button',{name:'Zoom in campus map',exact:true}).click();await page.locator('.campus-map-viewport').focus();await page.keyboard.press('ArrowRight');await aligned();await page.keyboard.press('Home')
    }
    await page.reload();await enter('Developer')
    assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).reports[0].segment_id,key),'DEMO-REF-001')
    assert.deepEqual(errors,[]);assert.deepEqual(external,[])
    const result={status:'passed',entry:base+'/',asset:imageURL,sha256:hash(served),referenceDimensions:[1113,1414],backgroundDimensions:[1113,1413],visibleCircles:residentNodes.length,referenceLinks:residentLines.length,checks:['edited background bytes served; original coordinate frame retained','six original coordinate anchors within0.01 frame pixel after desktop/mobile/zoom/pan/resize/reset (not an image-recognition check)','Resident and Developer identical image/point transforms/path geometry','real dot selection and calculated overlay IDs','arbitrary endpoints and unavailable isolated spur','reference report visible in Developer and persists after reload','scenario keeps shared image/point geometry','zero horizontal overflow/browser errors/external requests'],errors,external}
    await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
