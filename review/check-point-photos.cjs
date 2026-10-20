// Normal application entry. Synthetic replacements use isolated browser storage.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183',out=path.resolve(process.env.POINT_PHOTO_OUTPUT_DIR||'outputs/point-photos'),workflowKey='coolcorridor-shade-workflow-v1'
const assignments=[['FIELD-NORTH','reference-20.jpg'],['RAZAK-EAST','reference-06.jpg'],['RESIDENSI-UTMKL','residensi.jpg'],['REAR-GATE','bus-parking.jpg'],['MAIN-GATE','main-gate.jpg'],['J-V1','corridor-v1.jpg'],['J-CLINIC','corridor-clinic.jpg'],['KLINIK-UTM','klinik.jpg'],['CAFE-MJIIT','cafe-mjiit.jpg'],['MASJID-UTMKL','masjid.jpg'],['J-TENNIS','corridor-tennis.jpg'],['J-PA5','corridor-pa5.jpg'],['J-LIBRARY','corridor-library.jpg'],['RESIDENSI-NORTH-WEST','reference-15.jpg'],['PARKING-WEST','reference-09.jpg']]
;(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[]
  context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
  const resident=await context.newPage(),developer=await context.newPage(),second=await context.newPage()
  async function enter(page,role){await page.goto(base+'/');await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${role} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
  const panel=page=>page.getByRole('complementary',{name:'Point photo reference',exact:true})
  async function open(page,id){await page.locator(`[data-campus-node-id="${id}"]`).focus();await page.keyboard.press('Enter');await panel(page).waitFor();assert.equal(await panel(page).getAttribute('data-photo-node'),id)}
  async function close(page){if(await panel(page).count())await page.getByRole('button',{name:'Close point photo panel',exact:true}).click()}
  const image=page=>panel(page).locator('img')
  async function state(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('coolcorridor-point-photos-v1',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('library'),g=tx.objectStore('library').get('current');g.onsuccess=()=>resolve(g.result??{revision:0,published:{},drafts:{},history:[]});tx.oncomplete=()=>db.close();g.onerror=()=>reject(g.error)}}))}
  async function select(page,id){await page.getByLabel('Point for reference photo',{exact:true}).selectOption(id)}
  async function upload(page,id,file='public/point-photos/klinik.jpg'){await select(page,id);await page.getByLabel('Upload reference photo',{exact:true}).setInputFiles(file);await page.getByText('Photo draft saved. Residents still see the published picture.',{exact:true}).waitFor()}
  async function preparePublish(page,note){await page.getByLabel('Photo publication note',{exact:true}).fill(note);await page.getByRole('checkbox',{name:'I reviewed this point photo and want to publish it to Residents.',exact:true}).check()}
  async function publish(page,note){await preparePublish(page,note);await page.getByRole('button',{name:'Publish point photo to Residents',exact:true}).click();await page.getByText('Point photo published. Residents now see this picture.',{exact:true}).waitFor()}
  await enter(resident,'Resident');await enter(developer,'Developer')
  assert.equal(await resident.getByLabel('Upload reference photo',{exact:true}).count(),0)
  assert.equal(await developer.locator('[data-has-photo="true"]').count(),15)
  assert.equal(await developer.locator('[data-campus-node-id]').count(),65)
  const checked=[]
  for(const [id,file] of assignments){await open(resident,id);await image(resident).waitFor();assert.ok((await image(resident).getAttribute('src')).endsWith('/point-photos/'+file));await image(resident).evaluate(img=>img.decode());assert.ok(await image(resident).evaluate(img=>img.naturalWidth>0));checked.push({node:id,asset:file});await close(resident)}
  // A photo-only corridor dot beside Cafe V1 must not cover the existing routing endpoint.
  await resident.getByRole('group',{name:'Choose what the next map dot sets',exact:true}).getByRole('button',{name:'From',exact:true}).click()
  await resident.locator('[data-campus-node-id="CAFE-V1"]').click();assert.equal(await resident.getByLabel('Starting point',{exact:true}).inputValue(),'CAFE-V1');await close(resident)
  await resident.locator('[data-campus-node-id="J-V1"]').click();assert.equal(await panel(resident).getAttribute('data-photo-node'),'J-V1');assert.equal(await resident.getByLabel('Starting point',{exact:true}).inputValue(),'CAFE-V1');await close(resident)
  // The five newly visible photo junctions keep their non-endpoint semantics.
  await resident.getByLabel('Starting point',{exact:true}).selectOption('MAIN-GATE');await resident.getByLabel('Destination',{exact:true}).selectOption('KLINIK-UTM')
  await open(resident,'J-V1');assert.equal(await resident.getByLabel('Starting point',{exact:true}).inputValue(),'MAIN-GATE');assert.equal(await resident.getByLabel('Destination',{exact:true}).inputValue(),'KLINIK-UTM');await resident.keyboard.press('Escape');assert.equal(await panel(resident).count(),0);assert.equal(await resident.locator('[data-campus-node-id="J-V1"]').evaluate(n=>n===document.activeElement),true)
  await open(resident,'KLINIK-UTM');await resident.screenshot({path:path.join(out,'01-resident-reference-panel.png')});await close(resident)
  await open(resident,'NORTH-WEST');assert.match(await panel(resident).innerText(),/No reference photo published/);await close(resident)
  const beforeWorkflow=await resident.evaluate(k=>localStorage.getItem(k),workflowKey)
  // Upload errors leave published references and drafts intact.
  await select(developer,'MAIN-GATE')
  for(const file of [{name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')},{name:'broken.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not an image')},{name:'large.jpg',mimeType:'image/jpeg',buffer:Buffer.alloc(11*1024*1024)}]){await developer.getByLabel('Upload reference photo',{exact:true}).setInputFiles(file);await developer.locator('.point-photo-editor [role=alert]').waitFor();assert.equal((await state(developer)).drafts['MAIN-GATE'],undefined)}
  await upload(developer,'MAIN-GATE');await open(resident,'MAIN-GATE');assert.ok((await image(resident).getAttribute('src')).endsWith('/main-gate.jpg'))
  await resident.getByLabel('Starting point',{exact:true}).selectOption('MAIN-GATE');await resident.getByLabel('Destination',{exact:true}).selectOption('KLINIK-UTM');const beforeRoutes=await resident.locator('[data-route-objective]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-route-segments')));assert.equal(beforeRoutes.length,2)
  assert.equal(await developer.getByRole('button',{name:'Publish point photo to Residents',exact:true}).isEnabled(),false)
  await developer.getByRole('tab',{name:'Footfall',exact:true}).click();await developer.getByRole('tab',{name:'Edit shade / publish',exact:true}).click();assert.ok((await state(developer)).drafts['MAIN-GATE'])
  await preparePublish(developer,'Synthetic browser replacement only; not a true new Main Gate photograph.')
  await developer.getByRole('region',{name:'Edit point photos',exact:true}).screenshot({path:path.join(out,'02-developer-photo-draft.png')})
  await developer.getByRole('button',{name:'Publish point photo to Residents',exact:true}).click()
  await resident.waitForFunction(()=>document.querySelector('.point-photo-panel img')?.getAttribute('src')?.startsWith('data:image/jpeg;base64,'))
  const after=await state(developer);assert.equal(after.history.length,1);assert.equal(after.drafts['MAIN-GATE'],undefined);assert.ok(after.history[0].previous.src.endsWith('main-gate.jpg'))
  assert.equal(await resident.evaluate(k=>localStorage.getItem(k),workflowKey),beforeWorkflow)
  assert.deepEqual(await resident.locator('[data-route-objective]').evaluateAll(ns=>ns.map(n=>n.getAttribute('data-route-segments'))),beforeRoutes)
  await resident.screenshot({path:path.join(out,'03-resident-after-photo-publication.png')});await close(resident)
  // Publish a first photo on an ordinary point: its marker grows and darkens in the other role.
  await upload(developer,'NORTH-WEST');await publish(developer,'Synthetic first reference photo for browser test.')
  await resident.waitForFunction(()=>document.querySelector('[data-campus-node-id="NORTH-WEST"]')?.getAttribute('data-has-photo')==='true')
  assert.equal(await resident.locator('[data-campus-node-id="NORTH-WEST"] .campus-point-marker').getAttribute('r'),'9')
  assert.equal(await resident.locator('[data-campus-node-id="L-NORTH-WEST"] .campus-point-marker').getAttribute('r'),'7')
  // Two tabs stage distinct points; transaction updates retain both drafts.
  await enter(second,'Developer')
  await Promise.all([upload(developer,'PARKING-SOUTH'),upload(second,'GATE-SOUTH-SPUR')])
  assert.ok((await state(developer)).drafts['PARKING-SOUTH']);assert.ok((await state(developer)).drafts['GATE-SOUTH-SPUR'])
  await Promise.all([publish(developer,'Synthetic concurrent point A.'),publish(second,'Synthetic concurrent point B.')])
  const concurrent=await state(developer);assert.ok(concurrent.published['PARKING-SOUTH']);assert.ok(concurrent.published['GATE-SOUTH-SPUR'])
  // Simulate quota failure at the IDB write; no partial publication or success message.
  await upload(developer,'KLINIK-UTM');await preparePublish(developer,'Synthetic failed-write check.')
  const historyBefore=(await state(developer)).history.length
  await developer.evaluate(()=>{window.originalPhotoPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.transaction.db.name==='coolcorridor-point-photos-v1')throw new DOMException('Synthetic quota test','QuotaExceededError');return window.originalPhotoPut.apply(this,args)}})
  await developer.getByRole('button',{name:'Publish point photo to Residents',exact:true}).click();await developer.locator('.point-photo-editor [role=alert]').waitFor()
  assert.equal((await state(developer)).history.length,historyBefore);assert.ok((await state(developer)).drafts['KLINIK-UTM']);assert.equal((await state(developer)).published['KLINIK-UTM'],undefined)
  await developer.evaluate(()=>{IDBObjectStore.prototype.put=window.originalPhotoPut})
  await developer.getByRole('button',{name:'Discard photo draft',exact:true}).click()
  // A normal shade publication still works and does not erase point-photo records.
  const photosBeforeShade=await state(developer);await close(developer)
  await developer.getByLabel('Developer route from',{exact:true}).selectOption('MAIN-GATE');await developer.getByLabel('Developer route to',{exact:true}).selectOption('INNER-GATE');await developer.getByRole('button',{name:'Add route to selection',exact:true}).click()
  await developer.getByLabel('Shade for selected paths',{exact:true}).selectOption('mixed');await developer.getByRole('button',{name:'Apply shade to Developer draft',exact:true}).click();await developer.getByLabel('Map publication note',{exact:true}).fill('Synthetic shade/photo coexistence check.');await developer.getByRole('checkbox',{name:'I reviewed these DEMO shade changes and want to publish them to Resident routing.',exact:true}).check();await developer.getByRole('button',{name:'Publish to Resident map',exact:true}).click()
  assert.deepEqual(await state(developer),photosBeforeShade)
  await resident.waitForFunction(()=>document.querySelector('[data-segment-id="DEMO-REF-001"] .campus-shade-stroke')?.getAttribute('stroke')==='#BD8B16')
  // References persist after reload and work in scenario and mobile layouts.
  await enter(resident,'Resident');await open(resident,'MAIN-GATE');assert.ok((await image(resident).getAttribute('src')).startsWith('data:image/jpeg;base64,'));await close(resident)
  await developer.getByRole('tab',{name:'Budget optimiser',exact:true}).click();await developer.getByRole('button',{name:'Optimise plan',exact:true}).click();await developer.getByRole('tab',{name:'Simulated scenario',exact:true}).click();await open(developer,'J-LIBRARY');assert.ok((await image(developer).getAttribute('src')).endsWith('corridor-library.jpg'));await close(developer)
  for(const page of [resident,developer]){await page.setViewportSize({width:390,height:844});await open(page,'KLINIK-UTM');await panel(page).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,page===resident?'04-resident-mobile.png':'05-developer-mobile.png')});await close(page)}
  // Developer deletes published references; a tombstone prevents seed fallback on reload.
  for(const page of [resident,developer])await page.setViewportSize({width:1440,height:1000})
  await developer.getByRole('tab',{name:'Edit shade / publish',exact:true}).click()
  assert.equal(await resident.getByRole('button',{name:'Delete published photo',exact:true}).count(),0)
  await upload(developer,'KLINIK-UTM');await open(resident,'KLINIK-UTM')
  const beforeDelete=await state(developer),shadeBeforeDelete=await resident.evaluate(k=>localStorage.getItem(k),workflowKey)
  await developer.getByLabel('Photo publication note',{exact:true}).fill('')
  await developer.getByRole('button',{name:'Delete published photo',exact:true}).click()
  assert.equal(await developer.getByRole('button',{name:'Confirm delete published photo',exact:true}).isEnabled(),false)
  await developer.getByRole('button',{name:'Cancel photo deletion',exact:true}).click();assert.deepEqual(await state(developer),beforeDelete)
  await developer.getByLabel('Photo publication note',{exact:true}).fill('Synthetic removal of an outdated supplied reference.')
  await developer.getByRole('button',{name:'Delete published photo',exact:true}).click()
  await developer.getByRole('region',{name:'Edit point photos',exact:true}).screenshot({path:path.join(out,'06-developer-delete-confirmation.png')})
  await developer.evaluate(()=>{window.originalPhotoPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.transaction.db.name==='coolcorridor-point-photos-v1')throw new DOMException('Synthetic deletion quota test','QuotaExceededError');return window.originalPhotoPut.apply(this,args)}})
  await developer.getByRole('button',{name:'Confirm delete published photo',exact:true}).click();await developer.locator('.point-photo-editor [role=alert]').waitFor();assert.deepEqual(await state(developer),beforeDelete)
  await developer.evaluate(()=>{IDBObjectStore.prototype.put=window.originalPhotoPut})
  await developer.getByRole('button',{name:'Confirm delete published photo',exact:true}).click()
  await panel(resident).getByText('No reference photo published for this point.',{exact:true}).waitFor()
  const deleted=await state(developer);assert.equal(deleted.published['KLINIK-UTM'],null);assert.deepEqual(deleted.drafts,beforeDelete.drafts);assert.equal(deleted.history.at(-1).action,'delete');assert.ok(deleted.history.at(-1).previous.src.endsWith('klinik.jpg'))
  assert.equal(await resident.locator('[data-campus-node-id="KLINIK-UTM"] .campus-point-marker').getAttribute('r'),'7')
  assert.equal(await resident.evaluate(k=>localStorage.getItem(k),workflowKey),shadeBeforeDelete)
  await resident.screenshot({path:path.join(out,'07-resident-after-photo-deletion.png')});await close(resident)
  await enter(resident,'Resident');await open(resident,'KLINIK-UTM');await panel(resident).getByText('No reference photo published for this point.',{exact:true}).waitFor();await close(resident)
  // Retained draft is stale after deletion and can be explicitly reviewed/published again.
  await developer.getByText('The published photo changed after this draft started. Review the current picture before publishing.',{exact:true}).waitFor()
  await developer.getByRole('button',{name:'Review latest published photo',exact:true}).click();await publish(developer,'Synthetic reviewed replacement after deletion.')
  await open(resident,'KLINIK-UTM');assert.ok((await image(resident).getAttribute('src')).startsWith('data:image/jpeg;base64,'));await close(resident)
  // Uploaded references can also be removed; subsequent shade publications remain independent.
  await select(developer,'NORTH-WEST');await developer.getByLabel('Photo publication note',{exact:true}).fill('Synthetic uploaded reference removal.');await developer.getByRole('button',{name:'Delete published photo',exact:true}).click();await developer.getByRole('button',{name:'Confirm delete published photo',exact:true}).click()
  await resident.waitForFunction(()=>document.querySelector('[data-campus-node-id="NORTH-WEST"]')?.getAttribute('data-has-photo')==='false')
  assert.equal((await state(developer)).published['NORTH-WEST'],null)
  await enter(developer,'Developer');await select(developer,'NORTH-WEST');assert.equal(await developer.getByRole('button',{name:'Delete published photo',exact:true}).count(),0)
  assert.deepEqual(errors,[])
  const results={status:'passed',normalEntry:base+'/',confirmedAssignments:checked,checks:['all15 corrected seed photos load at their exact graph points','published photo dots darker and radius9; ordinary dots radius7','five corridor reference points visible without changing routing endpoints','adjacent Cafe V1 and corridor V1 dots remain individually clickable','click/keyboard photo panel and Close/Escape restore map focus','Resident has no upload/publication/deletion controls','unsupported/corrupt/oversized uploads rejected without mutation','drafts isolated from Resident and retained across tool changes','explicit publication updates open Resident photo panel','photo publication preserves shade/workflow JSON and route IDs','first photo updates marker in both roles','concurrent different-point drafts/publications preserve both edits','failed IndexedDB write leaves published image/history unchanged','shade publication still recalculates Resident and preserves photo library','published images survive reload; scenario uses published references','mobile panels can close without horizontal overflow','cancel deletion and failed deletion writes preserve current reference/history','confirmed deletion removes bundled reference live from Resident and resets marker size','deleted seed stays absent after reload; unpublished draft and shade state preserved','retained draft requires rebase before replacement publication','uploaded references can be deleted and deletion controls disappear after reload'],pageErrors:errors}
  await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2))
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
