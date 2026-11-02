import {createWorker,OEM,type Worker} from 'tesseract.js';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const language=require('@tesseract.js-data/eng') as {langPath:string;gzip:boolean};
let busy=false;
export async function readReceiptImage(image:{data:string;mimeType:string}):Promise<string>{
 if(busy)throw new Error('A receipt is already being read. Please retry in a moment.');
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)||image.data.length>12*1024*1024)throw new Error('Choose a receipt image smaller than 8 MB.');
 const bytes=Buffer.from(image.data,'base64');
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 if(!(image.mimeType==='image/png'&&png||image.mimeType==='image/jpeg'&&jpeg||image.mimeType==='image/webp'&&webp))throw new Error('This file is not a readable PNG, JPEG or WebP image.');
 busy=true;let expired=false;let worker:Worker|undefined;let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  const task=(async()=>{worker=await createWorker('eng',OEM.LSTM_ONLY,{langPath:language.langPath,gzip:true,cacheMethod:'none',errorHandler:()=>{}});if(expired){await worker.terminate();throw new Error('Reading took too long.');}const result=await worker.recognize(bytes);if(result.data.confidence<35)throw new Error('The receipt is too blurry. Try a clearer photo.');return result.data.text;})();
  return await Promise.race([task,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new Error('Reading took too long. Try a smaller, sharper photo.'));},30000);})]);
 }finally{clearTimeout(timer);if(worker)await worker.terminate();busy=false;}
}
