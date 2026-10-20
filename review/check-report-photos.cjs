// Normal production app; optional report attachments, isolated synthetic submissions only.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const base=process.env.ALIGNMENT_APP_URL||'http://127.0.0.1:4183',out=path.resolve(process.env.REPORT_PHOTO_OUTPUT_DIR||'outputs/report-photos'),key='coolcorridor-shade-workflow-v1'
;(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})})
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[]
  context.on('page',p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message))})
  const resident=await context.newPage(),developer=await context.newPage()
  async function enter(page,role){await page.goto(base+'/');await page.getByLabel('Visual quality').selectOption('fallback');await page.getByRole('button',{name:`Enter ${role} Mode`,exact:true}).click();await page.locator('.campus-map-overlay').waitFor()}
  const stored=()=>resident.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)
  const modal=()=>resident.getByRole('dialog',{name:'Report a point-to-point route',exact:true})
  async function report(description){
   await resident.getByRole('button',{name:'Choose report points on map',exact:true}).click()
   for(const id of ['MAIN-GATE','INNER-GATE']){await resident.locator(`[data-campus-node-id="${id}"]`).focus();await resident.keyboard.press('Enter');await resident.getByRole('button',{name:'Close point photo panel',exact:true}).click()}
   await resident.getByRole('button',{name:'Report selected route',exact:true}).click();await resident.getByLabel('Describe the problem',{exact:true}).fill(description)
  }
  async function attach(){await resident.getByLabel('Optional report photo',{exact:true}).setInputFiles('public/point-photos/corridor-v1.jpg');await modal().locator('.report-reference-photo img').waitFor();await modal().locator('.report-reference-photo img').evaluate(img=>img.decode())}
  async function submit(){await resident.getByRole('button',{name:'Submit route report',exact:true}).click();await modal().waitFor({state:'hidden'})}
  async function inbox(){await developer.getByRole('tab',{name:/Resident reports/}).click()}
  const record=id=>developer.locator(`[data-report-id="${id}"]`)
  await enter(resident,'Resident');await enter(developer,'Developer')
  await report('Synthetic text-only report, with optional attachment removed.')
  for(const file of [{name:'unsupported.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')},{name:'corrupt.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not a JPEG')},{name:'large.jpg',mimeType:'image/jpeg',buffer:Buffer.alloc(11*1024*1024)}]){
   await resident.getByLabel('Optional report photo',{exact:true}).setInputFiles(file);await modal().getByRole('alert').waitFor();assert.equal(await resident.getByRole('button',{name:'Submit route report',exact:true}).isEnabled(),false);await resident.getByRole('button',{name:'Continue without photo',exact:true}).click()
  }
  await attach();await resident.getByRole('button',{name:'Remove report photo',exact:true}).click();await submit()
  const textOnly=(await stored()).reports[0];assert.equal(textOnly.reference_photo,undefined)
  const beforeAttachment=await stored()
  await report('Synthetic photo report: broken shade canopy for Developer review.');await attach()
  await resident.screenshot({path:path.join(out,'01-resident-optional-photo.png')})
  // A quota failure must not close the form, lose its attachment, or create a partial report.
  await resident.evaluate(k=>{window.reportOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===k)throw new DOMException('Synthetic report-photo quota failure','QuotaExceededError');return window.reportOriginalSet.call(this,key,value)}},key)
  await resident.getByRole('button',{name:'Submit route report',exact:true}).click();await modal().getByRole('alert').filter({hasText:'No report was submitted.'}).waitFor();assert.deepEqual(await stored(),beforeAttachment);assert.equal(await modal().locator('.report-reference-photo img').count(),1)
  await resident.evaluate(()=>{Storage.prototype.setItem=window.reportOriginalSet});await submit()
  const sent=await stored(),photoReport=sent.reports.at(-1),photo=photoReport.reference_photo
  assert.ok(photo.data_url.startsWith('data:image/jpeg;base64,/9j/'));assert.ok(photo.data_url.length<=300000);assert.equal(photo.capture_time,null);assert.equal(photo.source,'resident_upload')
  assert.equal(sent.current_version,beforeAttachment.current_version);assert.deepEqual(sent.snapshots,beforeAttachment.snapshots)
  await inbox();await record(photoReport.report_id).locator('.report-reference-photo img').waitFor();assert.equal(await record(textOnly.report_id).locator('.report-reference-photo').count(),0)
  assert.equal(await record(photoReport.report_id).locator('img').getAttribute('src'),photo.data_url)
  await record(photoReport.report_id).getByRole('button',{name:'View larger photo',exact:true}).click();assert.equal(await record(photoReport.report_id).getByRole('button',{name:'Reduce photo',exact:true}).getAttribute('aria-expanded'),'true')
  await record(photoReport.report_id).getByRole('button',{name:'Reduce photo',exact:true}).click();await developer.setViewportSize({width:1440,height:1300});await record(photoReport.report_id).screenshot({path:path.join(out,'02-developer-reference-review.png')});await developer.setViewportSize({width:1440,height:1000})
  // Reload preserves attachment and normal acceptance publishes only mixed shade, not point photos.
  await enter(developer,'Developer');await inbox();assert.equal(await record(photoReport.report_id).locator('img').getAttribute('src'),photo.data_url)
  await record(photoReport.report_id).getByLabel(`Report review note — ${photoReport.report_id}`,{exact:true}).fill('Synthetic review: considered saved route, description and attached photo.');await record(photoReport.report_id).getByRole('button',{name:'Accept report',exact:true}).click()
  await resident.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).reports.some(r=>r.reference_photo&&r.review_status==='verified'),key)
  assert.equal((await stored()).reports.find(r=>r.report_id===photoReport.report_id).reference_photo.data_url,photo.data_url)
  await resident.waitForFunction(()=>document.querySelector('[data-segment-id="DEMO-REF-001"] .campus-shade-stroke')?.getAttribute('stroke')==='#BD8B16')
  await resident.locator('[data-campus-node-id="MAIN-GATE"]').focus();await resident.keyboard.press('Enter');assert.ok((await resident.locator('.point-photo-panel img').getAttribute('src')).endsWith('/main-gate.jpg'));await resident.getByRole('button',{name:'Close point photo panel',exact:true}).click()
  const acceptedVersion=(await stored()).current_version
  await report('Synthetic separate reference to reject.');await attach();await submit();const rejectedId=(await stored()).reports.at(-1).report_id
  await record(rejectedId).waitFor();await record(rejectedId).getByLabel(`Report review note — ${rejectedId}`,{exact:true}).fill('Synthetic rejection: attachment is a reference, not conclusive evidence.');await record(rejectedId).getByRole('button',{name:'Reject report',exact:true}).click()
  assert.equal((await stored()).current_version,acceptedVersion);assert.equal((await stored()).reports.find(r=>r.report_id===rejectedId).reference_photo.data_url,photo.data_url)
  // Phone upload/removal and form close remain reachable, without horizontal overflow.
  await resident.setViewportSize({width:390,height:844});await report('Synthetic phone reference preview.');await attach();await modal().locator('.report-reference-photo').scrollIntoViewIfNeeded()
  assert.equal(await resident.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await resident.screenshot({path:path.join(out,'03-mobile-report-photo.png')})
  await resident.getByRole('button',{name:'Remove report photo',exact:true}).click();await resident.getByRole('button',{name:'Close report form',exact:true}).click();assert.equal(await resident.evaluate(()=>document.body.style.overflow),'')
  await developer.setViewportSize({width:390,height:844});await record(rejectedId).scrollIntoViewIfNeeded();assert.equal(await developer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await record(rejectedId).screenshot({path:path.join(out,'04-mobile-developer-review.png')})
  assert.deepEqual(errors,[])
  const result={status:'passed',normalEntry:base+'/',photoReportId:photoReport.report_id,encodedPreviewCharacters:photo.data_url.length,checks:['reports without photos still submit normally','optional photo preview, removal and larger Developer view','unsupported/corrupt/oversized files rejected; continue without photo allowed','failed persistent save keeps modal/attachment and creates no partial report','attachment binds to its own saved report and survives reload','photo submission alone leaves baseline unchanged','Developer acceptance preserves attachment and publishes only saved route mixed shade','Developer rejection preserves reference without changing baseline','report attachments never replace published map-point photos','phone report/review layouts have no horizontal overflow; modal close restores scroll'],pageErrors:errors}
  await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)})
