import fs from 'fs';
import path from 'path';
import os from 'os';

const pRaw = path.join(os.homedir(), 'Downloads', 'IMG_9767.JPEG');
const pHoja = path.join(os.homedir(), 'Downloads', 'Guillermo', 'Hojas', 'Hoja 02.jpeg');

console.log('Raw exists:', fs.existsSync(pRaw), fs.statSync(pRaw).size);
console.log('Hoja exists:', fs.existsSync(pHoja), fs.statSync(pHoja).size);
