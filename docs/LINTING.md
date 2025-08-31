# ESLint Status and Cleanup Plan

## Current Status (Post-Cleanup)

- **Total Issues**: 446 (down from 466 baseline)
- **Fixed Issues**: 20 high-impact violations

## Issues Fixed

### ✅ Critical Issues Resolved (20 fixed)

1. **17 no-useless-escape**: Fixed unnecessary escape characters in regex patterns
   - `backend/src/controllers/FedexController.ts`: Phone number validation regex
   - `backend/src/routes/authRoutes.ts`: Phone validation schemas
   - `backend/src/utils/validators.ts`: Phone schema regex
   - `e2e/tests/trade.e2e.spec.ts`: Currency format regex

2. **3 react-hooks/rules-of-hooks**: Fixed React hooks called conditionally
   - `src/components/trading/CommodityInfoPanel.tsx`: Moved hook call before try-catch
   - `src/pages/CommodityDetail.tsx`: Restructured to call hooks before early returns

## Remaining Technical Debt

### 🔶 Existing Issues (446 remaining)

1. **289 @typescript-eslint/no-explicit-any**: Legacy `any` types throughout codebase
   - Primarily in backend services, controllers, models, and test files
   - These should be typed gradually during feature development

2. **44 @typescript-eslint/no-require-imports**: CommonJS imports in test files
   - Mostly in `*.test.ts` files for mocking purposes
   - Consider migrating to ES6 import syntax with appropriate Jest configuration

3. **Other Minor Issues**:
   - 1 no-prototype-builtins
   - 1 @typescript-eslint/no-unsafe-function-type
   - 1 @typescript-eslint/no-namespace
   - 2 react-hooks/exhaustive-deps

## Cleanup Strategy

### Phase 1: Type Safety (Future)

- Replace `any` types with proper interfaces during feature development
- Focus on controllers and services first (highest impact)
- Add stricter TypeScript compiler options gradually

### Phase 2: Import Modernization (Low Priority)

- Convert `require()` imports to ES6 `import` statements in tests
- Update Jest configuration to support ES6 modules consistently

### Phase 3: React Optimization (Optional)

- Address dependency array warnings in hooks
- Consider React 18 optimizations

## ESLint Configuration Notes

No rules were disabled during this cleanup. All fixes maintain existing code standards while resolving violations through proper code structure improvements.
