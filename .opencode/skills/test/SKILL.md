---
name: test
description: "Unit testing best practices checklist for testing internal logic — not API endpoints or routing behavior"
---

# Unit Testing Best Practices

Checklist for writing focused, maintainable unit tests that validate internal logic.

## When to Use

- Writing tests for services, helpers, classes, or pure functions
- Ensuring test quality and coverage standards
- Reviewing existing test suites

## Checklist

### Context Verification
- [ ] Understand the purpose of the component from behavior and usage, not just names
- [ ] Identify critical inputs and outputs (expected, edge, malformed, unexpected)
- [ ] Target the logic layer — NOT API routes, handlers, or HTTP abstractions
- [ ] Do NOT simulate `fetch`, `NextRequest`, `Express` routes unless explicitly instructed
- [ ] Don't touch other modules, files, or features unless clearly necessary
- [ ] Don't add dependencies unless there's a strong test-specific reason

### Test Structure
- [ ] Test core behavior, not wiring
- [ ] Follow Given–When–Then format
- [ ] Name tests clearly: `should_<action>_when_<condition>_given_<context>`

### Test Cases
- [ ] Cover valid and invalid inputs
- [ ] Test error handling at the logic level (exceptions, return contracts)
- [ ] Ensure side effects are observable (mock/spy on loggers, DBs, queues)
- [ ] Test concurrency/timing logic where applicable

### Cleanliness & Isolation
- [ ] Mock all I/O (DBs, APIs, file systems, message queues)
- [ ] Keep internal logic real — don't mock business rules or pure functions
- [ ] No magic values — use named constants
- [ ] Clean test state between runs — deterministic and parallel-safe

### Deep Assertions
- [ ] Check real output contracts (return values, thrown errors, logged events)
- [ ] Test for type and shape
- [ ] Guard against silent changes

### Maintainability
- [ ] Avoid duplicated test code — use factories, builders, setup helpers
- [ ] Mock via public interfaces, never private internals
- [ ] Test business outcomes, not implementation steps
