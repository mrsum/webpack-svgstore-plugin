module.exports = {
  root: true,
  plugins: ['standard', 'prettier'],
  env: {
    browser: true,
    es6: true,
    mocha: true
  },
  extends: ['standard', 'prettier', 'prettier/standard'],
  rules: {
    'global-require': 'off',
    'import/no-dynamic-require': 'off',
    'prettier/prettier': 'error',
    curly: 'error',
    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: true,
        allowBlockStart: true,
        allowObjectStart: true,
        allowArrayStart: true
      }
    ],
    'max-len': ['error', { code: 120, ignoreUrls: true, ignoreComments: true }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-mixed-operators': 'error',
    'no-unexpected-multiline': 'error',
    'no-unused-vars': [
      'error',
      {
        varsIgnorePattern: 'should|expect'
      }
    ],
    'no-var': 'error',
    strict: ['error', 'global']
  }
};
