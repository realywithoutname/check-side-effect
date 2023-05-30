### side-effects-checker
`side-effects-checker` 是一个基于 babel 检查代码副作用的工具。只检查 `js`，`jsx`，`ts`，`tsx` 文件

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

### 我理解的 sideEffects
sideeffect 的作用是让 webpack 可以跳过中间商，直接触达导出模块；带来的问题是如果中间商加了内容，会被忽略，可能导致逻辑执行不到。测试下来在 webpack 中他是这样运行的：

```ts
// module/a.js
import 'xxx' // 如果这个模块没有声明有副作用，则这行代码会被忽略
export function A() {}

// module/b.effect.js
export { A } from './a'

export function B() {}

// module/index.js
import 'xxx' // index.js 没有声明有副作用，这行代码会被忽略，所以不建议 reexport 和这样的写法在一个模块出现
export { B } from './b.effect' // 当应用中使用了 B 的时候，尽管 a.js 在 b.effect.js 没有使用，也会参与构建（默认情况下 webpack 认为所有的 NPM 包都有副作用，所以所有文件都参与构建）
export { A } from './a' // 当应用中只使用 A 的时候，b.effect.js 不会参与构建
```
