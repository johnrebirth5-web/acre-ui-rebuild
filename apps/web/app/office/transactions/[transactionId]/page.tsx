import Link from "next/link";
import {
  getTransactionById,
  getTransactionCommissionSnapshot,
  listTransactionOffersSnapshot,
  listTransactionTaskAssigneeOptions,
  listTransactionTasks
} from "@acre/db";
import {
  canApproveOfficeDocuments,
  canApproveOfficeCommissions,
  canManageOfficeDocuments,
  canManageOfficeCommissions,
  canManageOfficeOffers,
  canManageOfficeSignatures,
  canCalculateOfficeCommissions,
  canAcceptOfficeOffers,
  canReviewOfficeTasks,
  canReviewOfficeOffers,
  canReviewOfficeIncomingUpdates,
  canSecondaryReviewOfficeTasks,
  canUseOfficeForms,
  canViewOfficeCommissions,
  canViewOfficeDocuments,
  canViewOfficeOffers
} from "@acre/auth";
import { PageHeader, PageHeaderSummary, PageShell, SectionCard, SummaryChip } from "@acre/ui";
import { notFound } from "next/navigation";
import { requireOfficeSession } from "../../../../lib/auth-session";
import { TransactionContactsCard } from "./contacts-card";
import { TransactionDocumentsCard, TransactionUnsortedDocumentsCard } from "./documents-card";
import { TransactionFinanceForm } from "./finance-form";
import { TransactionFormsSignaturesCard } from "./forms-signatures-card";
import { TransactionIncomingUpdatesCard } from "./incoming-updates-card";
import { TransactionCommissionCard } from "./commission-card";
import { TransactionOffersCard } from "./offers-card";
import { TransactionStatusForm } from "./status-form";
import { TransactionTasksCard } from "./tasks-card";
import { TransactionDetailNav } from "./transaction-detail-nav";

type TransactionDetailPageProps = {
  params: Promise<{
    transactionId: string;
  }>;
};

export default async function OfficeTransactionDetailPage({ params }: TransactionDetailPageProps) {
  const context = await requireOfficeSession();
  const { transactionId } = await params;
  const [transaction, tasks, taskAssigneeOptions, commissionSnapshot, offersSnapshot] = await Promise.all([
    getTransactionById(context.currentOrganization.id, transactionId),
    listTransactionTasks(context.currentOrganization.id, transactionId),
    listTransactionTaskAssigneeOptions(context.currentOrganization.id, transactionId),
    getTransactionCommissionSnapshot(context.currentOrganization.id, transactionId, context.currentOffice?.id ?? null),
    listTransactionOffersSnapshot(context.currentOrganization.id, transactionId)
  ]);

  if (!transaction) {
    notFound();
  }

  const taskOptions = tasks.map((task) => ({
    id: task.id,
    title: task.title
  }));
  const canViewDocumentsForRole = canViewOfficeDocuments(context.currentMembership.role);
  const canManageDocumentsForRole = canManageOfficeDocuments(context.currentMembership.role);
  const canUseFormsForRole = canUseOfficeForms(context.currentMembership.role);
  const canManageSignaturesForRole = canManageOfficeSignatures(context.currentMembership.role);
  const canReviewIncomingUpdatesForRole = canReviewOfficeIncomingUpdates(context.currentMembership.role);
  const canReviewTasksForRole = canReviewOfficeTasks(context.currentMembership.role);
  const canSecondaryReviewTasksForRole = canSecondaryReviewOfficeTasks(context.currentMembership.role);
  const canApproveDocumentsForRole = canApproveOfficeDocuments(context.currentMembership.role);
  const canViewOffersForRole = canViewOfficeOffers(context.currentMembership.role);
  const canManageOffersForRole = canManageOfficeOffers(context.currentMembership.role);
  const canReviewOffersForRole = canReviewOfficeOffers(context.currentMembership.role);
  const canAcceptOffersForRole = canAcceptOfficeOffers(context.currentMembership.role);
  const canViewCommissionsForRole = canViewOfficeCommissions(context.currentMembership.role);
  const canManageCommissionsForRole = canManageOfficeCommissions(context.currentMembership.role);
  const canCalculateCommissionsForRole = canCalculateOfficeCommissions(context.currentMembership.role);
  const canApproveCommissionsForRole = canApproveOfficeCommissions(context.currentMembership.role);
  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "status", label: "Status" },
    { id: "contacts", label: "Contacts" },
    ...(canViewOffersForRole ? [{ id: "offers", label: "Offers" }] : []),
    { id: "tasks", label: "Tasks" },
    { id: "documents", label: "Documents" },
    { id: "forms", label: "Forms" },
    { id: "updates", label: "Updates" },
    { id: "finance", label: "Finance" },
    ...(canViewCommissionsForRole && commissionSnapshot ? [{ id: "commissions", label: "Commissions" }] : []),
    { id: "fields", label: "Fields" }
  ];

  return (
    <PageShell className="bm-transaction-detail-page office-detail-page office-transaction-detail-page">
      <PageHeader
        actions={
          <div className="office-transaction-detail-header-actions">
            <PageHeaderSummary className="office-transaction-detail-summary">
              <SummaryChip label="Status" tone={transaction.status === "Active" || transaction.status === "Pending" ? "accent" : "default"} value={transaction.status} />
              <SummaryChip label="Owner" value={transaction.ownerName} />
              <SummaryChip label="Office" value={transaction.officeName || "Unassigned"} />
              <SummaryChip label="Price" value={transaction.price || "$0"} />
            </PageHeaderSummary>
            <Link className="office-button office-button-secondary" href="/office/transactions">
              Back to transactions
            </Link>
          </div>
        }
        description={`${transaction.address}, ${transaction.city}, ${transaction.state} ${transaction.zipCode}`}
        eyebrow="Transactions"
        title={transaction.title}
      />

      <TransactionDetailNav items={navItems} />

      <div className="office-transaction-detail-hero">
        <SectionCard id="overview" subtitle="Core transaction facts, dates, and referral context." title="Overview">
          <div className="office-detail-grid">
            <div className="office-detail-field">
              <span>Type</span>
              <strong>{transaction.type}</strong>
            </div>
            <div className="office-detail-field">
              <span>Representing</span>
              <strong>{transaction.representing}</strong>
            </div>
            <div className="office-detail-field">
              <span>Price</span>
              <strong>{transaction.price || "$0"}</strong>
            </div>
            <div className="office-detail-field">
              <span>Important date</span>
              <strong>{transaction.importantDate || "Not set"}</strong>
            </div>
            <div className="office-detail-field">
              <span>Buyer agreement date</span>
              <strong>{transaction.buyerAgreementDate || "Not set"}</strong>
            </div>
            <div className="office-detail-field">
              <span>Buyer expiration date</span>
              <strong>{transaction.buyerExpirationDate || "Not set"}</strong>
            </div>
            <div className="office-detail-field">
              <span>Acceptance date</span>
              <strong>{transaction.acceptanceDate || "Not set"}</strong>
            </div>
            <div className="office-detail-field">
              <span>Closing date</span>
              <strong>{transaction.closingDate || "Not set"}</strong>
            </div>
            <div className="office-detail-field">
              <span>Company referral</span>
              <strong>{transaction.companyReferral}</strong>
            </div>
            <div className="office-detail-field">
              <span>Referral employee</span>
              <strong>{transaction.companyReferralEmployeeName || "None"}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard id="status" subtitle="Review and update the main transaction status." title="Status">
          <div className="office-transaction-detail-status-stack">
            <TransactionStatusForm currentStatus={transaction.status} transactionId={transaction.id} />
            <div className="office-secondary-meta-list office-transaction-detail-status-meta">
              <div className="office-secondary-meta-row">
                <dt>Owner email</dt>
                <dd>{transaction.ownerEmail || "Not available"}</dd>
              </div>
              <div className="office-secondary-meta-row">
                <dt>Created</dt>
                <dd>{transaction.createdAt}</dd>
              </div>
              <div className="office-secondary-meta-row">
                <dt>Last updated</dt>
                <dd>{transaction.updatedAt}</dd>
              </div>
              <div className="office-secondary-meta-row">
                <dt>Listing date</dt>
                <dd>{transaction.listingDate || "Not set"}</dd>
              </div>
              <div className="office-secondary-meta-row">
                <dt>Listing expiration</dt>
                <dd>{transaction.listingExpirationDate || "Not set"}</dd>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="office-transaction-detail-layout">
        <div className="office-transaction-detail-main">
          <section id="contacts">
            <TransactionContactsCard
              availableContacts={transaction.availableContacts}
              contacts={transaction.contacts}
              transactionId={transaction.id}
            />
          </section>

          {canViewOffersForRole ? (
            <section id="offers">
              <TransactionOffersCard
                canAcceptOffers={canAcceptOffersForRole}
                canManageDocuments={canManageDocumentsForRole}
                canManageOffers={canManageOffersForRole}
                canManageSignatures={canManageSignaturesForRole}
                canReviewOffers={canReviewOffersForRole}
                canUseForms={canUseFormsForRole}
                formTemplates={transaction.formTemplates}
                snapshot={offersSnapshot}
                taskOptions={taskOptions}
                transactionId={transaction.id}
              />
            </section>
          ) : null}

          <section id="tasks">
            <TransactionTasksCard
              assigneeOptions={taskAssigneeOptions}
              canApproveDocuments={canApproveDocumentsForRole}
              currentMembershipId={context.currentMembership.id}
              canReviewTasks={canReviewTasksForRole}
              canSecondaryReviewTasks={canSecondaryReviewTasksForRole}
              tasks={tasks}
              transactionId={transaction.id}
            />
          </section>

          <section id="documents" className="office-transaction-detail-documents">
            <TransactionDocumentsCard
              canManageDocuments={canManageDocumentsForRole}
              canViewDocuments={canViewDocumentsForRole}
              documents={transaction.documents}
              taskOptions={taskOptions}
              transactionId={transaction.id}
            />

            <TransactionUnsortedDocumentsCard
              canManageDocuments={canManageDocumentsForRole}
              canViewDocuments={canViewDocumentsForRole}
              documents={transaction.documents}
              taskOptions={taskOptions}
              transactionId={transaction.id}
            />
          </section>

          <section id="forms">
            <TransactionFormsSignaturesCard
              canManageSignatures={canManageSignaturesForRole}
              canUseForms={canUseFormsForRole}
              canViewDocuments={canViewDocumentsForRole}
              formTemplates={transaction.formTemplates}
              forms={transaction.forms}
              taskOptions={taskOptions}
              transactionId={transaction.id}
            />
          </section>

          <section id="updates">
            <TransactionIncomingUpdatesCard
              canReviewIncomingUpdates={canReviewIncomingUpdatesForRole}
              incomingUpdates={transaction.incomingUpdates}
              transactionId={transaction.id}
            />
          </section>
        </div>

        <aside className="office-transaction-detail-sidebar">
          <SectionCard id="finance" subtitle="Minimal finance layer for commissions, office net, and notes." title="Finance">
            <TransactionFinanceForm
              agentNet={transaction.agentNet}
              financeNotes={transaction.financeNotes}
              grossCommission={transaction.grossCommission}
              officeNet={transaction.officeNet}
              referralFee={transaction.referralFee}
              transactionId={transaction.id}
            />
          </SectionCard>

          {canViewCommissionsForRole && commissionSnapshot ? (
            <section id="commissions">
              <TransactionCommissionCard
                canApproveCommissions={canApproveCommissionsForRole}
                canCalculateCommissions={canCalculateCommissionsForRole}
                canManageCommissions={canManageCommissionsForRole}
                snapshot={commissionSnapshot}
                transactionId={transaction.id}
              />
            </section>
          ) : null}

          <SectionCard id="fields" subtitle="Additional custom fields stored with this transaction." title="Additional fields">
            <div className="office-detail-grid">
              {Object.entries(transaction.additionalFields).length > 0 ? (
                Object.entries(transaction.additionalFields).map(([key, value]) => (
                  <div className="office-detail-field" key={key}>
                    <span>{key}</span>
                    <strong>{value || "—"}</strong>
                  </div>
                ))
              ) : (
                <div className="office-detail-field">
                  <span>Fields</span>
                  <strong>No additional fields saved.</strong>
                </div>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </PageShell>
  );
}
