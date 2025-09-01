module.exports = {
  // Format TypeScript/JavaScript files (skip ESLint for now due to config issues)
  '*.{ts,tsx,js,jsx}': [
    'prettier --write'
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

