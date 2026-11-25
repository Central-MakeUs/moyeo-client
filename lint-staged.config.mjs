const WEB_ESLINT =
  'eslint --fix --max-warnings=0 --no-warn-ignored --config apps/web/eslint.config.mjs';
const WEB_PRETTIER = 'prettier --write --config apps/web/prettier.config.mjs';
const DOCS_ESLINT =
  'eslint --fix --max-warnings=0 --no-warn-ignored --config apps/docs/eslint.config.mjs';
const NATIVE_ESLINT =
  'eslint --fix --max-warnings=0 --no-warn-ignored --config apps/native/eslint.config.mjs';
const UI_ESLINT =
  'eslint --fix --max-warnings=0 --no-warn-ignored --config packages/ui/eslint.config.mjs';
const PRETTIER = 'prettier --write';

export default {
  'apps/web/**/*.{js,jsx,ts,tsx}': [WEB_ESLINT, WEB_PRETTIER],
  'apps/web/**/*.{css,md,mdx,json}': [WEB_PRETTIER],
  'apps/docs/**/*.{js,jsx,ts,tsx}': [DOCS_ESLINT, PRETTIER],
  'apps/native/**/*.{js,jsx,ts,tsx}': [NATIVE_ESLINT, PRETTIER],
  'packages/ui/**/*.{js,jsx,ts,tsx}': [UI_ESLINT, PRETTIER],
  '*.{js,mjs,json,md,mdx,yml,yaml,css}': [PRETTIER],
};
