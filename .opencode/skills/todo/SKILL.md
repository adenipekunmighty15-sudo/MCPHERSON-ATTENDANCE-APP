---
name: todo
description: "Manage project todos in a todos.md file — add, complete, remove, list, and track due dates"
---

# Project Todo Manager

Manage tasks in a `todos.md` file at the project root.

## When to Use

- Tracking project tasks and action items
- Managing personal or team todos within the repo
- Keeping a lightweight task list without external tools

## Commands

| Action | Example | Description |
|--------|---------|-------------|
| Add | `add "Fix navigation bug"` | Add a new todo (optionally with due date: `add "task" tomorrow`) |
| Complete | `complete 1` | Mark todo as done, move to Completed section |
| Remove | `remove 2` | Delete a todo entirely |
| Undo | `undo 1` | Move completed todo back to Active |
| List | `list` or `list N` | Show all (or N) todos numbered |
| Past Due | `past due` | Show active tasks past their due date |
| Next | `next` | Show the next active task (respects due dates) |

## Todo File Format

```markdown
# Project Todos

## Active
- [ ] Task description here | Due: MM/DD/YYYY
- [ ] Another task

## Completed
- [x] Finished task | Done: MM/DD/YYYY
- [x] Another completed task | Due: MM/DD/YYYY | Done: MM/DD/YYYY
```

## Behavior
- Number todos when displaying (1, 2, 3...)
- Keep Active list sorted descending by due date
- Tasks with due dates come before tasks without
- Create `todos.md` if it doesn't exist
- Show helpful feedback after each action
