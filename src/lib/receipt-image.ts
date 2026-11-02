export async function prepareReceiptImage(file:File):Promise<{name:string;mimeType:string;data:string;preview:string}>{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPG or WebP photo. Export HEIC images as JPG first.');
 if(file.size>10*1024*1024)throw new Error('Choose a receipt photo smaller than 10 MB.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  const scale=Math.min(1,2000/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
  const context=canvas.getContext('2d');if(!context||!canvas.width||!canvas.height)throw new Error('This image could not be opened.');
  context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  const preview=canvas.toDataURL('image/jpeg',.92);return {name:file.name,mimeType:'image/jpeg',data:preview.split(',')[1],preview};
 }finally{URL.revokeObjectURL(url);}
}
