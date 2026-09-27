# Calibre

Calibre is a hosted psychological assessment platform for HR teams: a workspace sends validated tests and questionnaires to its people, scores the answers, and gives psychologists the results to interpret before anyone acts on them.

## Tenancy and people

**Workspace**:
One customer's isolated space: its people, teams, instruments, results and billing. A user can belong to several.
_Avoid_: Tenant, company, account

**Membership**:
A user's place in one workspace, carrying their role, team, position and follow-up flag.
_Avoid_: Employee record, seat

**Role**:
What a member may see and do in a workspace: owner, admin, psychologist, manager, member or candidate.
_Avoid_: Permission level, access level

**Person**:
Anyone a workspace assesses, seen from the staff side. Staff talk about people; the person themselves is a respondent while answering.
_Avoid_: Employee, subject, patient, client

**Respondent**:
A person in the act of answering an assessment.
_Avoid_: Test taker, participant, user

**Candidate**:
A person being assessed for hiring who is not on staff; their results fall under separate retention.
_Avoid_: Applicant

**Staff**:
Members who run assessments or read results (owner, admin, psychologist, manager). Staff seats are what a plan limits.
_Avoid_: Admins (as a group), operators

**Team**:
A named group of people inside a workspace, used for targeting rounds and for group results.
_Avoid_: Department, unit, squad

**Invitation**:
A pending offer, sent by email, to join a workspace with a given role.
_Avoid_: Invite code

**Join link**:
A shareable link that lets anyone holding it join a workspace, optionally into a team, until it expires or runs out of uses.
_Avoid_: Invite link

## Instruments

**Instrument**:
Anything a respondent fills in: a test or a questionnaire.
_Avoid_: Survey, tool, method

**Test**:
A scored instrument with scales and norms that turns answers into raw scores, stens and T-scores.
_Avoid_: Quiz, psychometric

**Questionnaire**:
An unscored instrument that collects answers as they are, such as background details or an interview form.
_Avoid_: Form, survey

**Scale**:
One measured trait within a test, with its own score and interpretation.
_Avoid_: Factor, dimension

**Norms**:
The reference tables that convert a raw score into a sten or T-score.
_Avoid_: Benchmarks

**Sensitive instrument**:
A clinical screen (for example depression or anxiety) whose items and results only psychologists and the owner may see.
_Avoid_: Clinical test, restricted test

**Library**:
The set of instruments a workspace can send: shared ones plus its own.
_Avoid_: Catalogue, bank

**Studio**:
Where staff create, copy and edit their own instruments.
_Avoid_: Builder, editor

**Instrument version**:
A published, numbered snapshot of an instrument. Every submission is scored with the version it was answered on.
_Avoid_: Revision, release

**Retest interval**:
The minimum time before the same person should take a test again.
_Avoid_: Cooldown

## Assessing

**Assessment**:
One instrument a respondent has been asked to complete, as it appears on their to-do list.
_Avoid_: Task, job

**Round**:
A single send of one or more instruments to a chosen set of people, with an optional due date.
_Avoid_: Campaign, wave, batch

**Assignment**:
One person's share of a round: which instruments they owe and whether they finished.
_Avoid_: Invite, ticket

**Schedule**:
A rule that creates rounds automatically, either every N months or at a lifecycle moment such as a start date.
_Avoid_: Recurring round, cron

**Draft**:
A respondent's saved, unfinished answers, resumed where they left off.
_Avoid_: Autosave, partial submission

**Submission**:
A finished set of answers to one instrument version, scored at the moment it is submitted.
_Avoid_: Attempt, response, result

## Results

**Result**:
The scores and interpretation that come from one submission.
_Avoid_: Outcome, score sheet

**Report**:
A person's results brought together, with the psychologist's background and conclusion, saved as numbered report versions.
_Avoid_: Profile, dossier

**Conclusion**:
The psychologist's written judgement on a person's results.
_Avoid_: Verdict, diagnosis

**Follow-up flag**:
A marker a psychologist or owner puts on a person who needs attention.
_Avoid_: Risk flag, alert, at-risk

**Group result**:
An average over a team or filter, shown only when the group has at least five people.
_Avoid_: Aggregate, team score

**Privacy mask**:
What stands in for a group result held back because the group is too small.
_Avoid_: Redaction

**Consent**:
A person's recorded agreement to the privacy notice, required before their first assessment; withdrawing it stops new answers.
_Avoid_: Opt-in

## Billing

**Plan**:
The tier a workspace pays for (Free, Team, Business, Enterprise), priced by respondents assessed per year, with staff seats included.
_Avoid_: Package, subscription tier

**Trial**:
Fourteen days of Business for a new workspace, with no card, after which it drops to Free.
_Avoid_: Free period
