import Link from "next/link";
import { canAccessOfficeSettings } from "@acre/auth";
import { PageHeader, PageHeaderSummary, PageShell, SectionCard, StatCard, SummaryChip } from "@acre/ui";
import { getOfficeSettingsSummarySnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { OfficeSettingsNav } from "./settings-nav";

export default async function OfficeSettingsPage() {
  const context = await requireOfficeSession();

  if (!canAccessOfficeSettings(context.currentMembership.role)) {
    redirect("/office/dashboard");
  }

  const snapshot = await getOfficeSettingsSummarySnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null
  });

  return (
    <PageShell className="office-list-page office-settings-list-page">
      <PageHeader
        actions={
          <PageHeaderSummary>
            <SummaryChip label="Office scope" value={context.currentOffice?.name ?? context.currentOrganization.name} />
            <SummaryChip label="Active users" tone="accent" value={snapshot.summary.activeUsersCount} />
            <SummaryChip label="Teams" value={snapshot.summary.teamsCount} />
          </PageHeaderSummary>
        }
        description="Manage users, teams, required roles, and reusable checklists for this office."
        eyebrow="Office admin"
        title="Settings"
      />

      <OfficeSettingsNav />

      <section className="office-settings-summary-grid">
        <StatCard hint="Current org scope" label="Users" value={snapshot.summary.usersCount} />
        <StatCard hint={`${snapshot.summary.activeUsersCount} active`} label="Teams" value={snapshot.summary.teamsCount} />
        <StatCard hint="Transaction setup" label="Required roles" value={snapshot.summary.requiredRoleCount} />
        <StatCard hint="Reusable task templates" label="Checklists" value={snapshot.summary.checklistTemplateCount} />
      </section>

      <section className="office-settings-section-grid">
        <SectionCard subtitle="Roles, access state, and office assignment." title="Users">
          <p className="office-settings-copy">
            Manage office access, role changes, and active or inactive status for the current office.
          </p>
          <Link className="office-settings-link" href="/office/settings/users">
            Open users
          </Link>
        </SectionCard>

        <SectionCard subtitle="Operational roster structure." title="Teams">
          <p className="office-settings-copy">
            Create teams, manage active rosters, and assign or remove agents for this office.
          </p>
          <Link className="office-settings-link" href="/office/settings/teams">
            Open teams
          </Link>
        </SectionCard>

        <SectionCard subtitle="Required contact roles and transaction field behavior." title="Fields">
          <p className="office-settings-copy">
            Choose which roles are required and which fields appear or must be completed on a transaction.
          </p>
          <Link className="office-settings-link" href="/office/settings/fields">
            Open field settings
          </Link>
        </SectionCard>

        <SectionCard subtitle="Reusable task templates for sales, rentals, and office defaults." title="Checklists">
          <p className="office-settings-copy">
            Create and manage reusable checklist templates with grouped tasks, due dates, and document requirements.
          </p>
          <Link className="office-settings-link" href="/office/settings/checklists">
            Open checklist templates
          </Link>
        </SectionCard>
      </section>
    </PageShell>
  );
}
