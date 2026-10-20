// Normal production entry; exercise the visible Update/Delete/Upload actions and native file chooser.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183',out=path.resolve(process.env.PHOTO_ACTION_OUTPUT_DIR||'outputs/photo-actions')
;(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[]
  context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
  const developer=await context.newPage(),resident=await context.newPage()
  async function enter(page,role){await page.goto(base+'/');await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${role} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
  const button=(name)=>developer.getByRole('button',{name,exact:true}),editor=()=>developer.getByRole('region',{name:'Edit point photos',exact:true})
  async function select(id){await developer.getByLabel('Point for reference photo',{exact:true}).selectOption(id)}
  async function upload(action,file='public/point-photos/klinik.jpg'){
   const chooserPromise=developer.waitForEvent('filechooser');await button(action).click();const chooser=await chooserPromise;await chooser.setFiles(file)
   await developer.getByText('Photo draft saved. Residents still see the published picture.',{exact:true}).waitFor()
  }
  async function publish(note){await developer.getByLabel('Photo publication note',{exact:true}).fill(note);await developer.getByRole('checkbox',{name:'I reviewed this point photo and want to publish it to Residents.',exact:true}).check();await button('Publish point photo to Residents').click();await developer.getByText('Point photo published. Residents now see this picture.',{exact:true}).waitFor()}
  async function library(){return developer.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('coolcorridor-point-photos-v1',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('library'),g=tx.objectStore('library').get('current');g.onsuccess=()=>resolve(g.result??{published:{},drafts:{},history:[]});tx.oncomplete=()=>db.close()}}))}
  await enter(developer,'Developer');await enter(resident,'Resident');await select('MAIN-GATE')
  await button('Update photo').waitFor();assert.equal(await button('Delete published photo').count(),1);assert.equal(await button('Upload photo').count(),0)
  assert.equal(await resident.getByRole('button',{name:'Update photo',exact:true}).count(),0)
  await editor().screenshot({path:path.join(out,'01-existing-photo-actions.png')})
  const workflowBefore=await developer.evaluate(()=>localStorage.getItem('coolcorridor-shade-workflow-v1'))
  await resident.locator('[data-campus-node-id="MAIN-GATE"]').focus();await resident.keyboard.press('Enter')
  const residentImage=resident.locator('.point-photo-panel img'),original=await residentImage.getAttribute('src')
  // Direct update never deletes the current publication, even while its replacement is a draft.
  await upload('Update photo');assert.equal(await residentImage.getAttribute('src'),original)
  assert.equal((await library()).history.length,0);assert.equal((await library()).published['MAIN-GATE'],undefined)
  await button('Discard photo draft').click();assert.equal(await residentImage.getAttribute('src'),original)
  await upload('Update photo');await editor().screenshot({path:path.join(out,'02-update-without-deleting.png')});await publish('Synthetic direct replacement; no deletion first.')
  await resident.waitForFunction(()=>document.querySelector('.point-photo-panel img')?.getAttribute('src')?.startsWith('data:image/jpeg;base64,'))
  const replaced=await library();assert.equal(replaced.history.length,1);assert.notEqual(replaced.history[0].action,'delete');assert.ok(replaced.history[0].previous.src.endsWith('main-gate.jpg'))
  assert.equal(await button('Update photo').count(),1);assert.equal(await button('Delete published photo').count(),1)
  // Deletion is a separate choice, including cancel, and changes empty-state actions immediately.
  await button('Delete published photo').click();await button('Cancel photo deletion').click();assert.deepEqual(await library(),replaced)
  await developer.getByLabel('Photo publication note',{exact:true}).fill('Synthetic deletion chosen separately.');await button('Delete published photo').click();await button('Confirm delete published photo').click()
  await button('Upload photo').waitFor();assert.equal(await button('Update photo').count(),0);assert.equal(await button('Delete published photo').count(),0)
  await resident.getByText('No reference photo published for this point.',{exact:true}).waitFor()
  await upload('Upload photo','public/point-photos/main-gate.jpg');await publish('Synthetic upload after choosing an empty point.')
  await button('Update photo').waitFor()
  await select('NORTH-WEST');assert.equal(await button('Upload photo').count(),1);assert.equal(await button('Update photo').count(),0);assert.equal(await button('Delete published photo').count(),0)
  await editor().screenshot({path:path.join(out,'03-empty-point-upload.png')})
  await upload('Upload photo');await select('MAIN-GATE');assert.equal(await button('Update photo').count(),1);await select('NORTH-WEST');assert.ok((await library()).drafts['NORTH-WEST'])
  await publish('Synthetic first reference for an empty point.');await button('Update photo').waitFor()
  assert.equal(await developer.evaluate(()=>localStorage.getItem('coolcorridor-shade-workflow-v1')),workflowBefore)
  await developer.setViewportSize({width:390,height:844});await editor().scrollIntoViewIfNeeded();assert.equal(await developer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  await editor().screenshot({path:path.join(out,'04-mobile-photo-actions.png')})
  assert.deepEqual(errors,[])
  const result={status:'passed',normalEntry:base+'/',checks:['published points offer Update photo and Delete published photo','empty points offer Upload photo only','visible Update/Upload buttons open native file chooser','direct replacement requires no deletion and keeps current Resident photo until publish','discard replacement preserves published photo','one replacement publication with previous image and no deletion history','Delete remains a separate cancel/confirm action','deleted point switches immediately to Upload photo','never-photographed point uploads and publishes its first reference','saved drafts survive point changes','photo-only changes preserve shade/report workflow storage','phone actions have no horizontal overflow; Resident has no editor actions'],pageErrors:errors}
  await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
