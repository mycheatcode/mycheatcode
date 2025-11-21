# Testing & Quality Assurance Guide

This document explains how to prevent bugs and regressions in MyCheatCode.

## 🎯 Testing Strategy

We use a multi-layered approach:

1. **Manual Testing Checklist** - Run before every deploy
2. **Automated E2E Tests** - Run automatically before deploys
3. **Smoke Tests** - Quick validation that critical pages load

## 📋 Manual Testing Checklist

**Location**: `TESTING_CHECKLIST.md`

Before every production deploy, open this file and verify each checkbox:

```bash
# Open the checklist
open TESTING_CHECKLIST.md
```

**Critical flows to verify:**
- ✅ New cheat code saves correctly with "Save to My Codes" button
- ✅ Game doesn't send "3/0" message when quit immediately
- ✅ Practice scenarios match the cheat code topic
- ✅ Relatable topics show green overlay after use
- ✅ Momentum animates in green

## 🤖 Automated Tests

### Running Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with visual UI (recommended for development)
npm run test:e2e:ui

# Run tests with browser visible (for debugging)
npm run test:e2e:headed

# Run only smoke tests (quick validation)
npm run test:smoke

# Run only critical path tests
npm run test:critical
```

### Test Structure

```
e2e/
  ├── critical-flows.spec.ts    # Core user flows that must never break
  └── [add more test files here]
```

### Writing New Tests

When you add a new feature:

1. **Add test to checklist** - Document expected behavior in `TESTING_CHECKLIST.md`
2. **Write E2E test** - Create automated test in `e2e/` directory
3. **Commit together** - Test and feature should be committed together

**Example test:**

```typescript
test('New feature works correctly', async ({ page }) => {
  await page.goto('/my-feature');

  // Verify expected behavior
  await expect(page.locator('text=Feature Title')).toBeVisible();

  // Test interactions
  await page.click('[data-testid="action-button"]');
  await expect(page.locator('text=Success')).toBeVisible();
});
```

## 🚀 Pre-Deploy Process

### Automated Pre-Deploy Checks

The `predeploy` script runs automatically:

```bash
npm run predeploy
```

This will:
1. Build the app (catches TypeScript/build errors)
2. Run smoke tests (validates critical pages load)

### Manual Pre-Deploy Checklist

**Required before every deploy:**

1. ✅ Run `npm run predeploy` - Must pass
2. ✅ Go through `TESTING_CHECKLIST.md` - All critical flows must work
3. ✅ Test on mobile AND desktop
4. ✅ Check console for errors
5. ✅ Verify no known regressions

### If Tests Fail

**DO NOT DEPLOY** if:
- Build fails
- Smoke tests fail
- Any critical flow in checklist fails
- Console shows errors

**Instead:**
1. Fix the issue
2. Re-run tests
3. Verify fix works
4. Then deploy

## 🔄 Continuous Integration (Future)

### GitHub Actions Setup (TODO)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

This will:
- Run tests on every push
- Block PRs if tests fail
- Catch regressions before they reach production

## 📊 Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This shows:
- Which tests passed/failed
- Screenshots of failures
- Test execution timeline
- Error messages

## 🐛 Debugging Failed Tests

### View test in UI mode

```bash
npm run test:e2e:ui
```

### Run single test file

```bash
npx playwright test critical-flows.spec.ts
```

### Run single test

```bash
npx playwright test -g "New cheat code shows"
```

### Enable debug mode

```bash
PWDEBUG=1 npm run test:e2e
```

## 🎯 Testing Best Practices

### DO:
✅ Write tests for features that keep breaking
✅ Test critical user flows end-to-end
✅ Use data-testid attributes for stable selectors
✅ Keep tests independent (no shared state)
✅ Run tests before every commit

### DON'T:
❌ Skip tests because they're "too slow"
❌ Disable failing tests instead of fixing them
❌ Test implementation details
❌ Create flaky tests (use proper waits)
❌ Deploy without running tests

## 📝 Adding Test Coverage

### Priority 1 - Critical Flows (MUST HAVE)
These flows must never break:

1. ✅ Chat code creation & save
2. ✅ Practice game flow
3. ✅ My Codes page
4. ⏳ Relatable topics selection
5. ⏳ Momentum tracking

### Priority 2 - Important Features (SHOULD HAVE)
- User profile updates
- Chat history navigation
- Code favoriting
- Code archiving

### Priority 3 - Nice to Have
- UI animations
- Mobile responsiveness
- Edge cases

## 🔒 Regression Prevention Checklist

When a bug is found:

1. ✅ **Document it** - Add to `TESTING_CHECKLIST.md`
2. ✅ **Fix it** - Resolve the issue
3. ✅ **Test it** - Write E2E test to catch it
4. ✅ **Commit together** - Test + fix in same commit
5. ✅ **Verify** - Ensure test catches the bug

This ensures the bug never comes back!

## 🚨 Emergency Procedures

### If production breaks:

1. **Identify the issue** - What broke?
2. **Rollback immediately** - Vercel dashboard → Previous deploy
3. **Fix locally** - Resolve the issue
4. **Test thoroughly** - Run full test suite
5. **Deploy again** - With confidence

### If tests are blocking deploy:

**DO NOT** skip tests or disable them.

**Instead:**
1. Determine if test is valid (catching real bug) or flaky
2. If catching real bug → Fix the bug
3. If flaky → Fix the test to be stable
4. Re-run tests
5. Deploy when green

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Setup](https://playwright.dev/docs/ci)

## 🆘 Getting Help

If you're stuck:

1. Check test output/screenshots
2. Run in UI mode to debug
3. Review this guide
4. Check Playwright docs

---

**Remember**: Tests are not optional. They protect your users and your time.

Every bug that reaches production costs time, credibility, and user trust.
Take 5 minutes to test now, or spend hours fixing user issues later.
