import { decodePhotoLibrary, initialPhotoLibrary } from './model'
import type { PhotoLibrary } from './model'
let connection:Promise<IDBDatabase>|undefined
function database(){
  if(!connection)connection=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open('coolcorridor-point-photos-v1',1)
    request.onupgradeneeded=()=>request.result.createObjectStore('library')
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();connection=undefined};resolve(db)}
    request.onerror=()=>{connection=undefined;reject(new Error('Photo storage is unavailable. Your existing map data is unchanged.'))}
    request.onblocked=()=>{connection=undefined;reject(new Error('Close other old app tabs to open point-photo storage.'))}
  }).catch(error=>{connection=undefined;throw error})
  return connection
}
export async function readPhotoLibrary(){
  const db=await database()
  return new Promise<PhotoLibrary>((resolve,reject)=>{const tx=db.transaction('library','readonly'),r=tx.objectStore('library').get('current');r.onsuccess=()=>{try{resolve(r.result===undefined?initialPhotoLibrary():decodePhotoLibrary(r.result))}catch(e){reject(e)}};r.onerror=()=>reject(new Error('Could not read saved point photos.'))})
}
/** Read/update/write inside one transaction so concurrent tabs cannot lose each other's edits. */
export async function updatePhotoLibrary(update:(s:PhotoLibrary)=>PhotoLibrary){
  const db=await database()
  return new Promise<PhotoLibrary>((resolve,reject)=>{
    const tx=db.transaction('library','readwrite'),store=tx.objectStore('library'),request=store.get('current')
    let next:PhotoLibrary,problem:unknown
    request.onsuccess=()=>{try{next=decodePhotoLibrary(update(request.result===undefined?initialPhotoLibrary():decodePhotoLibrary(request.result)));store.put(next,'current')}catch(e){problem=e;tx.abort()}}
    tx.oncomplete=()=>resolve(next)
    tx.onabort=()=>reject(problem??new Error('Could not save point photos (storage unavailable or full). No photo was published.'))
    tx.onerror=()=>{problem??=new Error('Could not save point photos (storage unavailable or full). No photo was published.')}
  })
}
