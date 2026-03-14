import Link from "next/link";
import { getOfficeDashboardBusinessSnapshot } from "@acre/db";
import {
  Badge,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableRow,
  ListPageStatsGrid,
  PageHeader,
  PageHeaderSummary,
  PageShell,
  SecondaryMetaList,
  SectionCard,
  StatCard,
  StatusBadge,
  SummaryChip
} from "@acre/ui";
import { getSessionAccess, requireOfficeSession } from "../../../lib/auth-session";

function getChartTick(label: string, index: number, labels: string[]) {
  const [monthLabel = label, yearLabel = ""] = label.split(" ");
  const previousYear = index > 0 ? labels[index - 1]?.split(" ")[1] : undefined;
  const isLast = index === labels.length - 1;
  const showYear = index === 0 || isLast || previousYear !== yearLabel;

  return {
    monthLabel,
    yearLabel,
    showYear
  };
}

function getTransactionStatusTone(stage: string) {
  const normalizedStage = stage.toLowerCase();

  if (normalizedStage === "closed") {
    return "success" as const;
  }

  if (normalizedStage === "pending") {
    return "warning" as const;
  }

  if (normalizedStage === "cancelled") {
    return "danger" as const;
  }

  if (normalizedStage === "opportunity" || normalizedStage === "active") {
    return "accent" as const;
  }

  return "neutral" as const;
}

export default async function OfficeDashboardPage() {
  const context = await requireOfficeSession();
  const access = getSessionAccess(context);
  const snapshot = await getOfficeDashboardBusinessSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id
  });

  const chartPointLabels = snapshot.chart.points.map((point) => point.label);
  const officeScopeLabel = context.currentOffice?.name ?? context.currentOrganization.name;
  const livePipelineCount = snapshot.transactionCountsByStatus
    .filter((metric) => metric.status !== "Closed" && metric.status !== "Cancelled")
    .reduce((total, metric) => total + metric.count, 0);
  const fallbackChartPoint = snapshot.chart.points[0] ?? { label: "Current month", value: 0 };
  const peakChartPoint = snapshot.chart.points.reduce((best, point) => (point.value > best.value ? point : best), fallbackChartPoint);
  const latestChartPoint = snapshot.chart.points[snapshot.chart.points.length - 1] ?? fallbackChartPoint;
  const progressDegrees = Math.max(0, Math.min(snapshot.goal.progressPercent, 100)) * 3.6;

  return (
    <PageShell className="office-dashboard-page office-list-page">
      <PageHeader
        actions={
          <PageHeaderSummary>
            <SummaryChip label="Office scope" value={officeScopeLabel} />
            <SummaryChip label="Access" value={access.label} />
            <SummaryChip label="Live pipeline" tone="accent" value={livePipelineCount} />
          </PageHeaderSummary>
        }
        description="Goal tracking, current back-office pressure, and recent transactions inside one operational dashboard."
        eyebrow="Dashboard"
        title="Office dashboard"
      />

      <div className="office-dashboard-grid-wide">
        <SectionCard
          className="office-dashboard-goal-card office-list-card"
          subtitle="Goal tracking, live pipeline pressure, and team follow-up coverage inside the current office scope."
          title="Pipeline health"
        >
          <div className="office-dashboard-overview">
            <div className="office-dashboard-overview-top">
              <div className="office-dashboard-access-panel">
                <span>Current operator</span>
                <strong>
                  {context.currentUser.firstName} {context.currentUser.lastName}
                </strong>
                <p>
                  {access.label} · {access.permissionCount} permissions · {officeScopeLabel}
                </p>
              </div>

              <div className="office-dashboard-highlight-grid">
                <article className="office-dashboard-highlight-card office-dashboard-highlight-card-accent">
                  <span>Closed rate</span>
                  <strong>{snapshot.goal.progressPercent}%</strong>
                  <p>{snapshot.goal.currentValue}</p>
                </article>
                <article className="office-dashboard-highlight-card">
                  <span>Follow-ups due</span>
                  <strong>{snapshot.contactsNeedingFollowUp}</strong>
                  <p>{snapshot.goal.secondaryValue} currently due</p>
                </article>
              </div>
            </div>

            <ListPageStatsGrid className="office-dashboard-status-strip">
              {snapshot.transactionCountsByStatus.map((metric) => (
                <StatCard className="office-dashboard-status-card" hint="transactions" key={metric.status} label={metric.status} value={metric.count} />
              ))}
            </ListPageStatsGrid>

            <div className="office-dashboard-chart-layout">
              <div className="office-dashboard-chart-card">
                <div className="office-dashboard-chart-head">
                  <div className="office-dashboard-chart-copy">
                    <span>13-month transaction intake</span>
                    <strong>Monthly creation volume</strong>
                    <p>Track whether the office is building enough new transaction supply before the close-rate target starts slipping.</p>
                  </div>
                  <Badge tone="accent">{peakChartPoint.label} peak</Badge>
                </div>

                <div className="office-dashboard-chart-grid">
                  <div className="office-dashboard-chart-axis">
                    {snapshot.chart.axisLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  <div className="office-dashboard-chart-shell">
                    <div className="office-dashboard-chart-canvas">
                      <div aria-hidden="true" className="office-dashboard-chart-bars">
                        {snapshot.chart.points.map((point) => {
                          const heightPercent = snapshot.chart.maxValue > 0 ? (point.value / snapshot.chart.maxValue) * 100 : 0;
                          const barHeight = point.value > 0 ? `${Math.max(heightPercent, 2)}%` : "0%";

                          return (
                            <span className="office-dashboard-chart-slot" key={point.label}>
                              <span
                                className={`office-dashboard-chart-bar${point.value === 0 ? " is-empty" : ""}`}
                                style={{ height: barHeight }}
                                title={`${point.label}: ${point.value}`}
                              />
                            </span>
                          );
                        })}
                      </div>

                      <div className="office-dashboard-chart-months">
                        {snapshot.chart.points.map((point, index) => {
                          const tick = getChartTick(point.label, index, chartPointLabels);

                          return (
                            <span key={point.label} title={point.label}>
                              <span className="office-dashboard-chart-month-label">{tick.monthLabel}</span>
                              {tick.showYear ? (
                                <span className="office-dashboard-chart-year-label">{tick.yearLabel}</span>
                              ) : (
                                <span aria-hidden="true" className="office-dashboard-chart-year-label is-placeholder">
                                  0000
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="office-dashboard-progress-card">
                <div className="office-dashboard-progress-ring" style={{ background: `conic-gradient(var(--office-accent) 0deg ${progressDegrees}deg, rgba(148, 163, 184, 0.16) ${progressDegrees}deg 360deg)` }}>
                  <div className="office-dashboard-progress-ring-inner">
                    <span>Closed rate</span>
                    <strong>{snapshot.goal.progressPercent}%</strong>
                    <p>{snapshot.goal.currentValueLabel}</p>
                  </div>
                </div>

                <SecondaryMetaList
                  className="office-dashboard-progress-meta"
                  items={[
                    { label: snapshot.goal.targetLabel, value: snapshot.goal.target },
                    { label: snapshot.goal.secondaryLabel, value: snapshot.goal.secondaryValue },
                    { label: "Latest month", value: `${latestChartPoint.value} opened` }
                  ]}
                />

                <p className="office-dashboard-progress-note">
                  Best recent month: <strong>{peakChartPoint.label}</strong> with <strong>{peakChartPoint.value}</strong> new transactions opened.
                </p>
              </aside>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          className="office-dashboard-transactions-card office-list-card"
          subtitle="Recently updated deals visible inside the current office scope."
          title="Recent transactions"
        >
          <div className="office-dashboard-transactions-summary">
            <SummaryChip label="Open pipeline" tone="accent" value={livePipelineCount} />
            <SummaryChip label="Follow-ups due" value={snapshot.contactsNeedingFollowUp} />
          </div>

          <DataTable className="office-dashboard-transactions-table">
            <DataTableHeader className="office-dashboard-transactions-head">
              <span>Transaction</span>
              <span>Price</span>
              <span>Status</span>
              <span>Owner</span>
            </DataTableHeader>
            <DataTableBody>
              {snapshot.recentTransactions.map((transaction) => (
                <DataTableRow className="office-dashboard-transactions-row" key={transaction.id}>
                  <div className="office-dashboard-transactions-main">
                    <strong>
                      <Link href={`/office/transactions/${transaction.id}`}>{transaction.label}</Link>
                    </strong>
                  </div>
                  <strong className="office-dashboard-transactions-amount">{transaction.amount}</strong>
                  <StatusBadge tone={getTransactionStatusTone(transaction.stage)}>
                    {transaction.stage.charAt(0).toUpperCase()}
                    {transaction.stage.slice(1)}
                  </StatusBadge>
                  <span className="office-dashboard-transactions-owner">{transaction.owner}</span>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </SectionCard>
      </div>
    </PageShell>
  );
}
