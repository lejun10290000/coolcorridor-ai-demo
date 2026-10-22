const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const out=path.resolve(process.env.LANDING_OUTPUT_DIR||'outputs/landing-controls-preview')
;(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'}),errors=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message))
  await page.addInitScript(()=>{
   const names=new WeakMap();for(const Type of [window.WebGLRenderingContext,window.WebGL2RenderingContext]){if(!Type)continue;const proto=Type.prototype,get=proto.getUniformLocation,set=proto.uniformMatrix4fv;
    proto.getUniformLocation=function(program,name){const loc=get.call(this,program,name);if(loc)names.set(loc,name);return loc}
    proto.uniformMatrix4fv=function(loc,transpose,value,...rest){if(names.get(loc)==='viewMatrix')window.testCameraMatrix=Array.from(value);return set.call(this,loc,transpose,value,...rest)}
   }
  })
  await page.goto('http://127.0.0.1:4183/');await page.locator('.township-canvas').waitFor();await page.waitForFunction(()=>Array.isArray(window.testCameraMatrix))
  await page.getByRole('button',{name:'Pause cinematic motion',exact:true}).click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  const before=await page.evaluate(()=>window.testCameraMatrix)
  for(const [number,title] of [['02','A more human journey'],['03','Planning intelligence'],['01','Township vision']]){
   await page.locator('.scene-note .chapter-nav button').filter({hasText:number}).click();await page.locator('.scene-note-copy strong').filter({hasText:title}).waitFor();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.deepEqual(await page.evaluate(()=>window.testCameraMatrix),before)
  }
  const buttons=await page.locator('.chapter-nav').boundingBox(),copy=await page.locator('.scene-note-copy').boundingBox();assert.ok(buttons.y+buttons.height<=copy.y)
  const quality=await page.getByLabel('Visual quality').boundingBox(),pause=await page.getByRole('button',{name:'Play cinematic motion',exact:true}).boundingBox();assert.ok(Math.abs(quality.height-pause.height)<2)
  await page.screenshot({path:path.join(out,'desktop.png')})
  const canvas=await page.locator('.township-canvas').boundingBox();await page.mouse.move(canvas.width*.6,canvas.height*.5);await page.mouse.down();await page.mouse.move(canvas.width*.6+100,canvas.height*.5);await page.mouse.up();await page.waitForFunction(v=>JSON.stringify(window.testCameraMatrix)!==JSON.stringify(v),before)
  const dragged=await page.evaluate(()=>window.testCameraMatrix);await page.getByRole('button',{name:'Play a ten-second 360-degree camera orbit',exact:true}).click();await page.waitForFunction(v=>JSON.stringify(window.testCameraMatrix)!==JSON.stringify(v),dragged)
  await page.getByLabel('Visual quality').selectOption('fallback');await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  for(const role of ['Resident','Developer']){
   await page.getByRole('button',{name:`Enter ${role} Mode`,exact:true}).click();const nav=page.getByRole('navigation',{name:'Main navigation'});assert.equal(await nav.getByRole('link',{name:/About/}).count(),0);await page.locator(role==='Resident'?'#resident-about>summary':'#developer-about>summary').click();await nav.getByRole('button',{name:/Home/}).click();await page.getByLabel('Visual quality').selectOption('fallback')
  }
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify({status:'passed',checks:['explanation tabs above their copy','chapter changes preserve actual WebGL camera matrix','drag and explicit 360 tour still move camera','quality control matches pause control height','mobile page fits without horizontal overflow','top About links removed; bottom About remains accessible in both modes'],pageErrors:errors},null,2));console.log('Passed landing layout, real WebGL camera isolation, drag/tour, compact Quality and both modes navigation checks.')
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
