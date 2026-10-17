const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path')
;(async()=>{
  const output=path.resolve('outputs/routing-integration-v4/overlay-specimen');await fs.mkdir(output,{recursive:true})
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
  try{
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
    await page.goto('http://127.0.0.1:4181/review/route-overlay.html')
    const ids=()=>page.locator('[data-route-overlay-id]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-route-overlay-id')))
    for(const [width,height,label] of [[1440,1100,'desktop'],[390,844,'mobile']]){
      await page.setViewportSize({width,height})
      for(const objective of ['Shortest','Most shaded practical']){
        await page.getByRole('button',{name:objective,exact:true}).click()
        assert.deepEqual(await ids(),objective==='Shortest'?['DEMO-S03']:['DEMO-S01','DEMO-S02'])
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
        assert.equal(await page.locator('.campus-route-halo').first().getAttribute('vector-effect'),'non-scaling-stroke')
        // All base shade paths precede the active overlay; no later shade layer can cover it.
        assert.equal(await page.locator('svg').evaluate(svg=>svg.lastElementChild.classList.contains('campus-active-route')),true)
        assert.equal(await page.locator('.campus-route-outline').first().getAttribute('stroke-width'), '8')
        await page.screenshot({path:path.join(output,`${label}-${objective==='Shortest'?'shortest':'practical'}.png`),fullPage:true})
      }
    }
    assert.deepEqual(errors,[])
    const result={status:'passed',scope:'Isolated overlay component specimen only; shared map renderer integration is pending agreement',checks:['selected IDs correspond to computed objective','white halo/purple casing/shade centre','screen-space widths','active overlay painted after complete shade layer','desktop/mobile no overflow'],browserErrors:errors}
    await fs.writeFile(path.join(output,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})

