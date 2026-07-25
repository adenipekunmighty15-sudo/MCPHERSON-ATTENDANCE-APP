---
name: review
description: "Run a multi-perspective PR review across product, dev, QA, security, DevOps, and UX — then post findings to GitHub"
---

# PR Review

Run a thorough, multi-perspective code review covering product management, engineering, QA, security, DevOps, and UX.

## When to Use

- Before merging a pull request
- Evaluating implementation quality across all dimensions
- Ensuring no perspective is missed in review

## Review Perspectives

### 1. Product Manager Review
- **Business Value**: Does this advance core product goals and deliver ROI?
- **User Experience**: Is the change intuitive and delightful?
- **Strategic Alignment**: Does it align with current and long-term objectives?

### 2. Developer Review
- **Code Quality & Maintainability**: Is the code structured for readability and easy maintenance?
- **Performance & Scalability**: Will these changes operate efficiently at scale?
- **Best Practices & Standards**: Does it follow coding standards?

### 3. Quality Engineer Review
- **Test Coverage**: Are there sufficient tests (unit, integration, E2E)?
- **Potential Bugs & Edge Cases**: Have all edge cases been considered?
- **Regression Risk**: Do changes undermine existing functionality?

### 4. Security Engineer Review
- **Vulnerabilities**: Could these changes introduce security vulnerabilities?
- **Data Handling**: Is sensitive data properly protected?
- **Compliance**: Does it meet security/privacy standards (OWASP, GDPR, HIPAA)?

### 5. DevOps Review
- **CI/CD Pipeline**: Does the PR integrate smoothly with existing build/test/deploy processes?
- **Infrastructure & Configuration**: Are infrastructure or config updates needed?
- **Monitoring & Alerts**: Are new monitoring needs identified?

### 6. UI/UX Designer Review
- **Visual Consistency**: Does it adhere to brand/design guidelines?
- **Usability & Accessibility**: Is the UI intuitive and accessibility-compliant?
- **Interaction Flow**: Is the user flow seamless?
