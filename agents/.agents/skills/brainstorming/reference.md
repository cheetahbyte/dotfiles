# Example: "Add Teams to My Application"

## Brainstorming

First inspect the application. Discover facts such as: existing user model, authentication system, authorization patterns, database architecture, current ownership model, relevant APIs, test conventions.

Then identify unresolved decisions, for example:

* Can users belong to multiple teams?
* Who can create teams?
* Are there roles within a team?
* How do invitations work?
* What happens to existing resources?
* Are resources owned by users, teams, or both?

These are user-owned product decisions. Invoke Grill Me.

## Grill Me

Grill Me builds and resolves the decision tree with the user. It may determine, for example:

* users can belong to multiple teams
* teams have owner/admin/member roles
* admins can invite users
* invitations expire
* existing resources remain personal
* new resources can optionally belong to a team

Once Grill Me reaches shared understanding, it returns.

## Brainstorming Resumes

Do not ask those questions again. Now evaluate technical approaches.

**Approach A — explicit team membership model**

* `teams`
* `team_memberships`
* role stored on membership
* nullable `team_id` on team-ownable resources

**Approach B — generic ownership abstraction**

* polymorphic owner model
* users and teams share ownership infrastructure

If the application only needs teams, prefer Approach A under YAGNI unless the existing architecture strongly favors generalized ownership.

Then design: schema, membership model, permission evaluation, invitation lifecycle, APIs, migrations, affected services, authorization tests, integration tests.

Present the technical design. After approval: write the spec, review it, obtain final spec approval, invoke implementation planning.

## Responsibility Chain

User request → Brainstorming investigates → Grill Me resolves "what should this mean?" → Brainstorming resolves "how should we build it?" → Planning resolves "in what implementation sequence?" → Implementation
