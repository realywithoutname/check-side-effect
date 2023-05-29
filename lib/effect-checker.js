"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checker = exports.logEffectFile = exports.addSideEffect = exports.renameEffectFile = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var babel_plugin_1 = require("./babel-plugin");
var walk_files_1 = require("./walk-files");
var fileExts = ['.js', '.ts', '.jsx', '.tsx'];
var excludeExts = ['.css', '.less', '.scss'];
function checkFiles(dir) {
    var messages = [];
    var checkEffectPlugin = (0, babel_plugin_1.getCheckPlugin)({ sourceDir: dir, messages: messages });
    var config = (0, babel_plugin_1.safeConfig)({
        plugins: [checkEffectPlugin],
    });
    function checker(file) {
        var ext = path_1.default.extname(file);
        if (excludeExts.includes(ext))
            return;
        if (file.includes('.d.ts'))
            return;
        require('@babel/core').transformFileSync(file, config);
    }
    checker.messages = messages;
    return checker;
}
function checkEffect(dir) {
    var packagePath = path_1.default.join(process.cwd(), 'package.json');
    if (!fs_1.default.existsSync(packagePath)) {
        console.log("".concat(process.cwd(), " \u76EE\u5F55\u4E0D\u5B58\u5728 package.json\uFF0C\u8BF7\u5728\u6709 package.json \u7684\u76EE\u5F55\u6267\u884C\u547D\u4EE4"));
        return [];
    }
    var targetDir = path_1.default.join(process.cwd(), dir);
    if (!fs_1.default.existsSync(targetDir)) {
        console.log("".concat(targetDir, " \u76EE\u5F55\u4E0D\u5B58\u5728"));
        return [];
    }
    var checker = checkFiles(targetDir);
    (0, walk_files_1.walkSync)(targetDir, function (filePath) {
        if (!fileExts.includes(path_1.default.extname(filePath)))
            return;
        checker(filePath);
    });
    var unKnownEffectFiles = checker.messages;
    try {
        var sideEffects_1 = require(packagePath).sideEffects;
        if (sideEffects_1 && sideEffects_1.length) {
            unKnownEffectFiles = unKnownEffectFiles.filter(function (file) {
                var hasMatch = sideEffects_1.some(function (testString) {
                    var test = new RegExp("".concat(testString.replaceAll('*', '.*').replaceAll('/', '\\/')));
                    return test.test(file[0]);
                });
                return !hasMatch;
            });
        }
    }
    catch (error) { }
    return unKnownEffectFiles;
}
function renameEffectFile(_a) {
    var extName = _a.ext, dir = _a.dir;
    var files = checkEffect(dir).map(function (_a) {
        var file = _a[0];
        return file;
    });
    Array.from(new Set(files)).forEach(function (file) {
        var ext = path_1.default.extname(file);
        var basename = path_1.default.basename(file, ext);
        var dirname = path_1.default.dirname(file);
        fs_1.default.renameSync(file, path_1.default.join(dirname, "".concat(basename, ".").concat(extName).concat(ext)));
    });
}
exports.renameEffectFile = renameEffectFile;
function addSideEffect(_a) {
    var dir = _a.dir;
    var unKnownEffectFiles = checkEffect(dir);
    var pkgPath = path_1.default.join(process.cwd(), 'package.json');
    if (!fs_1.default.existsSync(pkgPath))
        return console.log("".concat(process.cwd(), " \u76EE\u5F55\u4E0B\u6CA1\u6709 package.json \u6587\u4EF6"));
    var packageJson = require(path_1.default.join(process.cwd(), 'package.json'));
    var sideEffects = Array.isArray(packageJson.sideEffects) ? packageJson.sideEffects : [];
    unKnownEffectFiles.forEach(function (_a) {
        var file = _a[0];
        var sortFile = path_1.default.relative(process.cwd(), file);
        sideEffects.push(sortFile);
    });
    if (sideEffects.length) {
        packageJson.sideEffects = sideEffects;
        fs_1.default.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    }
}
exports.addSideEffect = addSideEffect;
function getMessages(unKnownEffectFiles) {
    return unKnownEffectFiles
        .map(function (_a) {
        var file = _a[0], line = _a[1], code = _a[2];
        var sortFile = path_1.default.relative(path_1.default.join(process.cwd()), file);
        return [
            "\u001B[37m ".concat(sortFile).concat(line ? ":".concat(line) : ''),
            "> \u001B[31m ".concat((code === null || code === void 0 ? void 0 : code.length) > 80 ? code.substring(0, 40) + '...' : code),
        ].join(' ');
    })
        .join('\n');
}
function logEffectFile(_a) {
    var dir = _a.dir;
    var unKnownEffectFiles = checkEffect(dir);
    console.log(getMessages(unKnownEffectFiles));
}
exports.logEffectFile = logEffectFile;
function checker(file) {
    var checker = checkFiles(path_1.default.dirname(file));
    checker(file);
    if (checker.messages.length) {
        console.log(getMessages(checker.messages));
    }
    process.exit(checker.messages.length);
}
exports.checker = checker;
