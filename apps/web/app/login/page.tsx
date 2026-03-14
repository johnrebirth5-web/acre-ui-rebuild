import { getDefaultAppPath } from "@acre/auth";
import { getSeededWorkspaceSnapshot } from "@acre/db";
import { getCurrentSessionContext, shouldShowSeededUsers } from "../../lib/auth-session";
import { redirect } from "next/navigation";
import { SiteReleaseBadge } from "../site-release-badge";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const context = await getCurrentSessionContext();

  if (context) {
    redirect(getDefaultAppPath(context.currentMembership.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const seededWorkspace = shouldShowSeededUsers() ? await getSeededWorkspaceSnapshot().catch(() => null) : null;
  const featuredMemberships = seededWorkspace?.memberships.slice(0, 4) ?? [];
  const uniqueRoles = seededWorkspace ? Array.from(new Set(seededWorkspace.memberships.map((membership) => membership.role))) : [];
  const workspaceLabel = seededWorkspace?.office?.name ?? seededWorkspace?.organization.name ?? "Acre";

  return (
    <main className="auth-shell">
      <section className="auth-frame">
        <section className="auth-hero">
          <div className="auth-hero-copy">
            <span className="auth-eyebrow">Acre System</span>
            <h1>A calmer operating system for the office.</h1>
            <p>Transactions, accounting, approvals, reporting, and agent operations stay together in one organized office workspace.</p>
          </div>

          <div className="auth-hero-metrics">
            <article className="auth-hero-metric auth-hero-metric-accent">
              <span>Workspace</span>
              <strong>{workspaceLabel}</strong>
              <p>{seededWorkspace?.organization.name ?? "Acre NY Realty"}</p>
            </article>
            <article className="auth-hero-metric">
              <span>Available users</span>
              <strong>{seededWorkspace?.memberships.length ?? 0}</strong>
              <p>{uniqueRoles.length} active role types</p>
            </article>
          </div>

          {featuredMemberships.length > 0 ? (
            <section className="auth-quick-access">
              <div className="auth-quick-access-copy">
                <strong>Quick sign-in</strong>
                <p>Choose one of the saved office profiles below to enter quickly.</p>
              </div>

              <div className="auth-user-grid">
                {featuredMemberships.map((membership) => (
                  <form action="/api/auth/login" className="auth-user-card" key={membership.membershipId} method="post">
                    <input name="email" type="hidden" value={membership.email} />
                    <div className="auth-user-card-copy">
                      <span>{membership.role}</span>
                      <strong>{membership.fullName}</strong>
                      <p>{membership.email}</p>
                    </div>
                    <button className="auth-user-card-action" type="submit">
                      Open workspace
                    </button>
                  </form>
                ))}
              </div>
            </section>
          ) : null}
        </section>

        <section className="auth-panel">
          <div className="auth-card-copy">
            <span className="auth-eyebrow">Sign in</span>
            <h2>Enter Acre</h2>
            <p>Use your office email to open the current workspace.</p>
            <SiteReleaseBadge className="site-release-badge-auth" />
          </div>

          <form action="/api/auth/login" className="auth-form" method="post">
            <label className="auth-field">
              <span>Email</span>
              <input autoComplete="email" defaultValue="simon@acre.com" name="email" placeholder="jane@acre.com" type="email" />
            </label>

            {params?.error ? <p className="auth-error">We couldn't find an active account with that email.</p> : null}

            <p className="auth-form-helper">You can sign in with any active office email listed below.</p>

            <div className="auth-actions">
              <button className="auth-submit" type="submit">
                Enter Acre
              </button>
            </div>
          </form>

          {seededWorkspace ? (
            <section className="auth-demo-card">
              <div className="auth-demo-card-copy">
                <strong>Available profiles</strong>
                <p>Office profiles currently available in this workspace.</p>
              </div>
              <ul>
                {seededWorkspace.memberships.map((membership) => (
                  <li key={membership.membershipId}>
                    <span>
                      {membership.fullName} · {membership.role}
                    </span>
                    <code>{membership.email}</code>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}
