#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var effect_checker_1 = require("./effect-checker");
var packagePath = path_1.default.join(__dirname, '../package.json');
var packagejson = JSON.parse(fs_1.default.readFileSync(packagePath, 'utf8'));
var program = new commander_1.Command('side-effects-checker');
program.version(packagejson.version);
program.arguments('[file]');
program.action(effect_checker_1.checker);
program
    .command('find')
    .option('-d, --dir [dirname]', '目录名称', 'src')
    .description('Find the side effect files')
    .action(effect_checker_1.logEffectFile);
program
    .command('rename')
    .option('-e, --ext [effect]', '加在文件名和后缀之间', 'effect')
    .option('-d, --dir [dirname]', '目录名称', 'src')
    .description('Rename the side effect files')
    .action(effect_checker_1.renameEffectFile);
program
    .command('add')
    .option('-d, --dir [dirname]', '目录名称', 'es')
    .description('Add the side effect files into package.jon')
    .action(effect_checker_1.addSideEffect);
program.parse(process.argv);
