const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const out=path.resolve(process.env.DROPDOWN_OUTPUT_DIR||'outputs/dropdown-preview')
;(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH})
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'}),errors=[],violations=[]
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.exposeFunction('recordPolicyViolation',v=>violations.push(v));await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>window.recordPolicyViolation(e.effectiveDirective)))
  await page.goto('http://127.0.0.1:4183/');const quality=page.getByLabel('Visual quality');await quality.click();await page.screenshot({path:path.join(out,'home-quality-list.png')});await page.keyboard.press('Escape');await quality.selectOption('fallback')
  await page.getByRole('button',{name:'Enter Resident Mode',exact:true}).click();await page.locator('.campus-map-overlay').waitFor()
  const start=page.getByLabel('Starting point',{exact:true}),destination=page.getByLabel('Destination',{exact:true})
  assert.equal(await page.getByRole('button',{name:'Find routes',exact:true}).count(),0)
  assert.equal(await start.evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await start.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');assert.equal(await start.evaluate(e=>getComputedStyle(e,'::picker-icon').display),'none');await start.screenshot({path:path.join(out,'regular-dropdown-button.png')})
  async function checkUtilities(){const boxes=await page.locator('.route-utilities button').evaluateAll(ns=>ns.map(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height}}));assert.ok(Math.abs(boxes[0].width-boxes[1].width)<1);assert.ok(Math.abs(boxes[0].height-boxes[1].height)<1)}
  await checkUtilities();await page.locator('.route-utilities').screenshot({path:path.join(out,'equal-utility-buttons.png')})
  for(const prompt of ['Choose a starting point','Choose a destination']){
   const span=page.locator('.route-endpoint-pickers label>span').filter({hasText:prompt});assert.equal(await span.innerText(),prompt);assert.ok(await span.evaluate(e=>e.scrollWidth<=e.clientWidth))
  }
  await start.click();assert.equal(await start.evaluate(e=>e.matches(':open')),true);assert.equal(await start.locator('option[value=""]').evaluate(e=>e.hidden&&e.disabled&&getComputedStyle(e).display==='none'),true)
  assert.equal(await start.evaluate(e=>getComputedStyle(e,'::picker(select)').backgroundColor),'rgb(28, 14, 45)')
  await page.screenshot({path:path.join(out,'resident-start-list.png')});await page.keyboard.press('Escape');assert.equal(await start.inputValue(),'')
  await start.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.notEqual(await start.inputValue(),'')
  await start.selectOption('MAIN-GATE');await destination.selectOption('KLINIK-UTM');await page.locator('[data-route-objective="shortest"]').waitFor()
  await page.getByRole('link',{name:'View route options →',exact:true}).click();assert.equal(await page.locator('#resident-route-options').evaluate(e=>e===document.activeElement),true)
  await page.getByRole('button',{name:'Clear route',exact:true}).click();assert.equal(await start.inputValue(),'');assert.equal(await destination.inputValue(),'');assert.equal(await page.getByRole('link',{name:'View route options →',exact:true}).count(),0)
  await page.setViewportSize({width:390,height:844});await checkUtilities();await destination.click();await page.screenshot({path:path.join(out,'mobile-destination-list.png')});await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await start.selectOption('MAIN-GATE');await destination.selectOption('INNER-GATE');await page.getByRole('link',{name:'View route options →',exact:true}).click();assert.equal(await page.locator('#resident-route-options').evaluate(e=>e===document.activeElement),true)
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/Developer/}).click();await page.setViewportSize({width:1440,height:1000})
  const shade=page.getByLabel('Shade for selected paths',{exact:true});await shade.click();await page.screenshot({path:path.join(out,'developer-shade-list.png')});await page.keyboard.press('Escape');await shade.selectOption('mostly_shaded');assert.equal(await shade.inputValue(),'mostly_shaded')
  await page.getByLabel('Developer route from',{exact:true}).selectOption('MAIN-GATE');await page.getByLabel('Developer route to',{exact:true}).selectOption('INNER-GATE');await page.getByRole('button',{name:'Add route to selection',exact:true}).click();assert.equal(await page.getByLabel('Developer route from',{exact:true}).inputValue(),'')
  await page.getByRole('tab',{name:'Budget optimiser',exact:true}).click();await page.locator('.developer-planning-configuration>summary').click();const method=page.getByLabel('Planning method',{exact:true});await method.click();await page.screenshot({path:path.join(out,'planning-method-list.png')});await page.keyboard.press('Escape');await method.selectOption('manual');assert.equal(await method.inputValue(),'manual')
  const styles=await page.locator('select').evaluateAll(ns=>ns.map(e=>({name:e.getAttribute('aria-label'),appearance:getComputedStyle(e).appearance,color:getComputedStyle(e).color})))
  assert.ok(styles.every(s=>s.appearance==='base-select'))
  assert.deepEqual(errors,[]);assert.deepEqual(violations,[]);const result={status:'passed',checks:['full endpoint labels without clipping','placeholder hidden and disabled in open list','purple native picker styling and keyboard selection/Escape','route cards update without Find routes','conditional view-options link and clear-route recovery','mobile popup and page fit','Developer selection/reset and planning dropdown changes','no page errors or CSP violations'],selectStyles:styles};await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
