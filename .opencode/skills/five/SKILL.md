---
name: five
description: "Apply Five Whys root cause analysis to drill from symptoms to systemic root causes"
---

# Five Whys Analysis

Root cause analysis technique that iteratively asks "why" to drill down from symptoms to fundamental causes.

## When to Use

- Investigating bugs, incidents, or recurring issues
- Understanding why a process or system failed
- Moving beyond surface-level symptoms to systemic fixes

## Method

1. **Start with the problem statement** — describe the symptom clearly
2. **Ask "Why did this happen?"** and document the answer
3. **For each answer, ask "Why?" again**
4. **Continue for at least 5 iterations** or until the true root cause is reached
5. **Validate** by working backwards from root cause to symptom
6. **Propose solutions** that address the root cause, not the symptoms

## Example

```
Problem: Application crashes on startup
Why 1: Database connection fails
Why 2: Connection string is invalid
Why 3: Environment variable not set
Why 4: Deployment script missing env setup
Why 5: Documentation didn't specify env requirements
Root Cause: Missing deployment documentation
```

## Notes
- Don't stop at symptoms; dig for systemic issues
- Multiple root causes may exist — explore different branches
- Consider both technical and process-related causes
- The magic isn't exactly 5 whys — stop when you reach the true root cause
