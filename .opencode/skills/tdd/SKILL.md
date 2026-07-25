---
name: tdd
description: "Test-driven development workflow: Red-Green-Refactor cycle, commit discipline, branch workflow, and note-keeping"
---

# Test-Driven Development (TDD)

Follow the Red-Green-Refactor cycle for feature development with proper git discipline.

## When to Use

- Starting a new feature or bugfix
- Writing code that needs reliable test coverage
- Any task benefiting from test-first methodology

## Workflow

### 1. Preparation
- Ensure you're on the main branch before starting
- Understand existing code before making changes
- Create a feature branch
- Create a notes file under `notes/features/<feature-name>.md` for long-term memory

### 2. Red-Green-Refactor Cycle (one test at a time)
1. **Red** — Write a failing test for new desired behavior. Run it; it should fail. Do NOT modify non-test code.
2. **Green** — Write the simplest code to make all tests pass. Do NOT modify tests. Commit when all tests pass.
3. **Refactor** — Improve code organization, readability, and maintainability. Keep tests passing. Commit.

### 3. Commit Message Format
- First line: summary, max 50 characters
- Second line: blank
- Body: max 72 characters per line
- Include issue link if applicable
- Omit Claude/assistant footers

### 4. Completion
- Push branch to remote
- Submit a pull request for each feature/bug/refactor
