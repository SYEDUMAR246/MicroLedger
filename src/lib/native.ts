import {Capacitor, registerPlugin} from '@capacitor/core';
import {Camera, CameraResultType, CameraSource} from '@capacitor/camera';
import {Directory, Encoding, Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {parseReceiptText} from './receipt-parser';
import {prepareReceiptImage} from './receipt-image';

export const isAndroid = Capacitor.getPlatform() === 'android';
const phone = registerPlugin<{
  recognize(options: {data: string}): Promise<{text: string}>;
  dictate(): Promise<{text: string}>;
}>('LedgerPhone');

export async function scanOnPhone(data: string, date: string, time: string) {
  const result = await phone.recognize({data});
  return parseReceiptText(result.text, date, time);
}

export async function takeReceiptPhoto() {
  const photo = await Camera.getPhoto({source: CameraSource.Camera, resultType: CameraResultType.Uri,
    quality: 90, width: 2000, height: 2000, correctOrientation: true, saveToGallery: false});
  if (!photo.webPath) throw new Error('Could not open the camera photo.');
  const blob = await (await fetch(photo.webPath)).blob();
  return prepareReceiptImage(new File([blob], 'Receipt.jpg', {type: blob.type || 'image/jpeg'}));
}

export async function dictateOnPhone() {
  return (await phone.dictate()).text;
}

export async function shareBackup(text: string, filename: string) {
  const result = await Filesystem.writeFile({path: filename, data: text, directory: Directory.Cache,
    encoding: Encoding.UTF8});
  await Share.share({title: 'MicroLedger backup', files: [result.uri], dialogTitle: 'Save your MicroLedger backup'});
}
