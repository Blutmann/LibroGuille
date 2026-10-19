import fs from 'fs';
import path from 'path';

const p = 'C:\\Users\\tblutman\\Desktop\\ORBIS\\Libros';
if (fs.existsSync(p)) {
  const files = fs.readdirSync(p);
  console.log('ORBIS count:', files.length);
  console.log('Sample files:', files.slice(0, 10));
}
