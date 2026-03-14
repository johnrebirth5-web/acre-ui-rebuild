import { listResources, listVendors } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function AgentResourcesPage() {
  const resourceFeed = listResources();
  const vendorFeed = listVendors();

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Resource Hub</Badge>
          <h2>Training, vendors, docs, and searchable Acre knowledge.</h2>
          <p>
            Keep training, vendors, and office knowledge in one place so agents can find what they need quickly.
          </p>
        </div>
      </section>

      <section className="workspace-grid">
        <Panel title="Resource families" subtitle="Browse the main types of material available to the team.">
          <div className="list-column">
            {resourceFeed.map((resource) => (
              <article className="list-row" key={resource.id}>
                <div className="list-row-top">
                  <strong>{resource.title}</strong>
                  <Badge tone="neutral">{resource.type}</Badge>
                </div>
                <p>{resource.summary}</p>
                <div className="list-row-meta">
                  {resource.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Vendor directory" subtitle="A quick directory of trusted vendors and service contacts.">
          <div className="list-column">
            {vendorFeed.map((vendor) => (
              <article className="list-row" key={vendor.id}>
                <div className="list-row-top">
                  <strong>{vendor.name}</strong>
                  <Badge tone="success">{vendor.category}</Badge>
                </div>
                <p>{vendor.headline}</p>
                <div className="list-row-meta">
                  {vendor.neighborhoods.map((neighborhood) => (
                    <span key={neighborhood}>{neighborhood}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}
