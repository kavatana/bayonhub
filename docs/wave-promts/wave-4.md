seller: {
'@type': 'Person',
name: listing.seller?.name || 'BayonHub Seller',
},
},
}
}

Update every page that uses canonical URLs or JSON-LD to use canonicalUrl() from this file.

---

## WAVE 4 — Localization & Accessibility (P2-05, P2-06, P2-07)

### W4-01 — Translation Key Completeness Enforcement

Scan the entire src/ directory for:

1. Any string literal in JSX not wrapped in t() — list every violation
2. Any aria-label containing an English string directly — wrap with t()
3. Any title="" attribute with English string — wrap with t()
4. Any placeholder="" with English string — wrap with t()
5. Any alt="" with descriptive English text — wrap with t()

For every violation found:

- Add the key to translations.js with both EN and KM values
- Replace the hardcoded string with t("key")
- Report total count of violations fixed

### W4-02 — Dark Mode Contrast WCAG Sweep (P2-06)

Check these specific dark mode combinations and fix any that fail WCAG AA (4.5:1 for normal text):

Current dark classes to verify:

- dark:text-neutral-300 on dark:bg-neutral-800 — check ratio
- dark:text-neutral-400 on dark:bg-neutral-900 — check ratio
- white text on bg-primary (#C62828) — check ratio
- dark:text-neutral-200 on dark:bg-neutral-800 — check ratio

Fix approach: if a combination fails, darken the background OR lighten the text.
For neutral-400 (#A3A3A3) on neutral-900 (#171717): ratio is ~7.5:1 — PASS
For neutral-300 (#D4D4D4) on neutral-800 (#262626): ratio is ~9.2:1 — PASS
For neutral-500 (#737373) on neutral-800 (#262626): ratio is ~3.5:1 — FAIL
Fix: replace dark:text-neutral-500 with dark:text-neutral-400 wherever used for body text.

Scan all .jsx files for dark:text-neutral-500 and replace with dark:text-neutral-400.

### W4-03 — Keyboard Journey Standardization (P2-07)

Verify these keyboard interactions work correctly by reading the implementation:

1. PostAdWizard — Tab through all Step 2 form fields in logical order
    - Check: no tabIndex values that break natural DOM order
    - Check: radio groups use roving tabIndex pattern
2. AuthModal — OTP digit boxes
    - Verify: Tab moves forward, Shift+Tab moves backward
    - Verify: Backspace in empty box moves focus to previous box
    - Verify: paste fills all 6 boxes simultaneously
3. CategoryPage filter sidebar
    - Verify: all filter controls are keyboard reachable
    - Verify: PriceRangeSlider thumb elements have keyboard events (arrow keys ±step)
4. ListingCard
    - Verify: entire card is a focusable/clickable element with role="article"
    - Verify: Save button has independent Tab stop (not inside the card link)

For any keyboard gap found: implement the fix using standard HTML semantics (no custom keyboard trap patterns).