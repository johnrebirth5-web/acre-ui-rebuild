import { summarizeAccess } from "@acre/auth";
import { listClients } from "@acre/backoffice";
import { Badge, Panel, StatCard } from "@acre/ui";

export default function AgentClientsPage() {
  const access = summarizeAccess("agent");
  const clientFeed = listClients();

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Clients</Badge>
          <h2>A clean pipeline for follow-up, reminders, and next steps.</h2>
          <p>
            Keep client details easy to capture and easy to revisit, without clutter.
          </p>
        </div>
        <div className="metric-strip">
          <span>Current access</span>
          <strong>{access.label}</strong>
          <p>Designed to keep notes, reminders, and next actions easy to use in the field.</p>
        </div>
      </section>

      <section className="workspace-grid">
        <Panel title="Client pipeline" subtitle="Every feature here should make follow-up faster and clearer.">
          <div className="list-column">
            {clientFeed.map((client) => (
              <article className="list-row" key={client.id}>
                <div className="list-row-top">
                  <strong>{client.fullName}</strong>
                  <Badge tone="neutral">{client.stage}</Badge>
                </div>
                <p>{client.intent} · {client.budget}</p>
                <p>{client.areas.join(", ")}</p>
                <div className="list-row-meta">
                  <span>{client.source}</span>
                  <span>Last contact {client.lastContactLabel}</span>
                  <span>Next {client.nextFollowUpLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Workspace tools" subtitle="These blocks support daily client follow-up and planning.">
          <div className="stats-grid">
            <StatCard label="Role access" value={`${access.permissionCount} permissions`} hint="Built to stay simple and quick to use." />
            <StatCard label="Photo capture" value="Coming soon" hint="Capture name, budget, area, and intent." />
            <StatCard label="Reminder engine" value="Coming soon" hint="Date-based prompts for client touchpoints." />
            <StatCard label="Reply generation" value="Planned" hint="Context-aware follow-up text generation." />
          </div>
        </Panel>
      </section>
    </>
  );
}
