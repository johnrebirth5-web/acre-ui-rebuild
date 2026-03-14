import { canManageOfficeFields, canViewOfficeFields } from "@acre/auth";
import { ListPageStack, PageHeader, PageHeaderSummary, PageShell, SummaryChip } from "@acre/ui";
import { getOfficeFieldSettingsSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../../lib/auth-session";
import { OfficeSettingsNav } from "../settings-nav";
import { OfficeSettingsFieldsClient } from "./fields-client";

export default async function OfficeSettingsFieldsPage() {
  const context = await requireOfficeSession();

  if (!canViewOfficeFields(context.currentMembership.role)) {
    redirect("/office/settings");
  }

  const snapshot = await getOfficeFieldSettingsSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null
  });

  return (
    <PageShell className="office-list-page office-settings-list-page">
      <PageHeader
        actions={
          <PageHeaderSummary>
            <SummaryChip label="Office scope" value={context.currentOffice?.name ?? context.currentOrganization.name} />
            <SummaryChip label="Required roles" tone="accent" value={snapshot.summary.requiredRoleCount} />
            <SummaryChip label="Required fields" value={snapshot.summary.requiredFieldCount} />
            <SummaryChip label="Visible fields" value={snapshot.summary.visibleFieldCount} />
          </PageHeaderSummary>
        }
        description="Choose which contact roles are required and which transaction fields are shown or required."
        eyebrow="Office admin"
        title="Fields"
      />

      <ListPageStack className="office-settings-list-stack">
        <OfficeSettingsNav />
        <OfficeSettingsFieldsClient canManageFields={canManageOfficeFields(context.currentMembership.role)} snapshot={snapshot} />
      </ListPageStack>
    </PageShell>
  );
}
