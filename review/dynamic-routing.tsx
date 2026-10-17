// Independent review entry. Production App.tsx remains untouched pending owner agreement.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { LandingHero } from '../src/landing/LandingHero'
import { DeveloperWorkspace } from '../src/workflow/DeveloperWorkspace'
import { useWorkflow } from '../src/workflow/useWorkflow'
import { CalculatedResident } from '../src/routing/CalculatedResident'
import '../src/styles.css'
function Preview(){
  const [mode,setMode]=React.useState<'home'|'resident'|'developer'>('home')
  const {state,commit,notice}=useWorkflow()
  return mode==='home'?<LandingHero onEnter={setMode}/>:mode==='resident'?<CalculatedResident back={()=>setMode('home')} state={state} commit={commit} notice={notice}/>:<DeveloperWorkspace back={()=>setMode('home')} state={state} commit={commit} notice={notice}/>
}
createRoot(document.getElementById('root')!).render(<Preview/> )
