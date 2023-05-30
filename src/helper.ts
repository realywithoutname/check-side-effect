import path from 'path';

export function fileHasEffect(file) {
  const packagePath = path.join(
    process.cwd(),
    'package.json',
  )

  const { sideEffects }: { sideEffects: string[] } = require(packagePath);

  const hasMatch = sideEffects.some((testString) => {
    const test = new RegExp(
      `${testString.replaceAll('*', '.*').replaceAll('/', '\\/')}`,
    );

    return test.test(file);
  });

  return !hasMatch;
}
