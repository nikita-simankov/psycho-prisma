-- CreateIndex
CREATE INDEX "Assignment_userId_idx" ON "Assignment"("userId");

-- CreateIndex
CREATE INDEX "Form_organizationId_idx" ON "Form"("organizationId");

-- CreateIndex
CREATE INDEX "FormSubmission_organizationId_userId_idx" ON "FormSubmission"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "FormSubmission_organizationId_formId_idx" ON "FormSubmission"("organizationId", "formId");

-- CreateIndex
CREATE INDEX "FormSubmission_assignmentId_idx" ON "FormSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_idx" ON "Invitation"("organizationId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "Round_organizationId_idx" ON "Round"("organizationId");

-- CreateIndex
CREATE INDEX "RoundSchedule_organizationId_idx" ON "RoundSchedule"("organizationId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Test_organizationId_idx" ON "Test"("organizationId");

-- CreateIndex
CREATE INDEX "TestSubmission_organizationId_userId_idx" ON "TestSubmission"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "TestSubmission_organizationId_testId_idx" ON "TestSubmission"("organizationId", "testId");

-- CreateIndex
CREATE INDEX "TestSubmission_assignmentId_idx" ON "TestSubmission"("assignmentId");

