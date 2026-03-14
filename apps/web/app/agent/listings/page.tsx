import { listListings } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function AgentListingsPage() {
  const listingFeed = listListings("agent");

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Listings</Badge>
          <h2>Agent marketing layer</h2>
          <p>
            This page brings listing search, marketing assets, share links, and custom notes together in one place.
          </p>
        </div>
        <div className="metric-strip">
          <span>Designed for every screen</span>
          <strong>Single-column mobile, split view on desktop.</strong>
          <p>Poster, QR, and share actions need one-thumb reach on phone.</p>
        </div>
      </section>

      <section className="workspace-grid">
        <Panel title="Suggested inventory" subtitle="A quick view of the listings ready to share and market.">
          <div className="list-column">
            {listingFeed.map((listing) => (
              <article className="list-row" key={listing.id}>
                <div className="list-row-top">
                  <strong>{listing.name}</strong>
                  <Badge tone="success">{listing.status}</Badge>
                </div>
                <p>{listing.area}</p>
                <p>{listing.hook}</p>
                <div className="list-row-meta">
                  <span>{listing.price}</span>
                  <span>Share link ready</span>
                  <span>{listing.trackedClicks} clicks</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Output modes" subtitle="The listings area supports both inventory review and marketing actions.">
          <div className="action-grid">
            <article className="action-card">
              <strong>WeChat share link</strong>
              <p>Agent-specific share link with activity tracking.</p>
            </article>
            <article className="action-card">
              <strong>Poster export</strong>
              <p>Auto-inserts agent identity, compliance fields, and listing highlights.</p>
            </article>
            <article className="action-card">
              <strong>Custom notes</strong>
              <p>Agent can append local insight or investment framing per target client.</p>
            </article>
          </div>
        </Panel>
      </section>
    </>
  );
}
