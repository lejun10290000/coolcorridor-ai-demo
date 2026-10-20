import { useEffect, useRef, useState } from 'react'
import type { PointPhoto } from '../pointPhotos/catalog'
import { photoURL, pointName } from '../pointPhotos/catalog'
import type { WalkSession } from './walk'
import { walkProgress } from './walk'
import './walk.css'

export function WalkPanel({walk,photos,currentVersion,next,previous,exit}:{walk:WalkSession;photos:Record<string,PointPhoto>;currentVersion:string;next:()=>void;previous:()=>void;exit:()=>void}){
  const progress=walkProgress(walk),target=progress.next??progress.current,photo=photos[target]
  const [failed,setFailed]=useState(false)
  const heading=useRef<HTMLHeadingElement>(null)
  useEffect(()=>{setFailed(false)},[target,photo?.src])
  useEffect(()=>{heading.current?.focus({preventScroll:true})},[walk.next_index])
  return <section id="resident-walk-progress" className="resident-walk-panel" aria-label="Step-by-step walk" data-walk-next={progress.next??''} data-walk-current={progress.current} data-walk-version={walk.route.dataset_version} data-walk-segments={walk.route.segment_ids.join(',')}>
    <span className="chip">ROUTE LOCKED · DEMO WALKTHROUGH</span>
    <p>{pointName(walk.route.node_ids[0])} → {pointName(walk.route.node_ids[walk.route.node_ids.length-1])}</p>
    <p>{walk.route.objective==='shortest'?'Shortest route':'Most shaded practical route'} · {progress.confirmed} of {progress.total} points reached</p>
    <progress aria-label="Confirmed walk progress" value={progress.confirmed} max={progress.total}/>
    <div aria-live="polite" aria-atomic="true"><h2 ref={heading} tabIndex={-1}>{progress.complete?'Destination reached':'Next point'}</h2><h3>{pointName(target)}</h3></div>
    {!progress.complete&&<p>From your last confirmed point: <b>{pointName(progress.current)}</b>.</p>}
    {photo?<><div className="resident-walk-photo">{failed?<p>Reference image could not load.</p>:<img src={photoURL(photo)} alt={`Walk point reference: ${pointName(target)}`} onError={()=>setFailed(true)}/>}</div><details><summary>Reference photo source</summary><p>{photo.source_note}</p></details></>:<p className="resident-walk-no-photo">No reference photo is published for this point. Use its map label to identify it.</p>}
    {progress.complete?<p>You confirmed arrival at the destination. Finish to unlock route planning.</p>:<p>Head to this point, then press <b>Next</b> only when you have reached it. This does not track your location.</p>}
    <div className="wf-actions"><button type="button" disabled={progress.confirmed===0} onClick={previous}>Previous point</button>{progress.complete?<button type="button" onClick={exit}>Finish walk</button>:<button type="button" onClick={next}>Next</button>}</div>
    <p><a className="resident-jump-link" href="#resident-campus-map">{progress.complete?'View destination on map':'View next point on map'}</a></p>
    {!progress.complete&&<button className="link" type="button" onClick={exit}>Exit walk / change route</button>}
    {currentVersion!==walk.route.dataset_version&&<p className="notice">A newer map is published. This walk keeps your selected route and map version. Exit to compare routes using the latest map.</p>}
    <p className="resident-walk-caution">Illustrative point-by-point preview, not live navigation. Paths and access are unsurveyed. Photos are location references; they do not verify shade or safe passage.</p>
    <details><summary>Locked route points</summary><ol>{walk.route.node_ids.map((id,i)=><li key={id} aria-current={id===progress.next?'step':undefined}>{pointName(id)}{i<walk.next_index?' · confirmed':id===progress.next?' · next':''}</li>)}</ol><p>Map version: {walk.route.dataset_version}. Refreshing or leaving Resident mode ends this walkthrough.</p></details>
  </section>
}
