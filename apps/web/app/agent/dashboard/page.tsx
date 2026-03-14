import { summarizeAccess } from "@acre/auth";
import { getAgentDashboardSnapshot } from "@acre/backoffice";
import { Badge, Panel, StatCard } from "@acre/ui";

export default function AgentDashboardPage() {
  const snapshot = getAgentDashboardSnapshot();
  const access = summarizeAccess("agent");

  return (
    <>
      <section className="page-banner">
        <div className="workspace-lead">
          <Badge tone="accent">Agent Dashboard</Badge>
          <h1>One surface for today&apos;s follow-up, listing activity, and next actions.</h1>
          <p>
            This layout is designed for quick scanning on desktop and compact action access on mobile.
          </p>
          <div className="hero-kpis">
            {snapshot.metrics.slice(0, 3).map((metric) => (
              <div className="mini-kpi" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <aside className="summary-callout">
          <Badge tone="success">Today&apos;s focus</Badge>
          <strong>Push active leads, publish one hero listing, and clear the event queue.</strong>
          <p>Designed to work cleanly on phone screens so agents can operate without laptop-only dependency.</p>
        </aside>
      </section>

      <section className="workspace-grid">
        <div className="panel-stack">
          <Panel title="Priority queue" subtitle="See the follow-ups and reminders that need attention first.">
            <div className="list-column">
              {snapshot.tasks.map((task) => (
                <article className="list-row" key={task.id}>
                  <div className="list-row-top">
                    <strong>{task.title}</strong>
                    <Badge tone={task.priority === "High" ? "accent" : task.priority === "Medium" ? "neutral" : "success"}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p>{task.subtitle}</p>
                  <div className="list-row-meta">
                    <span>{task.dueLabel}</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Featured inventory" subtitle="A quick view of the listings that matter most right now.">
            <div className="list-column">
              {snapshot.listings.map((listing) => (
                <article className="list-row" key={listing.id}>
                  <div className="list-row-top">
                    <strong>{listing.name}</strong>
                    <Badge tone="neutral">{listing.status}</Badge>
                  </div>
                  <p>{listing.area}</p>
                  <p>{listing.hook}</p>
                  <div className="list-row-meta">
                    <span>{listing.price}</span>
                    <span>{listing.trackedClicks} listing views</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Agent quick stack" subtitle="A quick view of the tools and access available in this workspace.">
          <div className="stats-grid">
            <StatCard label="Role" value={access.label} hint={`${access.permissionCount} enabled permissions`} />
            <StatCard label="Listing writer" value="Ready" hint="Multi-output copy and marketing scripts." />
            <StatCard label="Reply assistant" value="Ready" hint="Buyer, seller, renter, and objection templates." />
            <StatCard label="Knowledge base" value="Ready" hint="Answers and resources prepared for the Acre team." />
          </div>
        </Panel>
      </section>
    </>
  );
}
