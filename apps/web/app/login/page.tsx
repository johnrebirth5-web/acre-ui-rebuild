import { getDefaultAppPath, getRoleSummary } from "@acre/auth";
import { getSeededWorkspaceSnapshot } from "@acre/db";
import { getCurrentSessionContext, shouldShowSeededUsers } from "../../lib/auth-session";
import { redirect } from "next/navigation";

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
  const featuredMemberships = seededWorkspace?.memberships.slice(0, 3) ?? [];
  const workspaceLabel = seededWorkspace?.office?.name ?? seededWorkspace?.organization.name ?? "Acre";

  return (
    <main className="auth-shell">
      <section className="auth-frame">
        <section className="auth-hero">
          <div className="auth-hero-copy">
            <span className="auth-eyebrow">Acre NY Realty</span>
            <h1>Office operations in one place.</h1>
            <p>Manage transactions, accounting, approvals, reporting, and follow-up from a single office workspace.</p>
          </div>

          <div className="auth-hero-metrics auth-hero-metrics-single">
            <article className="auth-hero-metric auth-hero-metric-accent">
              <span>Office</span>
              <strong>{workspaceLabel}</strong>
              <p>{seededWorkspace?.memberships.length ?? 0} quick sign-ins available</p>
            </article>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card-copy">
            <span className="auth-eyebrow">Sign in</span>
            <h2>Sign in to Acre</h2>
            <p>Use your office email to open the current workspace.</p>
          </div>

          <form action="/api/auth/login" className="auth-form" method="post">
            <label className="auth-field">
              <span>Email</span>
              <input autoComplete="email" defaultValue="simon@acre.com" name="email" placeholder="jane@acre.com" type="email" />
            </label>

            {params?.error ? <p className="auth-error">We couldn't find an active account with that email.</p> : null}

            <p className="auth-form-helper">Enter your office email, or use one of the quick sign-ins below.</p>

            <div className="auth-actions">
              <button className="auth-submit" type="submit">
                Enter Acre
              </button>
            </div>
          </form>

          {seededWorkspace ? (
            <section className="auth-demo-card">
              <div className="auth-demo-card-copy">
                <strong>Quick sign-in</strong>
                <p>Choose a common office profile to enter quickly.</p>
              </div>

              <div className="auth-user-grid">
                {featuredMemberships.map((membership) => (
                  <form action="/api/auth/login" className="auth-user-card" key={membership.membershipId} method="post">
                    <input name="email" type="hidden" value={membership.email} />
                    <div className="auth-user-card-copy">
                      <span>{getRoleSummary(membership.role).label}</span>
                      <strong>{membership.fullName}</strong>
                    </div>
                    <button className="auth-user-card-action" type="submit">
                      Continue
                    </button>
                  </form>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}
