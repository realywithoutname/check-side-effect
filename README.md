### side-effects-checker
`side-effects-checker` 是一个基于 babel 检查代码副作用的工具。

```sh
$ npm i side-effects-checker -g
```

#### CLI
```sh
$ side-effects-checker your/file.js
```
检查文件是否有副作用，可以用于 husky 阻止提交，如：
```json
{
  ...
  "lint-staged": {
    ...,
    "*.{js,jsx,tsx,ts}": [
      "eslint --fix",
      "side-effects-checker"
    ],
    ...
  },
  ...
}
```
> 所有的命令都只会输出根据 package.json 中 `sideEffects` 的声明不匹配的文件

#### 查找文件
将在控制台打印出当前 `src`(或者通过 -d 指定) 目录下所有有副作用的文件，推荐用于源码查找。

```sh
$ side-effects-checker find [-d src]
```

#### 重命名文件
将把当前 `src`(或者通过 -d 指定) 目录下所有有副作用的文件重命名为新的文件，如 `index.ts` 将命名为 `index.effect.ts`。可以通过 `--ext` 指定中间名（**不会自动修改依赖**）。推荐用于源码副作用较多的场景，更名后再在 `package.json` 中通过通配符指定（可能手动改更舒服，编辑器可以自动修改依赖）。

```sh
$ side-effects-checker rename [--ext effect] [-d src]
```

#### 自动添加
可以把 `es`(或者通过 -d 指定) 目录下所有有副作用的文件添加到 `package.json` 的 `sideEffects` 数组中。用于产物的目录，不是很推荐
```sh
$ side-effects-checker add [-d es]
```


