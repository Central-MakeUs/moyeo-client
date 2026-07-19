import type { StorybookConfig } from '@storybook/nextjs-vite';
import remarkGfm from 'remark-gfm';
import { dirname, resolve } from 'path';

import { fileURLToPath } from 'url';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    {
      name: getAbsolutePath('@storybook/addon-docs'),
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  framework: {
    name: getAbsolutePath('@storybook/nextjs-vite'),
    options: {
      image: {
        excludeFiles: ['**/*.svg'],
      },
    },
  },
  staticDirs: ['../public'],
  viteFinal: async (viteConfig) => {
    const config = mergeConfig(viteConfig, {
      base: '/moyeo-client/',
      resolve: {
        alias: {
          '@': resolve(dirname(fileURLToPath(import.meta.url)), '../src'),
          '~storybook': resolve(dirname(fileURLToPath(import.meta.url))),
        },
      },
    });

    config.plugins = [
      svgr({
        include: '**/*.svg',
        svgrOptions: { svgo: false },
      }),
      ...(config.plugins ?? []),
    ];

    return config;
  },
};
export default config;
