import { useCallback, useEffect, useRef, useState } from 'react'
import { initialPhotoLibrary, publishedPhotos } from './model'
import type { PhotoLibrary } from './model'
import { readPhotoLibrary, updatePhotoLibrary } from './store'
export function usePointPhotos(){
  const [library,setLibrary]=useState(initialPhotoLibrary),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const revision=useRef(-1),channel=useRef<BroadcastChannel|null>(null)
  const apply=useCallback((next:PhotoLibrary)=>{if(next.revision>=revision.current){revision.current=next.revision;setLibrary(next)}},[])
  const refresh=useCallback(async()=>{try{apply(await readPhotoLibrary());setReady(true);setError('')}catch(e){setError(e instanceof Error?e.message:'Could not read point photos.')}},[apply])
  useEffect(()=>{
    void refresh()
    try{if(typeof BroadcastChannel!=='undefined'){channel.current=new BroadcastChannel('coolcorridor-point-photos');channel.current.onmessage=()=>void refresh()}}catch{channel.current=null}
    const storage=(e:StorageEvent)=>{if(e.key==='coolcorridor-point-photos-update')void refresh()}
    const focus=()=>void refresh()
    window.addEventListener('storage',storage);window.addEventListener('focus',focus)
    return()=>{channel.current?.close();window.removeEventListener('storage',storage);window.removeEventListener('focus',focus)}
  },[refresh])
  const commit=useCallback(async(update:(s:PhotoLibrary)=>PhotoLibrary)=>{
    setBusy(true);setError('')
    try{const next=await updatePhotoLibrary(update);apply(next);try{channel.current?.postMessage(next.revision)}catch{/* Storage/focus listeners remain available. */}try{localStorage.setItem('coolcorridor-point-photos-update',`${next.revision}:${Date.now()}`)}catch{/* BroadcastChannel still notifies other open tabs. */}return true}
    catch(e){setError(e instanceof Error?e.message:'Could not save point photos.');return false}
    finally{setBusy(false)}
  },[apply])
  return {library,published:publishedPhotos(library),ready,busy,error,commit,retry:refresh}
}
export type PointPhotoController=ReturnType<typeof usePointPhotos>
