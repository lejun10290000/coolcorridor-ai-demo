import { useEffect, useRef, useState } from 'react'
import type { PointPhoto } from '../pointPhotos/catalog'
import { photoURL, pointName } from '../pointPhotos/catalog'
import type { WalkSession } from './walk'
import { walkProgress } from './walk'
import './walk.css'

export function WalkPanel({walk,photos,currentVersion,next,previous,exit,onComplete}:{walk:WalkSession;photos:Record<string,PointPhoto>;currentVersion:string;next:()=>void;previous:()=>void;exit:()=>void;onComplete?:()=>void}){
  const progress=walkProgress(walk),target=progress.next??progress.current,photo=photos[target]
  const [failed,setFailed]=useState(false)
  const heading=useRef<HTMLHeadingElement>(null)
  useEffect(()=>{setFailed(false)},[target,photo?.src])
  useEffect(()=>{heading.current?.focus({preventScroll:true})},[walk.next_index])
  return <section id="resident-walk-progress" className="resident-walk-panel" aria-label="Step-by-step walk" data-walk-next={progress.next??''} data-walk-current={progress.current} data-walk-version={walk.route.dataset_version} data-walk-segments={walk.route.segment_ids.join(',')}>
    <div className="walk-heading"><span className="eyebrow">WALKTHROUGH MODE</span><button type="button" className="walk-exit" onClick={exit}>Exit walk</button></div>
    <div className="walk-progress-heading"><span>Route progress</span><strong>{progress.confirmed} / {progress.total} points reached</strong></div>
    <div className="walk-progress-track" role="progressbar" aria-label="Confirmed walk progress" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.confirmed} aria-valuetext={`${progress.confirmed} of ${progress.total} points manually confirmed`}><span className="walk-progress-fill" data-empty={progress.confirmed===0} style={{width:`${progress.total?progress.confirmed/progress.total*100:0}%`}}/></div>
    <div className="walk-current-card" aria-live="polite" aria-atomic="true"><span className="eyebrow">{progress.complete?'FINAL POINT':'NEXT POINT'}</span><h2 ref={heading} tabIndex={-1}>{progress.complete?'Destination reached':'Next point'}</h2><h3>{pointName(target)}</h3><p>{progress.complete?'All route points manually confirmed.':<>From your last confirmed point: <b>{pointName(progress.current)}</b>.</>}</p>
      {photo?<><div className="resident-walk-photo">{failed?<p>Reference image could not load.</p>:<img src={photoURL(photo)} alt={`Walk point reference: ${pointName(target)}`} onError={()=>setFailed(true)}/>}</div><details><summary>Reference photo source</summary><p>{photo.source_note}</p></details></>:<p className="resident-walk-no-photo">No reference photo is published for this point. Use its map label to identify it.</p>}
      <a className="resident-jump-link" href="#resident-campus-map">View {progress.complete?'destination':'next point'} on map ↗</a>
    </div>
    <ol className="walk-timeline" aria-label="Route points">{walk.route.node_ids.map((id,i)=><li key={id} className={i<walk.next_index?'confirmed':id===progress.next?'upcoming':'later'} aria-current={id===progress.next?'step':undefined}><span className="walk-timeline-icon" aria-hidden="true">{i<walk.next_index?'✓':i+1}</span><span>{pointName(id)}</span></li>)}</ol>
    <div className="wf-actions walk-actions"><button type="button" disabled={progress.confirmed===0} onClick={previous}>← Previous point</button>{progress.complete?<button type="button" className="resident-primary" onClick={onComplete??exit}>Finish walk</button>:<button type="button" className="resident-primary" onClick={next}>Next point →</button>}</div>
    <p className="resident-walk-instruction">{progress.complete?'Review the completed route or return to route selection.':'Press Next only after reaching the point. This does not track your location.'}</p>
    {currentVersion!==walk.route.dataset_version&&<p className="notice">A newer map is published. This walk keeps your selected route and map version. Exit to compare routes using the latest map.</p>}
    <p className="resident-walk-caution">Illustrative point-by-point preview, not live navigation. Paths and access are unsurveyed. Photos are location references; they do not verify shade or safe passage.</p>
    <details><summary>Locked route information</summary><p>{pointName(walk.route.node_ids[0])} → {pointName(walk.route.node_ids[walk.route.node_ids.length-1])} · {walk.route.objective==='shortest'?'Shortest route':'Most shaded practical route'} · map version {walk.route.dataset_version}. Refreshing or leaving Resident mode ends this walkthrough.</p></details>
  </section>
}
