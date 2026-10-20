/** Browser decoding/re-encoding strips EXIF/location metadata and bounds local storage use. */
export async function preparePointPhoto(file:File):Promise<string>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPEG, PNG or WebP image. SVG and other file types are not supported.')
  if(!file.size||file.size>10*1024*1024)throw new Error('Choose an image no larger than 10 MB.')
  let bitmap:ImageBitmap
  try{bitmap=await createImageBitmap(file)}catch{throw new Error('This file could not be decoded as an image.')}
  try{
    if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>50000000)throw new Error('Choose an image with no more than 50 megapixels.')
    const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas')
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale))
    const context=canvas.getContext('2d');if(!context)throw new Error('Image preparation is unavailable in this browser.')
    context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height)
    for(const quality of [.82,.7,.58,.45]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=300000)return data}
    throw new Error('This image is too detailed for a local reference preview. Choose a smaller image.')
  }finally{bitmap.close()}
}
