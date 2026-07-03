import baseConfig from '@repo/prettier-config';
import * as tailwindPlugin from 'prettier-plugin-tailwindcss';

export default {
  ...baseConfig,
  plugins: [tailwindPlugin],
  tailwindStylesheet: './src/_app/globals.css',
};
