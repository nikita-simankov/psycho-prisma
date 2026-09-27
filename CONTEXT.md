# Calibre

Calibre is a hosted psychological assessment platform for HR teams: an organization sends validated tests and questionnaires to its people, scores the answers, and gives psychologists the results to interpret before anyone acts on them.

## Language

### Tenancy and people

**Organization**:
One customer's isolated space: its people, teams, instruments, results and billing. A user can belong to several.
_Avoid_: Workspace, tenant, company, account

**Membership**:
A user's place in one organization.
_Avoid_: Employee record, seat

**Role**:
What a member may see and do in an organization: owner, admin, psychologist, HR manager, member or candidate.
_Avoid_: Permission level, access level

**Person**:
Anyone an organization assesses, seen from the staff side. Staff talk about people; the person themselves is a respondent while answering.
_Avoid_: Employee, subject, patient, client

**Respondent**:
A person in the act of answering an assessment.
_Avoid_: Test taker, participant, user

**Candidate**:
A person being assessed for hiring who is not on staff.
_Avoid_: Applicant

**Staff**:
Members whose role lets them run assessments or read results, as opposed to people who only answer.
_Avoid_: Admins (as a group), operators

**Team**:
A named group of people inside an organization.
_Avoid_: Department, unit, squad

**Invitation**:
A pending offer, sent by email, to join an organization with a given role.
_Avoid_: Invite code

**Join link**:
A shareable link that lets anyone holding it join an organization as a member, optionally into a team, until it expires, runs out of uses or is revoked.
_Avoid_: Invite link

### Instruments

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
The set of instruments an organization can send: shared ones plus its own.
_Avoid_: Catalogue, bank

**Studio**:
Where staff create, copy and edit their own instruments.
_Avoid_: Builder, editor

**Instrument version**:
A published, numbered snapshot of an instrument.
_Avoid_: Revision, release

**Retest interval**:
The minimum time before a person can be sent the same test again.
_Avoid_: Cooldown

### Assessing

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

### Results

**Result**:
The scores and interpretation that come from one submission.
_Avoid_: Outcome, score sheet

**Report**:
A person's results brought together with the psychologist's background and conclusion.
_Avoid_: Profile, dossier

**Conclusion**:
The psychologist's written judgement on a person's results.
_Avoid_: Verdict, diagnosis

**Follow-up flag**:
A marker a psychologist or owner puts on a person who needs attention.
_Avoid_: Risk flag, alert, at-risk

**Team average**:
A result averaged over a team or a filtered group of people, the only kind of result a manager sees.
_Avoid_: Group result, aggregate, team score

**Privacy mask**:
What stands in for a team average held back because the group is too small.
_Avoid_: Redaction

**Consent**:
A person's recorded agreement, per organization, to have their answers processed under the privacy notice.
_Avoid_: Opt-in

### Billing

**Plan**:
The tier an organization pays for: Free, Team, Business or Enterprise.
_Avoid_: Package, subscription tier

**Trial**:
A new organization's free period on the Business plan before it drops to Free.
_Avoid_: Free period
