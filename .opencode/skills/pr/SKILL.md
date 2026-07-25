---
name: pr
description: "Create a branch, split changes into logical commits, and open a pull request with descriptive summary and test plan"
---

# Pull Request (PR)

Create a new branch, format files, analyze changes, split into logical commits, push to remote, and open a PR.

## When to Use

- Starting a new feature, bugfix, or refactor
- You need to commit and push changes with a proper PR
- Changes should be split into logical, independent commits

## Workflow

1. **Create branch** based on current changes or feature name
2. **Format** modified files using the project's formatter (Biome, Prettier, etc.)
3. **Analyze changes** and split into logical commits when appropriate:
   - Each commit focuses on a single logical change or feature
   - Keep related file changes together in the same commit
   - Separate refactoring from feature additions
   - Ensure each commit can be understood independently
4. **Write descriptive commit messages** for each logical unit
5. **Push branch** to remote
6. **Create PR** with proper summary, test plan, and description
