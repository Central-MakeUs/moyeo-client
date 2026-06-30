import expoConfigBase from 'eslint-config-expo/flat.js';

/**
 * A custom ESLint configuration for Expo apps.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const expoConfig = [
  ...expoConfigBase,
  {
    ignores: ['dist/**'],
  },
];
