# QA Engineering & Bug Fixing Portfolio Showcase

This repository serves as a technical portfolio demonstrating practical experience in **Web Application QA, E2E Testing with Playwright, Bug Reproduction, Root-Cause Analysis, and Bug Fixing** with modern JavaScript/TypeScript and AI-assisted engineering workflows.

---

## 🎯 Profile Overview

- **Role Focus:** Junior Developer / QA & Bug Fixing / IT Support
- **Core Technologies:** JavaScript, TypeScript, Vue.js / React, Node.js, REST APIs, Webhooks, SQL
- **Testing & Tools:** Playwright, Vitest / Jest, Postman, Git & GitHub PR workflows
- **AI-Assisted Workflow:** Claude Code, Cursor, AI agents for log analysis, test scenario generation, and regression verification

---

## 📌 Featured Case Studies

### Case Study 1: Race Condition & Out-of-Order API Responses in Cart/Checkout

#### 1. Problem Statement
When users rapidly clicked the quantity increment/decrement (`+` / `-`) buttons on the checkout and cart pages, multiple asynchronous API requests were fired concurrently. Due to network latency variations, earlier requests occasionally resolved after later ones, overwriting the final cart state and causing total price calculation mismatches between the frontend UI and the backend database.

#### 2. Reproduction & Diagnostic Steps
- Created an automated **Playwright E2E test** ([see test script](tests/checkout-quantity-race-condition.spec.ts)) simulating rapid user interactions (5 clicks within 300ms) with network throttling.
- Inspected Network payloads and intercepted WebSocket/HTTP traffic to identify out-of-order race conditions.
- Documented findings in a structured bug report ([see Bug Report](docs/BUG-001-checkout-race-condition.md)).

#### 3. Root Cause & Solution
- **Root Cause:** Lack of debouncing and absence of request cancellation or sequential queuing for state synchronization.
- **Solution:** 
  1. Implemented client-side **Debounce** (300ms) with **Optimistic UI Updates** to provide instantaneous tactile feedback.
  2. Integrated `AbortController` / sequence ID tracking to cancel obsolete in-flight requests before dispatching the latest payload.
  3. Added an atomic state lock (`isUpdating`) to prevent double-submissions during checkout submission.

#### 4. Verification
- All automated Playwright assertions passed under throttled 3G and normal network conditions.
- Zero state desynchronization reported across cart, mini-cart drawer, and checkout review.

---

### Case Study 2: State Synchronization & Client-Side Validation in Dynamic Form Workflows

#### 1. Problem Statement
In multi-step operational workflows (e.g., warehouse inventory transfers and configurable product variation editing):
1. **Invalid State Selection:** Users could inadvertently select the source warehouse as the destination warehouse, failing only on final backend submission.
2. **State Confusion:** Editing nested variations in slide-out drawers saved changes to temporary memory, but lacked explicit status indicators differentiating local uncommitted edits from persisted database records.

#### 2. Solution Implemented
- Added reactive, real-time client validation: dynamically filtering and disabling options where `option.id === sourceWarehouseId` with clear contextual helper text.
- Unified notification and badge states: clearly indicating uncommitted pending changes with tactile feedback before final form submission.
- Validated payload schemas against API contracts using Postman to prevent broken webhook and payload errors.

---

## 🤖 AI-Assisted Engineering Workflow

I actively leverage AI tools (**Claude Code, Claude 3.5 Sonnet, Cursor**) to accelerate daily engineering and QA tasks:

1. **Bug Investigation & Log Parsing:** Using AI to inspect complex server logs, stack traces, and component trees to rapidly isolate culprit methods.
2. **Test Generation:** Prompting AI with User Stories and API schemas to generate comprehensive test case matrices, boundary conditions, and edge cases.
3. **Rigorous Manual & Automated Verification:** Code generated or suggested by AI is never accepted blindly; every fix is checked out on a dedicated Git branch, validated against existing test suites, and verified in a preview/staging environment before opening a PR.

---

## 📁 Repository Structure

```text
├── docs/
│   └── BUG-001-checkout-race-condition.md   # Sample production-grade bug report
├── src/
│   └── cart-quantity-manager.ts            # Solution code: debounced & optimistic state manager
├── tests/
│   └── checkout-quantity-race-condition.spec.ts # Playwright E2E test suite
└── README.md
```

---

## 📬 Contact & Links

- **GitHub:** [https://github.com/](https://github.com/) *(Update with your username)*
- **Email:** *(Update with your email)*
