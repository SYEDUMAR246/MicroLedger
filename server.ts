import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import {parseExpenseInput} from './src/lib/expense-parser';
import {parseReceiptText} from './src/lib/receipt-parser';
import {readReceiptImage} from './src/lib/receipt-ocr';
import {localDate,validDate} from './src/lib/finance';
dotenv.config();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const PORT=process.env.PORT?parseInt(process.env.PORT,10):3000;
app.use(express.json({limit:'14mb'}));
app.post('/api/parse-expense',async(req,res)=>{
 try{
  const {text,image,currentDate,currentTime}=req.body??{};
  if((text!==undefined&&(typeof text!=='string'||text.length>4000))||(image!==undefined&&(!image||typeof image.data!=='string'||!/^image\/(png|jpeg|webp)$/.test(image.mimeType))))return res.status(400).json({status:'error',message:'Provide an expense note or PNG, JPEG or WebP receipt.'});
  const date=validDate(currentDate)?currentDate:localDate();const time=typeof currentTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(currentTime)?currentTime:new Date().toTimeString().slice(0,5);
  if(image){const text=await readReceiptImage(image);return res.json(parseReceiptText(text,date,time));}
  return res.json(parseExpenseInput(text,undefined,date,time));
 }catch(error){return res.json({status:'error',message:error instanceof Error?error.message:'Could not read the receipt. Try a clearer photo or enter the details manually.'});}
});
app.use((error:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>res.status(400).json({status:'error',message:error.type==='entity.too.large'?'This receipt is too large. Choose a smaller photo.':'Could not read this request. Please retry.'}));
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
