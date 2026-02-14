// Babel plugin that transforms dynamic import() expressions into
// Promise.resolve(require(...)) so they work in jest 30's test
// environment without --experimental-vm-modules.
//
// Only used via the jest transform config -- not in production builds.

module.exports = function babelPluginDynamicImportToRequire() {
  return {
    visitor: {
      // Handle: await import('module')
      // Transforms to: Promise.resolve().then(() => require('module'))
      Import(path) {
        const callExpression = path.parentPath;
        if (!callExpression.isCallExpression()) return;

        const [source] = callExpression.node.arguments;
        if (!source) return;

        callExpression.replaceWith(
          callExpression.scope.buildUndefinedNode()
        );

        // Build: Promise.resolve().then(() => require(source))
        const { types: t } = require('@babel/core');
        const requireCall = t.callExpression(t.identifier('require'), [source]);
        const thenCallback = t.arrowFunctionExpression([], requireCall);
        const promiseResolve = t.callExpression(
          t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
          [],
        );
        const thenCall = t.callExpression(
          t.memberExpression(promiseResolve, t.identifier('then')),
          [thenCallback],
        );

        callExpression.replaceWith(thenCall);
      },
    },
  };
};
