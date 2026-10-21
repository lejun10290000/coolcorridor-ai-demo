import { useState } from 'react'
import { LandingHero } from './landing/LandingHero'
import { useWorkflow } from './workflow/useWorkflow'
import { DeveloperWorkspace } from './workflow/DeveloperWorkspace'
import { CalculatedResident } from './routing/CalculatedResident'
import { usePointPhotos } from './pointPhotos/usePointPhotos'
import './styles.css'

export default function App() {
  const [mode, setMode] = useState<'home'|'resident'|'developer'>('home')
  const { state, commit, notice } = useWorkflow()
  const pointPhotos = usePointPhotos()
  if (mode === 'home') return <LandingHero onEnter={setMode}/>
  return mode === 'resident'
    ? <CalculatedResident back={()=>setMode('home')} openDeveloper={()=>setMode('developer')} state={state} commit={commit} notice={notice} pointPhotos={pointPhotos}/>
    : <DeveloperWorkspace back={()=>setMode('home')} openResident={()=>setMode('resident')} state={state} commit={commit} notice={notice} pointPhotos={pointPhotos}/>
}
