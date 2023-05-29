#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { addSideEffect, logEffectFile, renameEffectFile, checker } from './effect-checker';

const packagePath = path.join(__dirname, '../package.json');
const packagejson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const program = new Command('side-effects-checker')

program.version(packagejson.version);
program.arguments('[file]')
program.action(checker)

program
  .command('find')
  .option('-d, --dir [dirname]', '目录名称', 'src')
  .description('Find the side effect files')
  .action(logEffectFile);

program
  .command('rename')
  .option('-e, --ext [effect]', '加在文件名和后缀之间', 'effect')
  .option('-d, --dir [dirname]', '目录名称', 'src')
  .description('Rename the side effect files')
  .action(renameEffectFile);

program
  .command('add')
  .option('-d, --dir [dirname]', '目录名称', 'es')
  .description('Add the side effect files into package.jon')
  .action(addSideEffect);

program.parse(process.argv);
