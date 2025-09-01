module.exports = {
  // Format and lint frontend TypeScript/JavaScript files only
  'src/**/*.{ts,tsx,js,jsx}': [
    'prettier --write',
    'eslint --fix'
  ],
  
  // Format JSON, YAML, Markdown files
  '*.{json,yaml,yml,md}': [
    'prettier --write'
  ],
  
  // Format package.json files
  'package*.json': [
    'prettier --write'
  ],
  
  // Format shell scripts (skip prettier for now to avoid parser issues)
  '*.sh': []
};
