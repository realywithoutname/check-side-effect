import fs from 'fs';
import path from 'path';

export function walkSync(dirPath: string, callback: (file: string) => void) {
  fs.readdirSync(dirPath, { withFileTypes: true }).forEach(function (dirent) {
    var filePath = path.join(dirPath, dirent.name);
    if (dirent.isFile()) {
      callback(filePath);
    } else if (dirent.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
}
