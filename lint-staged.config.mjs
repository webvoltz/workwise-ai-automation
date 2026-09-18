const lintStagedConfig = {
  '*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{css,json,less,md,mdx,sass,scss,yaml,yml}': 'prettier --write',
};

export default lintStagedConfig;
