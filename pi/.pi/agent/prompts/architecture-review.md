# Architecture Review Prompt

Review this project at the **architecture and system-design level**.

Focus on:

- Overall structure and separation of concerns
- Module and package boundaries
- Dependency direction and coupling
- Data flow and control flow
- Public interfaces between components
- Extensibility and maintainability
- Scalability and performance risks
- Error handling and failure isolation
- Security boundaries and trust assumptions
- Testability and observability
- Unnecessary complexity or missing abstractions
- Architectural inconsistencies and duplicated responsibilities

Do **not** focus on minor implementation details such as naming, formatting, small refactors, individual conditionals, or whether one syntax construct should be replaced by another.

For every issue, include:

1. **Severity:** critical, high, medium, or low
2. **Affected components**
3. **Why it is an architectural problem**
4. **Likely long-term consequences**
5. **A concrete recommended direction**
6. **Trade-offs of the recommendation**

Also identify:

- Architectural decisions that are already strong
- Areas that should remain simple rather than being abstracted
- Assumptions that need to be validated
- The three most important improvements to prioritise

Base the review on the project’s actual requirements and current scale. Avoid recommending enterprise patterns unless the project genuinely needs them.

