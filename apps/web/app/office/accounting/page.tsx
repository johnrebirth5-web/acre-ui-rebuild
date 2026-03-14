import {
  canAccessOfficeAccounting,
  canManageOfficeAccounting,
  canManageOfficeAgentBilling,
  canManageOfficeCommissions,
  canManageOfficePayments,
  canApproveOfficeCommissions,
  canCalculateOfficeCommissions,
  canViewOfficeCommissions,
  canViewOfficeAgentBilling
} from "@acre/auth";
import { PageHeader, PageHeaderSummary, PageShell, SummaryChip } from "@acre/ui";
import { getOfficeAccountingSnapshot, getOfficeAgentBillingSnapshot, getOfficeCommissionManagementSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { OfficeAccountingClient } from "./accounting-client";

type OfficeAccountingPageProps = {
  searchParams?: Promise<{
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    ownerMembershipId?: string;
    q?: string;
    entryId?: string;
    billingMembershipId?: string;
    billingStatus?: string;
    billingStartDate?: string;
    billingEndDate?: string;
    billingTransactionId?: string;
    billingQ?: string;
    commissionMembershipId?: string;
    commissionTeamId?: string;
    commissionPlanId?: string;
    commissionStatus?: string;
    commissionTransactionId?: string;
    commissionStartDate?: string;
    commissionEndDate?: string;
  }>;
};

export default async function OfficeAccountingPage(props: OfficeAccountingPageProps) {
  const context = await requireOfficeSession();

  if (!canAccessOfficeAccounting(context.currentMembership.role)) {
    redirect("/office/dashboard");
  }

  const searchParams = (await props.searchParams) ?? {};
  const [snapshot, agentBillingSnapshot, commissionSnapshot] = await Promise.all([
    getOfficeAccountingSnapshot({
      organizationId: context.currentOrganization.id,
      officeId: context.currentOffice?.id ?? null,
      type: searchParams.type,
      status: searchParams.status,
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      ownerMembershipId: searchParams.ownerMembershipId,
      q: searchParams.q,
      entryId: searchParams.entryId
    }),
    canViewOfficeAgentBilling(context.currentMembership.role)
      ? getOfficeAgentBillingSnapshot({
          organizationId: context.currentOrganization.id,
          officeId: context.currentOffice?.id ?? null,
          membershipId: searchParams.billingMembershipId,
          status: searchParams.billingStatus,
          startDate: searchParams.billingStartDate,
          endDate: searchParams.billingEndDate,
          transactionId: searchParams.billingTransactionId,
          q: searchParams.billingQ
        })
      : null,
    canViewOfficeCommissions(context.currentMembership.role)
      ? getOfficeCommissionManagementSnapshot({
          organizationId: context.currentOrganization.id,
          officeId: context.currentOffice?.id ?? null,
          membershipId: searchParams.commissionMembershipId,
          teamId: searchParams.commissionTeamId,
          commissionPlanId: searchParams.commissionPlanId,
          status: searchParams.commissionStatus,
          transactionId: searchParams.commissionTransactionId,
          startDate: searchParams.commissionStartDate,
          endDate: searchParams.commissionEndDate
        })
      : null
  ]);

  return (
    <PageShell className="office-list-page office-accounting-list-page">
      <PageHeader
        actions={
          <PageHeaderSummary>
            <SummaryChip label="Office scope" value={context.currentOffice?.name ?? context.currentOrganization.name} />
            <SummaryChip label="Total invoices" tone="accent" value={snapshot.overview.totalInvoices} />
            <SummaryChip label="Open bills" value={snapshot.overview.openBills} />
            <SummaryChip label="Office net ledger impact" value={snapshot.overview.officeNetLedgerImpactLabel} />
          </PageHeaderSummary>
        }
        description="Accounting records for invoices, bills, payments, ledger entries, and deposit tracking."
        eyebrow="Accounting"
        title="Accounting"
      />

      <OfficeAccountingClient
        agentBillingSnapshot={agentBillingSnapshot}
        canManageAccounting={canManageOfficeAccounting(context.currentMembership.role)}
        canManageAgentBilling={canManageOfficeAgentBilling(context.currentMembership.role)}
        canManageCommissions={canManageOfficeCommissions(context.currentMembership.role)}
        canManagePayments={canManageOfficePayments(context.currentMembership.role)}
        canApproveCommissions={canApproveOfficeCommissions(context.currentMembership.role)}
        canCalculateCommissions={canCalculateOfficeCommissions(context.currentMembership.role)}
        canViewCommissions={canViewOfficeCommissions(context.currentMembership.role)}
        commissionSnapshot={commissionSnapshot}
        canViewAgentBilling={canViewOfficeAgentBilling(context.currentMembership.role)}
        officeLabel={context.currentOffice?.name ?? context.currentOrganization.name}
        snapshot={snapshot}
      />
    </PageShell>
  );
}
