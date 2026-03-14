"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, FormField, SelectInput, StatusBadge, TextareaInput, TextInput } from "@acre/ui";
import type { OfficeIncomingUpdate } from "@acre/db";

type TransactionIncomingUpdatesCardProps = {
  transactionId: string;
  incomingUpdates: OfficeIncomingUpdate[];
  canReviewIncomingUpdates: boolean;
};

type NewIncomingUpdateState = {
  sourceSystem: string;
  sourceReference: string;
  summary: string;
  closingDate: string;
  status: string;
  notes: string;
};

const incomingUpdateStatusOptions = [
  { value: "", label: "No status change" },
  { value: "opportunity", label: "Opportunity" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" }
] as const;

function buildEmptyIncomingUpdateState(): NewIncomingUpdateState {
  return {
    sourceSystem: "Outside update",
    sourceReference: "",
    summary: "",
    closingDate: "",
    status: "",
    notes: ""
  };
}

function getIncomingUpdateTone(statusKey: OfficeIncomingUpdate["statusKey"]) {
  if (statusKey === "applied" || statusKey === "accepted") {
    return "success" as const;
  }

  if (statusKey === "rejected") {
    return "danger" as const;
  }

  return "warning" as const;
}

function formatDateLabel(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function TransactionIncomingUpdatesCard({
  transactionId,
  incomingUpdates,
  canReviewIncomingUpdates
}: TransactionIncomingUpdatesCardProps) {
  const router = useRouter();
  const [newUpdate, setNewUpdate] = useState<NewIncomingUpdateState>(buildEmptyIncomingUpdateState);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCreateIncomingUpdate() {
    if (!newUpdate.sourceSystem.trim() || !newUpdate.sourceReference.trim() || !newUpdate.summary.trim()) {
      setError("Add a source, reference, and summary before saving.");
      return;
    }

    const payload: Record<string, unknown> = {};

    if (newUpdate.closingDate) {
      payload.closingDate = newUpdate.closingDate;
    }

    if (newUpdate.status) {
      payload.status = newUpdate.status;
    }

    if (newUpdate.notes.trim()) {
      payload.notes = newUpdate.notes.trim();
    }

    setPendingAction("create");
    setError("");

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}/incoming-updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceSystem: newUpdate.sourceSystem,
          sourceReference: newUpdate.sourceReference,
          summary: newUpdate.summary,
          payload
        })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Incoming update could not be created.");
      }

      setNewUpdate(buildEmptyIncomingUpdateState());
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Incoming update could not be created.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReview(incomingUpdateId: string, action: "accept" | "reject") {
    setPendingAction(`${action}:${incomingUpdateId}`);
    setError("");

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}/incoming-updates/${incomingUpdateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Incoming update review failed.");
      }

      router.refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Incoming update review failed.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="bm-detail-card" id="transaction-incoming-updates">
      <div className="bm-card-head">
        <div>
          <h3>Incoming updates</h3>
          <span>Review updates that came in from outside the office before applying them to this transaction.</span>
        </div>
      </div>

      <div className="bm-document-list">
        {incomingUpdates.length > 0 ? (
          incomingUpdates.map((incomingUpdate) => (
            <article className="bm-form-row" key={incomingUpdate.id}>
              <div className="bm-document-row-top">
                <div className="bm-document-row-copy">
                  <div className="bm-document-row-head">
                    <strong>{incomingUpdate.summary}</strong>
                    <StatusBadge tone={getIncomingUpdateTone(incomingUpdate.statusKey)}>{incomingUpdate.status}</StatusBadge>
                  </div>
                  <p>
                    {incomingUpdate.sourceSystem} · {incomingUpdate.sourceReference}
                  </p>
                  <p>
                    Received {formatDateLabel(incomingUpdate.receivedAt)}
                    {incomingUpdate.reviewedAt ? ` · Reviewed ${formatDateLabel(incomingUpdate.reviewedAt)}` : ""}
                    {incomingUpdate.reviewedByName ? ` · ${incomingUpdate.reviewedByName}` : ""}
                  </p>
                </div>

                {canReviewIncomingUpdates && incomingUpdate.statusKey === "pending_review" ? (
                  <div className="bm-signature-row-actions">
                    <Button
                      disabled={pendingAction === `accept:${incomingUpdate.id}`}
                      onClick={() => handleReview(incomingUpdate.id, "accept")}
                      size="sm"
                    >
                      {pendingAction === `accept:${incomingUpdate.id}` ? "Applying..." : "Accept"}
                    </Button>
                    <Button
                      disabled={pendingAction === `reject:${incomingUpdate.id}`}
                      onClick={() => handleReview(incomingUpdate.id, "reject")}
                      size="sm"
                      variant="danger"
                    >
                      {pendingAction === `reject:${incomingUpdate.id}` ? "Saving..." : "Reject"}
                    </Button>
                  </div>
                ) : null}
              </div>

              {incomingUpdate.payloadPreview.length > 0 ? (
                <ul className="bm-incoming-update-preview">
                  {incomingUpdate.payloadPreview.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState
            description="Updates sent from outside the office will appear here for review."
            title="No incoming updates yet"
          />
        )}
      </div>

      {canReviewIncomingUpdates ? (
        <div className="bm-document-upload-panel">
          <div className="bm-card-head bm-card-head-inline">
            <h3>Add update</h3>
          </div>

          <div className="bm-document-upload-grid">
            <FormField label="Source">
              <TextInput
                onChange={(event) => setNewUpdate((current) => ({ ...current, sourceSystem: event.target.value }))}
                value={newUpdate.sourceSystem}
              />
            </FormField>
            <FormField label="Reference">
              <TextInput
                onChange={(event) => setNewUpdate((current) => ({ ...current, sourceReference: event.target.value }))}
                value={newUpdate.sourceReference}
              />
            </FormField>
            <FormField className="bm-detail-field-wide" label="Summary">
              <TextInput
                onChange={(event) => setNewUpdate((current) => ({ ...current, summary: event.target.value }))}
                value={newUpdate.summary}
              />
            </FormField>
            <FormField label="Updated status">
              <SelectInput
                onChange={(event) => setNewUpdate((current) => ({ ...current, status: event.target.value }))}
                value={newUpdate.status}
              >
                {incomingUpdateStatusOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Closing date">
              <TextInput
                onChange={(event) => setNewUpdate((current) => ({ ...current, closingDate: event.target.value }))}
                type="date"
                value={newUpdate.closingDate}
              />
            </FormField>
            <FormField className="bm-detail-field-wide" label="Notes">
              <TextareaInput
                onChange={(event) => setNewUpdate((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                value={newUpdate.notes}
              />
            </FormField>
          </div>

          <div className="bm-document-edit-actions">
            <Button disabled={pendingAction === "create"} onClick={handleCreateIncomingUpdate}>
              {pendingAction === "create" ? "Saving..." : "Save update"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="bm-transaction-submit-error">{error}</p> : null}
    </section>
  );
}
