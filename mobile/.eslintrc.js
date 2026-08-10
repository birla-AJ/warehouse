module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
