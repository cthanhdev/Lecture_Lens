// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*'],
    rules: {
      // React Native Reanimated shared values mutate .value directly
      'react-hooks/immutability': 'off',
      // Allow standard ref access during animation setup
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
    },
  },
]);
