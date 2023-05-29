import fs from 'fs';
import path from 'path';
import { getCheckPlugin, safeConfig } from './babel-plugin';
import { walkSync } from './walk-files';

const fileExts = ['.js', '.ts', '.jsx', '.tsx'];
const excludeExts = ['.css', '.less', '.scss'];

type message = [file: string, line: string | number | undefined, code: string];


function checkFiles(dir: string) {
  const messages: message[] = [];
  const checkEffectPlugin = getCheckPlugin({ sourceDir: dir, messages })
  const config = safeConfig({
    plugins: [checkEffectPlugin],
  });

  function checker(file) {
    const ext = path.extname(file)
    if (excludeExts.includes(ext)) return;
    if (file.includes('.d.ts')) return;

    require('@babel/core').transformFileSync(file, config);
  }

  checker.messages = messages

  return checker
}
 
function checkEffect(dir: string) {
  const packagePath = path.join(
    process.cwd(),
    'package.json',
  )

  if (!fs.existsSync(packagePath)) {
    console.log(`${process.cwd()} 目录不存在 package.json，请在有 package.json 的目录执行命令`);
    return [];
  }

  const targetDir = path.join(process.cwd(), dir)
  if (!fs.existsSync(targetDir)) {
    console.log(`${targetDir} 目录不存在`);
    return [];
  }

  const checker = checkFiles(targetDir)

  walkSync(targetDir, (filePath) => {
    if (!fileExts.includes(path.extname(filePath))) return;
    checker(filePath)
  });

  let unKnownEffectFiles = checker.messages;
  try {
    const { sideEffects }: { sideEffects: string[] } = require(packagePath);

    if (sideEffects && sideEffects.length) {
      unKnownEffectFiles = unKnownEffectFiles.filter((file) => {
        const hasMatch = sideEffects.some((testString) => {
          const test = new RegExp(
            `${testString.replaceAll('*', '.*').replaceAll('/', '\\/')}`,
          );

          return test.test(file[0]);
        });

        return !hasMatch;
      });
    }
  } catch (error) {}

  return unKnownEffectFiles;
}

export function renameEffectFile({ ext: extName, dir }) {
  const files = checkEffect(dir).map(([file]) => file);
  Array.from(new Set(files)).forEach((file) => {
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const dirname = path.dirname(file)
    fs.renameSync(file, path.join(dirname, `${basename}.${extName}${ext}`));
  });
}

export function addSideEffect({ dir }) {
  const unKnownEffectFiles = checkEffect(dir);
  const pkgPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath))
    return console.log(`${process.cwd()} 目录下没有 package.json 文件`);
  const packageJson = require(path.join(process.cwd(), 'package.json'));

  const sideEffects = Array.isArray(packageJson.sideEffects) ? packageJson.sideEffects : [];
  unKnownEffectFiles.forEach(([file]) => {
    const sortFile = path.relative(process.cwd(), file)

    sideEffects.push(sortFile);
  });

  if (sideEffects.length) {
    packageJson.sideEffects = sideEffects
    fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2), 'utf-8')
  }
}

function getMessages(unKnownEffectFiles: message[]) {
  return unKnownEffectFiles
    .map(([file, line, code]) => {
      const sortFile = path.relative(
        path.join(process.cwd())
        , file)
      return [
        `\x1b[37m ${sortFile}${line ? `:${line}` : ''}`,
        `> \x1b[31m ${code?.length > 80 ? code.substring(0, 40) + '...' : code}`,
      ].join(' ');
    })
    .join('\n')
}

export function logEffectFile({ dir }) {
  const unKnownEffectFiles = checkEffect(dir);
  console.log(getMessages(unKnownEffectFiles));
}

export function checker(file) {
  const checker = checkFiles(path.dirname(file))

  checker(file)

  if (checker.messages.length) {
    console.log(getMessages(checker.messages))
  }
  process.exit(checker.messages.length)
}
