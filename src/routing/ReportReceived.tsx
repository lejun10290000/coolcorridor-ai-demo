import { useEffect, useRef } from 'react'

export function ReportReceived({onClose}:{onClose:()=>void}){
  const closeButton=useRef<HTMLButtonElement>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const overflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    closeButton.current?.focus()
    return ()=>{document.body.style.overflow=overflow;previous?.focus()}
  },[])
  return <div className="modal resident-success-modal" role="dialog" aria-modal="true" aria-labelledby="report-received-heading" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onClose()}else if(e.key==='Tab'){e.preventDefault();closeButton.current?.focus()}}}>
    <section className="dialog report-received"><div className="report-success-orbit" aria-hidden="true"><span>✓</span></div><span className="chip">REPORT RECEIVED</span><h2 id="report-received-heading">Thank you for helping improve our walkways.</h2><p className="report-status">Status: Pending Developer Review</p><p>Saved in this browser profile for Developer review. No campus team is notified. Accepting the report publishes mixed shade on its links; it does not record a repair.</p><button ref={closeButton} type="button" className="resident-primary" onClick={onClose}>Back to map <span aria-hidden="true">→</span></button></section>
  </div>
}
