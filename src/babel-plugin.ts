import babel from '@babel/core';
import path from 'path';

const fileExts = ['.js', '.ts', '.jsx', '.tsx'];
const cssExts = ['.css', '.less', '.scss'];

function getBinding(exp: any): string {
  try {
    if (exp.object.type !== 'Identifier') {
      return getBinding(exp.object);
    }

    return exp.object.name;
  } catch (e) {
    return '';
  }
}

function isSafeAssignmentExpression(p) {
  if (p.node.expression.type === 'AssignmentExpression') {
    const left = p.node.expression.left;
    let binding = '';
    if (left.type === 'Identifier') {
      binding = left.name;
    }

    if (left.type === 'MemberExpression') {
      binding = getBinding(left);
    }

    if (p.scope.hasBinding(binding)) return true;
  }
}

export function getCheckPlugin({ sourceDir, messages }) {
  return function checkEffectPlugin(): babel.PluginObj {
    return {
      visitor: {
        ImportDeclaration(p, state) {
          if (
            !state.filename ||
            !state.filename.includes(sourceDir) ||
            !fileExts.includes(path.extname(state.filename)) ||
            cssExts.some((ext) => p.node.source.value.endsWith(ext))
          )
            return;
          // import 'module'
          if (p.node.specifiers.length === 0) {
            const { code } = require('@babel/generator').default(p.node);
            messages.push([state.filename, p.node.loc?.start?.line || '', code, true]);
          }
        },
        ExpressionStatement(p, state) {
          if (
            !state.filename ||
            !state.filename.includes(sourceDir) ||
            !fileExts.includes(path.extname(state.filename))
          )
            return;
  
          if (p.parent.type === 'Program') {
            // a = 1
            // fn.a = 1
            // a.x.y = 1
            if (p.node.expression.type === 'AssignmentExpression' && isSafeAssignmentExpression(p)) return

            /**
             * 特殊处理枚举类型输出后的结果
             * export enum MARKERTYPE {
             *  LINE = 'line',
             *  CIRCLE = 'circle',
             *  SQUARE = 'square',
             * }
             */
            if (p.node.expression.type === 'CallExpression') {
              const fnBody = (() => {
                try {
                  return p.get('expression.callee.body.body')
                } catch (error) {}
              })()
              const shouldNext = !fnBody || fnBody.filter(path => {
                if (path && path.node.expression.type === 'AssignmentExpression' && !isSafeAssignmentExpression(path)) return true
              })?.length > 0

              if (!shouldNext) return;
            }
  
            const { code } = require('@babel/generator').default(p.node) as {
              code: string;
            };
            messages.push([state.filename, p.node.loc?.start?.line, `${code}`]);
          }
        },
      },
    };
  }
}

const resolve = (m: string) => {
  try {
    return require.resolve(m, {
      paths: [process.cwd()],
    });
  } catch (error) {}
};

export function safeConfig(defaultConfig: { plugins: any[] }) {
  const presets = [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ]
    .filter((m) => resolve(m))
    .map((m) => {
      if (m === '@babel/preset-env') {
        return [
          resolve(m),
          {
            modules: false,
          },
        ];
      }
      return resolve(m);
    });
  const plugins = [
    '@babel/plugin-proposal-decorators',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
  ]
    .filter((m) => resolve(m))
    .map((m) => {
      if (m === '@babel/plugin-proposal-decorators') {
        return [
          resolve(m),
          {
            legacy: true,
          },
        ];
      }
      return resolve(m);
    })
    .concat(defaultConfig.plugins);

  return {
    presets,
    plugins,
  };
}
