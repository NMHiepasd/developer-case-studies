# Bug Report: Race Condition on Rapid Cart Quantity Modification

| Field | Detail |
| :--- | :--- |
| **Bug ID** | `BUG-001` |
| **Title** | Rapid consecutive clicks on quantity `+` / `-` causes cart price desync |
| **Severity** | **High** (Data Integrity & Financial Calculation Discrepancy) |
| **Priority** | **P1 - Urgent** |
| **Component** | Checkout / Cart Slide-out / `v-quantity-changer` |
| **Reported By** | Junior Developer / QA |
| **Environment** | Chrome 128 / macOS & Windows / Staging Web Environment |
| **Associated PR** | `fix/cart-quantity-debounce-lock` |

---

## 1. Description & Business Impact
When customers or operations staff click the quantity increment button quickly (e.g. clicking 4–5 times in under 1 second), multiple asynchronous `POST /api/checkout/cart/update` requests fire concurrently. Due to intermittent network variance, response packets can arrive out of order. Consequently, an earlier response (e.g., quantity = 2) can overwrite a later response (quantity = 5), showing the customer an incorrect price and generating order payload mismatches at checkout.

---

## 2. Steps to Reproduce
1. Navigate to `/shop/checkout` or open the Mini-Cart slide-over drawer with at least 1 item in the cart.
2. Open Chrome DevTools > Network tab (optionally set throttling to "Fast 3G").
3. Rapidly click the `+` button 5 times within 400 milliseconds.
4. Observe the network request waterfalls and the rendered subtotal.

---

## 3. Expected Result
- The quantity indicator shows `6`.
- Exactly one debounced request (or properly queued requests) synchronizes the state with the backend.
- The subtotal reflects 6 items with 100% calculation accuracy.

---

## 4. Actual Result
- The UI counter displays `6`, but the subtotal jumps erratically between 2x and 5x item prices.
- The final displayed total corresponds to request #3 instead of the latest request #5 because request #3 took 450ms while request #5 finished in 180ms.

---

## 5. Root Cause Analysis (RCA)
- The click handler directly invoked `this.updateItemQuantity(itemId, newQty)` without:
  1. A debouncing interval.
  2. Cancelling stale pending HTTP requests via `AbortController`.
  3. A temporary mutation lock (`isSyncing = true`).

---

## 6. Edge Cases Checked
- [x] Rapid click to `0` or below (Should prompt removal confirmation instead of negative quantities).
- [x] Network disconnection during the rapid click burst (UI reverts gracefully with error toast).
- [x] Exceeding maximum warehouse inventory stock (Client blocks `+` when `currentQty >= stockAvailable`).

---

## 7. Verification & Proof of Fix
- **Automated Test:** Added Playwright test in `tests/checkout-quantity-race-condition.spec.ts`.
- **Pass Status:** 100% passed across Chromium, Firefox, and WebKit engines.
- **Manual Verification:** Verified on staging preview branch with Network throttling enabled.
