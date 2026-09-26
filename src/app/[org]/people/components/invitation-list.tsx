import type { findOpenInvitations } from "@/actions/invitation/invitation-actions";
import { EmptyState } from "@/components/empty-state";
import { MailPlus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { ResendInvitationButton } from "./bulk-invite";
import { RevokeInvitationButton } from "./member-controls";

type Invitation = Awaited<ReturnType<typeof findOpenInvitations>>[number];

// Invitations not yet accepted: who, which role, when the last email went out and what happens next.
export async function InvitationList({ invitations }: { invitations: Invitation[] }) {
  const t = await getTranslations("people.invitations");
  const s = await getTranslations("settings.members");
  const roles = await getTranslations("roles");
  const format = await getFormatter();
  const now = new Date();

  if (!invitations.length) {
    return <EmptyState icon={MailPlus} title={s("noInvitations")} description={s("noInvitationsText")} />;
  }

  return (
    <ul className="divide-y border-y">
      {invitations.map((invitation) => {
        const expired = invitation.expiresAt < now;
        const status = invitation.held
          ? t("held")
          : expired
            ? t("expired")
            : t("expires", { date: format.dateTime(invitation.expiresAt, { dateStyle: "medium" }) });

        return (
          <li key={invitation.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{invitation.email}</p>
              <p className="text-sm text-muted-foreground">
                {[roles(invitation.role), invitation.team?.name].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5 font-mono text-xs">
              {!invitation.held && (
                <span className="text-muted-foreground">
                  {t("lastSent", { when: format.relativeTime(invitation.sentAt, now) })}
                  {invitation.remindersSent > 0 && ` · ${t("reminders", { count: invitation.remindersSent })}`}
                </span>
              )}
              <span className={expired ? "text-destructive" : "text-muted-foreground"}>{status}</span>
            </div>
            <div className="flex gap-1">
              <ResendInvitationButton invitationId={invitation.id} email={invitation.email} />
              <RevokeInvitationButton invitationId={invitation.id} email={invitation.email} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
