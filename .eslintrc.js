module.exports = {
  extends: [
    'react-app',
    'plugin:react-hooks/recommended'
  ],
  plugins: [
    'react-hooks'
  ],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
