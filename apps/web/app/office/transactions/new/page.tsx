import Link from "next/link";
import { Button, PageHeader, PageHeaderSummary, PageShell, SectionCard, SummaryChip } from "@acre/ui";
import { getCreateTransactionDraft } from "@acre/backoffice";

export default function OfficeTransactionCreatePage() {
  const draft = getCreateTransactionDraft();

  return (
    <PageShell className="bm-new-transaction-page office-detail-page office-new-transaction-page">
      <PageHeader
        actions={
          <div className="office-new-transaction-header-actions">
            <PageHeaderSummary className="office-new-transaction-summary">
              <SummaryChip label="Stage" value="New intake" />
              <SummaryChip label="Participants" tone="accent" value={draft.participants.length} />
              <SummaryChip label="Referral items" value={draft.referralRules.length} />
            </PageHeaderSummary>
            <Link className="office-button office-button-secondary" href="/office/transactions">
              Back to transactions
            </Link>
            <Button type="button">Save draft</Button>
          </div>
        }
        description="Review the information captured when opening a new transaction."
        title="New transaction"
      />

      <section className="bm-new-transaction-grid office-new-transaction-grid">
        <SectionCard className="bm-new-transaction-card office-new-transaction-card" title="Transaction details">
          <div className="bm-transaction-form-grid">
            <label className="bm-form-field">
              <span>Transaction type</span>
              <input defaultValue={draft.transactionType} readOnly />
            </label>
            <label className="bm-form-field bm-form-field-wide">
              <span>Address</span>
              <input defaultValue={draft.address} readOnly />
            </label>
            <label className="bm-form-field">
              <span>City</span>
              <input defaultValue={draft.city} readOnly />
            </label>
            <label className="bm-form-field">
              <span>State</span>
              <input defaultValue={draft.state} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Zip</span>
              <input defaultValue={draft.zipCode} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Contract date</span>
              <input defaultValue={draft.contractDate} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Sale price</span>
              <input defaultValue={draft.salePrice} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Buyer expiration date</span>
              <input defaultValue={draft.buyerExpirationDate} placeholder="Buyer expiration date" readOnly />
            </label>
            <label className="bm-form-field">
              <span>Listing date</span>
              <input defaultValue={draft.listingDate} placeholder="Listing date" readOnly />
            </label>
            <label className="bm-form-field">
              <span>Listing expiration date</span>
              <input defaultValue={draft.listingExpirationDate} placeholder="Listing expiration date" readOnly />
            </label>
            <label className="bm-form-field">
              <span>Closing date</span>
              <input defaultValue={draft.closingDate} readOnly />
            </label>
          </div>
        </SectionCard>

        <SectionCard className="bm-new-transaction-card office-new-transaction-card" title="Additional fields">
          <div className="bm-transaction-form-grid">
            <label className="bm-form-field">
              <span>Agent name</span>
              <input defaultValue={draft.agentName} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Team leader</span>
              <input defaultValue={draft.teamLeader} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Licensed agent name</span>
              <input defaultValue={draft.licensedAgentName} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Company referral</span>
              <input defaultValue={draft.companyReferral} readOnly />
            </label>
            <label className="bm-form-field bm-form-field-wide">
              <span>Company Referral Employee&apos;s Name</span>
              <input defaultValue={draft.companyReferralEmployeeName} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Brokerage name</span>
              <input defaultValue={draft.brokerageName} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Commission %</span>
              <input defaultValue={draft.commissionPercent} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Referral %</span>
              <input defaultValue={draft.referralPercent} readOnly />
            </label>
            <label className="bm-form-field bm-form-field-wide">
              <span>Source notes</span>
              <textarea defaultValue={draft.sourceNotes} readOnly rows={4} />
            </label>
          </div>
        </SectionCard>
      </section>

      <section className="bm-new-transaction-grid office-new-transaction-grid">
        <SectionCard className="bm-new-transaction-card office-new-transaction-card" title="Agent / commission participants">
          <div className="bm-commission-list">
            {draft.participants.map((participant) => (
              <article className="bm-commission-item" key={participant.id}>
                <div>
                  <strong>{participant.name}</strong>
                  <p>{participant.role}</p>
                </div>
                <div className="bm-commission-meta">
                  <span>{participant.splitLabel}</span>
                  {participant.notes ? <p>{participant.notes}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="bm-new-transaction-card office-new-transaction-card" title="Referral guidelines">
          <div className="bm-rule-list">
            {draft.referralRules.map((rule) => (
              <article className="bm-rule-item" key={rule}>
                <span>{rule}</span>
              </article>
            ))}
          </div>
        </SectionCard>
      </section>
    </PageShell>
  );
}
