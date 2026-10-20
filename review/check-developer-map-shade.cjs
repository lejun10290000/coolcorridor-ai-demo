// Normal production-entry test. Uses a fresh browser context and synthetic DEMO inputs only.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183',out=path.resolve(process.env.MAP_SHADE_OUTPUT_DIR||'outputs/developer-map-shade'),key='coolcorridor-shade-workflow-v1'
;(async()=>{
  await fs.mkdir(out,{recursive:true})
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),errors=[]
    context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
    const resident=await context.newPage(),developer=await context.newPage()
    async function enter(page,mode){await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${mode} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
    const stored=()=>developer.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)
    const card=(page,objective)=>page.locator(`[data-route-objective="${objective}"]`)
    const routeIds=(page,objective)=>card(page,objective).getAttribute('data-route-segments')
    const selected=async()=>((await developer.getByTestId('developer-selection').getAttribute('data-selected-segments'))||'').split(',').filter(Boolean)
    async function route(from,to){await developer.getByLabel('Developer route from',{exact:true}).selectOption(from);await developer.getByLabel('Developer route to',{exact:true}).selectOption(to);await developer.getByRole('button',{name:'Add route to selection',exact:true}).click()}
    async function apply(label){await developer.getByLabel('Shade for selected paths',{exact:true}).selectOption(label);await developer.getByRole('button',{name:'Apply shade to Developer draft',exact:true}).click()}
    await resident.goto(base+'/');await enter(resident,'Resident')
    await resident.getByLabel('Starting point',{exact:true}).selectOption('NORTH-WEST');await resident.getByLabel('Destination',{exact:true}).selectOption('L1-ACCESS')
    await card(resident,'exposure').click()
    const shortestBefore=await routeIds(resident,'shortest'),exposureBefore=await routeIds(resident,'exposure'),versionBefore=await card(resident,'shortest').getAttribute('data-route-version')
    await developer.goto(base+'/');await enter(developer,'Developer')
    assert.equal(await developer.locator('.campus-map-scene img').getAttribute('src'),'/maps/utmkul-reference-normal-points.png')
    for(const page of [resident,developer])assert.deepEqual(await page.locator('.campus-point-marker').evaluateAll(ns=>[...new Set(ns.map(n=>n.getAttribute('r')))]),['7'])
    // Actual map-point interaction for a first route, then a second route in the same selection.
    await developer.locator('[data-campus-node-id="MAIN-GATE"]').click();await developer.locator('[data-campus-node-id="INNER-GATE"]').click()
    await developer.getByRole('button',{name:'Add route to selection',exact:true}).click()
    await route('INNER-GATE','RAZAK-ENTRANCE');const exposed=await selected();assert.equal(exposed.length,2)
    // Direct path taps choose the nearest geometric link, not a later overlapping SVG hit area.
    await developer.locator('.campus-map').scrollIntoViewIfNeeded()
    const tap=await developer.locator('.campus-map-overlay').evaluate(svg=>{const p=new DOMPoint(270,913).matrixTransform(svg.getScreenCTM());return{x:p.x,y:p.y}})
    await developer.mouse.click(tap.x,tap.y);assert.equal((await selected()).includes('DEMO-REF-001'),false)
    await developer.mouse.click(tap.x,tap.y);assert.equal((await selected()).includes('DEMO-REF-001'),true)
    await apply('mostly_exposed')
    await route('INNER-GATE','DEWAN-AZMAN-HASHIM');const mixed=await selected();await apply('mixed')
    await route('NORTH-WEST','L-NORTH-WEST');await route('L-NORTH-WEST','L1-ACCESS');const shaded=await selected();assert.equal(shaded.length,2);await apply('mostly_shaded')
    const draft=await stored();assert.equal(draft.snapshots.length,1);assert.equal(draft.map_shade_draft.assignments.length,5)
    assert.equal(await routeIds(resident,'exposure'),exposureBefore);assert.equal(await card(resident,'exposure').getAttribute('data-route-version'),versionBefore)
    assert.equal(await resident.locator('[data-segment-id="'+shaded[0]+'"] .campus-shade-stroke').getAttribute('stroke'),'#707580')
    await developer.locator('.campus-map').screenshot({path:path.join(out,'01-developer-draft-map.png')})
    // Draft survives refresh but still cannot publish without a note and explicit review.
    await developer.reload();await enter(developer,'Developer')
    assert.equal((await stored()).map_shade_draft.assignments.length,5)
    assert.equal(await developer.getByRole('button',{name:'Publish to Resident map',exact:true}).isEnabled(),false)
    await developer.getByLabel('Map publication note',{exact:true}).fill('Synthetic browser demo: two unshaded, one mixed, two fully shaded links. No field observation.')
    await developer.getByRole('checkbox',{name:'I reviewed these DEMO shade changes and want to publish them to Resident routing.',exact:true}).check()
    await developer.locator('.developer-edit-controls > .wf-panel').screenshot({path:path.join(out,'02-developer-review-before-publish.png')})
    await developer.getByRole('button',{name:'Publish to Resident map',exact:true}).click()
    const published=await stored(),version=published.current_version
    assert.notEqual(version,versionBefore);assert.equal(published.map_shade_draft,null);assert.equal(published.snapshots.length,2)
    await resident.waitForFunction(v=>document.querySelector('[data-route-objective="exposure"]')?.getAttribute('data-route-version')===v,version)
    assert.equal(await routeIds(resident,'shortest'),shortestBefore);assert.notEqual(await routeIds(resident,'exposure'),exposureBefore)
    const afterExposure=await routeIds(resident,'exposure')
    assert.deepEqual(new Set(afterExposure.split(',')),new Set(shaded))
    assert.deepEqual(await resident.locator('[data-route-overlay-id]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-route-overlay-id'))),afterExposure.split(','))
    const distance=async objective=>Number((await card(resident,objective).locator('b').innerText()).match(/^([\d.]+) m/)[1])
    const shortestDistance=await distance('shortest'),shadedDistance=await distance('exposure');assert.ok(shadedDistance<=shortestDistance*1.25)
    for(const [ids,color] of [[exposed,'#C4473A'],[mixed,'#BD8B16'],[shaded,'#35745A']])for(const id of ids){
      assert.equal(await resident.locator(`[data-segment-id="${id}"] .campus-shade-stroke`).getAttribute('stroke'),color)
      assert.equal(await developer.locator(`[data-segment-id="${id}"] .campus-shade-stroke`).getAttribute('stroke'),color)
    }
    await resident.locator('.campus-map').screenshot({path:path.join(out,'03-resident-after-publication.png')})
    await resident.getByRole('region',{name:'Calculated route comparison',exact:true}).screenshot({path:path.join(out,'04-recalculated-routes.png')})
    await developer.getByRole('tab',{name:'Edit shade / publish',exact:true}).click();await developer.locator('.developer-history>summary').click();await developer.getByLabel('Baseline dataset',{exact:true}).selectOption(versionBefore)
    assert.equal(await developer.getByRole('button',{name:'Add route to selection',exact:true}).isEnabled(),false)
    assert.equal(await developer.locator(`[data-segment-id="${shaded[0]}"] .campus-shade-stroke`).getAttribute('stroke'),'#707580')
    await developer.getByLabel('Baseline dataset',{exact:true}).selectOption('current')
    // No route is invented for an isolated reference dot.
    await developer.getByLabel('Developer route from',{exact:true}).selectOption('PA9-SPUR');await developer.getByLabel('Developer route to',{exact:true}).selectOption('MAIN-GATE')
    await developer.getByText('No connected route between these points. Choose another pair.',{exact:true}).waitFor()
    assert.equal(await developer.getByRole('button',{name:'Add route to selection',exact:true}).isEnabled(),false)
    for(const page of [resident,developer]){
      await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
      await page.locator('.campus-map').screenshot({path:path.join(out,page===resident?'05-resident-mobile.png':'06-developer-mobile.png')})
    }
    await developer.getByRole('region',{name:'Developer route shade editor',exact:true}).screenshot({path:path.join(out,'07-developer-controls-mobile.png')})
    await resident.reload();await enter(resident,'Resident')
    assert.match(await resident.locator('.wf-version').first().innerText(),new RegExp(version))
    assert.equal(await resident.locator(`[data-segment-id="${shaded[0]}"] .campus-shade-stroke`).getAttribute('stroke'),'#35745A')
    assert.deepEqual(errors,[])
    const result={status:'passed',normalEntry:base+'/',datasetBefore:versionBefore,datasetAfter:version,shortestBefore,shortestAfter:shortestBefore,exposureBefore,exposureAfter:afterExposure,shortestDistance,shadedDistance,maximumDetourRatio:1.25,editedCategories:{unshaded:exposed,mixed,fullyShaded:shaded},checks:['uniform visible point radii, including selected endpoints','real Developer point clicks and multiple point-to-point routes','direct path taps toggle the nearest link despite overlapping hit areas','three shade classes and persisted unpublished draft','Resident draft isolation in another open tab','explicit publication note/review and immutable version','open Resident tab automatically recalculates after storage event','shortest stays shortest; most shaded path changes within 25%','map and route-card segment IDs agree','same published shade colors in both modes','historical map remains unchanged and read-only','isolated point yields no invented connection','desktop/mobile without horizontal overflow','published map persists after refresh'],pageErrors:errors}
    await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
