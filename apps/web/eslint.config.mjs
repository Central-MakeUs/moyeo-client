import pluginQuery from '@tanstack/eslint-plugin-query';
import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [...nextJsConfig, ...pluginQuery.configs['flat/recommended']];
