// figma-plugin.config.js

module.exports = function (buildOptions) {
  return {
    ...buildOptions,
    plugins: buildOptions.plugins.filter(function (plugin) {
      return plugin.name !== 'preact-compat';
    }),
    // 최신 문법 호환을 위해 target 변경
    target: 'es2020',

    // global을 window로 치환 (가끔 필요한 경우)
    define: {
      global: 'window',
    },
  };
};
