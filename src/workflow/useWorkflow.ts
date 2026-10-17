import { useEffect, useRef, useState } from 'react'
import { initialWorkflow, storageKey } from './model'
import type { WorkflowState } from './model'
import { loadWorkflow } from './storage'

function restore(){try{const raw=localStorage.getItem(storageKey);return{...loadWorkflow(raw),raw}}catch{return{state:initialWorkflow(),raw:null,warning:'Local storage is unavailable. Changes will last for this session only.'}}}
export function useWorkflow(){
  const [loaded]=useState(restore)
  const [state,setState]=useState(loaded.state)
  const reference=useRef(state)
  const lastStoredRaw=useRef<string|null>(loaded.raw)
  const [notice,setNotice]=useState(loaded.warning)
  useEffect(()=>{
    const listener=(event:StorageEvent)=>{
      if(event.key!==storageKey)return
      const loaded=loadWorkflow(event.newValue)
      lastStoredRaw.current=event.newValue
      reference.current=loaded.state;setState(loaded.state);setNotice(loaded.warning||'Local workflow changed in another tab. Review the current inputs before continuing.')
    }
    window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener)
  },[])
  function commit(update:(s:WorkflowState)=>WorkflowState):boolean{
    try{
      try{
        const raw=localStorage.getItem(storageKey)
        if(raw!==lastStoredRaw.current){const other=loadWorkflow(raw);lastStoredRaw.current=raw;if(other.warning)throw new Error('Data changed in another tab and is invalid. Reload to recover safely.');if(JSON.stringify(other.state)!==JSON.stringify(reference.current)){reference.current=other.state;setState(other.state);throw new Error('Data changed in another tab. Review the refreshed state and repeat your action.')}}
      }catch(error){if(error instanceof Error&&error.message.startsWith('Data changed'))throw error}
      const next=update(reference.current)
      let warning=''
      try{const raw=JSON.stringify(next);localStorage.setItem(storageKey,raw);lastStoredRaw.current=raw}catch{warning='Could not save locally (storage blocked or full). This change is in-session only; do not rely on it after refresh.'}
      reference.current=next;setState(next);setNotice(warning);return true
    }catch(error){setNotice(error instanceof Error?error.message:'Could not apply this action.');return false}
  }
  return{state,commit,notice}
}
