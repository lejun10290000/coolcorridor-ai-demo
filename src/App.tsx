import { useState } from 'react'
import { LandingHero } from './landing/LandingHero'
import { useWorkflow } from './workflow/useWorkflow'
import { DeveloperWorkspace } from './workflow/DeveloperWorkspace'
import { CalculatedResident } from './routing/CalculatedResident'
import './styles.css'

export default function App() {
  const [mode, setMode] = useState<'home'|'resident'|'developer'>('home')
  const { state, commit, notice } = useWorkflow()
  if (mode === 'home') return <LandingHero onEnter={setMode}/>
  return mode === 'resident'
    ? <CalculatedResident back={()=>setMode('home')} state={state} commit={commit} notice={notice}/>
    : <DeveloperWorkspace back={()=>setMode('home')} state={state} commit={commit} notice={notice}/>
}
