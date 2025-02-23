module.exports = function (buildOptions) {
  return {
    ...buildOptions,
    target: 'chrome67', // 최신 브라우저 타겟으로 변경
  };
};
