# 🚀 PBCEx PR Workflow & Conventional Commits

## 📋 Overview

This document describes the complete PR workflow setup for PBCEx, including conventional commits, automated code review, and quality gates.

## 🔧 Tools Installed

### **Conventional Commits**
- **Commitlint**: Validates commit message format
- **Commitizen**: Interactive commit message creation
- **Husky**: Git hooks for pre-commit and commit-msg
- **lint-staged**: Pre-commit code formatting and linting

### **Code Quality**
- **Prettier**: Automatic code formatting
- **ESLint**: Code quality and style enforcement
- **Husky Hooks**: Automated quality checks

### **Automated Review**
- **CodeRabbit**: AI-powered code review and labeling
- **PR Templates**: Structured pull request creation

## 🚀 Getting Started

### **1. Install Dependencies**
```bash
# Install all development dependencies
npm install

# This will automatically run husky install via the prepare script
```

### **2. Verify Installation**
```bash
# Check that husky is installed
ls -la .husky/

# Should show:
# - pre-commit
# - commit-msg
```

## 📝 Conventional Commits

### **Commit Message Format**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### **Types**
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### **Examples**
```bash
feat: add user authentication system
fix(auth): resolve JWT token validation issue
docs: update API documentation
style: format code with prettier
refactor(api): restructure user endpoints
test: add integration tests for auth
chore: update dependencies
```

### **Using Commitizen**
```bash
# Instead of git commit, use:
npm run commit

# This will guide you through creating a conventional commit
```

## 🔒 Git Hooks

### **Pre-commit Hook**
- **Purpose**: Ensures code quality before commits
- **Actions**:
  - Format code with Prettier
  - Run ESLint with auto-fix
  - Stage formatted files

### **Commit-msg Hook**
- **Purpose**: Validates commit message format
- **Actions**:
  - Checks commit message against conventional commit rules
  - Rejects commits that don't follow the format

## 🧹 Code Formatting

### **Prettier Configuration**
- **File**: `.prettierrc`
- **Settings**:
  - Single quotes
  - 2-space indentation
  - 80 character line width
  - Trailing commas
  - Semicolons

### **Formatting Commands**
```bash
# Format all files
npx prettier --write .

# Format specific files
npx prettier --write src/**/*.{ts,tsx,js,jsx}

# Check formatting without changing files
npx prettier --check .
```

### **Prettier Ignore**
- **File**: `.prettierignore`
- **Excludes**: Build outputs, dependencies, environment files, etc.

## 🔍 Linting

### **ESLint Configuration**
- **Purpose**: Code quality and style enforcement
- **Rules**: TypeScript, React, and general best practices

### **Linting Commands**
```bash
# Lint all code
npm run lint

# Lint with auto-fix
npm run lint:fix

# Lint specific directories
npm run lint -- backend/src
npm run lint -- frontend/src
```

## 📋 Pull Request Workflow

### **1. Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

### **2. Make Changes & Commit**
```bash
# Make your code changes
# Then commit using conventional format
npm run commit
```

### **3. Push & Create PR**
```bash
git push origin feature/your-feature-name
# Create PR via GitHub interface
```

### **4. PR Template**
The PR template will automatically populate with:
- Description section
- Testing checklist
- Type of change selection
- Files changed list
- Breaking changes section
- Security considerations

### **5. Automated Review**
- **CodeRabbit**: AI-powered code review
- **Auto-labeling**: Based on file changes
- **Pre-review analysis**: Code quality, security, performance

## 🤖 CodeRabbit Integration

### **Features**
- **Automated Review**: AI-powered code analysis
- **Smart Labeling**: Automatic PR categorization
- **Pre-review Analysis**: Quality, security, and performance checks
- **Custom Rules**: PBCEx-specific validation rules

### **Auto-labeling**
- **frontend**: Frontend code changes
- **backend**: Backend code changes
- **docs**: Documentation updates
- **ci-cd**: CI/CD configuration changes
- **security**: Security-related changes
- **testing**: Test file changes

### **Custom Rules**
- **Environment Variables**: Warns about .env changes
- **Database Migrations**: Alerts about schema changes
- **API Changes**: Reminds about documentation updates
- **Feature Flags**: Highlights feature flag modifications

## 🧪 Quality Gates

### **Pre-commit Checks**
- ✅ Code formatting (Prettier)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)

### **PR Requirements**
- ✅ Conventional commit format
- ✅ Tests passing
- ✅ Environment validation
- ✅ Code review approval
- ✅ No linting errors

### **Automated Checks**
- ✅ GitHub Actions CI/CD
- ✅ CodeRabbit review
- ✅ Auto-labeling
- ✅ Security scanning

## 📚 Documentation

### **Generated Documentation**
- **Build Process**: How PBCEx was built
- **Commands Reference**: All available npm scripts
- **API Documentation**: OpenAPI specifications
- **Test Plans**: Testing strategy and coverage

### **Living Documentation**
- **README.md**: Quick start and overview
- **docs/**: Comprehensive documentation
- **API Specs**: OpenAPI definitions
- **Test Coverage**: Automated test reports

## 🚀 Best Practices

### **Commit Messages**
- Use conventional commit format
- Be descriptive and clear
- Reference issues when applicable
- Keep scope focused and relevant

### **Code Quality**
- Run tests before committing
- Ensure linting passes
- Format code with Prettier
- Follow TypeScript best practices

### **PR Process**
- Use descriptive PR titles
- Fill out all template sections
- Include testing instructions
- Respond to review feedback promptly

### **Branch Management**
- Use descriptive branch names
- Keep branches focused and small
- Delete merged branches
- Update main branch regularly

## 🔧 Configuration Files

### **Commitlint**
```js
// .commitlintrc.cjs
export default {
  extends: ['@commitlint/config-conventional'],
};
```

### **Lint-staged**
```js
// .lintstagedrc.cjs
export default {
  '*.{ts,tsx,js,jsx}': [
    'prettier --write',
    'eslint --fix',
    'git add'
  ],
  '*.{json,yaml,yml,md}': [
    'prettier --write',
    'git add'
  ],
  '*.sh': [
    'prettier --write --parser bash',
    'git add'
  ]
};
```

### **Husky Hooks**
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged

# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit $1
```

### **Prettier**
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## 🎯 Workflow Summary

### **Daily Development**
1. **Start**: `npm run dev:all`
2. **Code**: Make changes with hot reload
3. **Test**: Run tests for changes
4. **Commit**: `npm run commit` (conventional format)
5. **Push**: Create PR with template

### **Quality Assurance**
1. **Pre-commit**: Automatic formatting and linting
2. **Commit-msg**: Conventional commit validation
3. **PR Creation**: Template-guided PR creation
4. **Automated Review**: CodeRabbit analysis and labeling
5. **Human Review**: Team member review and approval

### **Continuous Integration**
1. **GitHub Actions**: Automated testing and building
2. **Environment Validation**: Configuration health checks
3. **Security Scanning**: Vulnerability detection
4. **Code Coverage**: Test coverage reporting

## 🏆 Benefits

### **Developer Experience**
- **Consistent Code**: Automated formatting and linting
- **Clear Commits**: Conventional commit format
- **Quality Gates**: Automated quality checks
- **Fast Feedback**: Immediate validation and feedback

### **Team Collaboration**
- **Structured PRs**: Template-guided PR creation
- **Automated Review**: AI-powered code analysis
- **Smart Labeling**: Automatic categorization
- **Quality Standards**: Consistent code quality

### **Project Health**
- **Living Documentation**: Always up-to-date docs
- **Test Coverage**: Comprehensive testing strategy
- **Security**: Automated security scanning
- **Performance**: Load testing and monitoring

---

**PBCEx Team** - Building the future of commodity trading 🚀

*This workflow ensures consistent code quality and smooth collaboration across the team.*
