import { getDefaultAppPath } from "@acre/auth";
import { getCurrentSessionContext } from "../../lib/auth-session";
import { getLoginCompanyLabel, loginCompanies, parseLoginCompanyKey } from "../../lib/login-companies";
import Link from "next/link";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<{
    company?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const context = await getCurrentSessionContext();

  if (context) {
    redirect(getDefaultAppPath(context.currentMembership.role));
  }

  const params = searchParams ? await searchParams : undefined;
  const selectedCompany = parseLoginCompanyKey(params?.company);
  const selectedCompanyLabel = getLoginCompanyLabel(selectedCompany);
  const isCompanyStepComplete = Boolean(selectedCompany);

  return (
    <main className="auth-shell">
      <section className="auth-frame">
        <section className="auth-hero">
          <div className="auth-hero-copy">
            <span className="auth-eyebrow">Acre system</span>
            <h1>{isCompanyStepComplete ? selectedCompanyLabel ?? "Administrator login" : "Which service would you like to access?"}</h1>
            <p>{isCompanyStepComplete ? "Continue to the administrator login." : "Choose Acre NY Realty, Acre NJ, or Acre Rental to continue."}</p>
          </div>

          <div className="auth-company-grid">
            {loginCompanies.map((company) => {
              const isSelected = company.key === selectedCompany;

              return (
                <Link
                  key={company.key}
                  className={`auth-company-card${isSelected ? " auth-company-card-selected" : ""}`}
                  href={`/login?company=${company.key}`}
                >
                  <span>{company.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card-copy">
            <span className="auth-eyebrow">Sign in</span>
            <h2>{isCompanyStepComplete ? "Administrator login" : "Choose a company"}</h2>
            <p>{isCompanyStepComplete ? "The test username and password are already filled in." : "Start from the company buttons on the left."}</p>
          </div>

          {isCompanyStepComplete ? (
            <form action="/api/auth/login" className="auth-form" method="post">
              <input name="company" type="hidden" value={selectedCompany ?? ""} />

              <label className="auth-field">
                <span>Username</span>
                <input autoComplete="username" defaultValue="admin" name="username" type="text" />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <input autoComplete="current-password" defaultValue="admin" name="password" type="password" />
              </label>

              {params?.error ? <p className="auth-error">The username or password is incorrect.</p> : null}

              <p className="auth-form-helper">Click continue to sign in.</p>

              <div className="auth-actions">
                <button className="auth-submit" type="submit">
                  Continue
                </button>
                <Link className="auth-secondary-link" href="/login">
                  Back
                </Link>
              </div>
            </form>
          ) : (
            <div className="auth-empty-state">
              <strong>Company selection required</strong>
              <p>Choose Acre NY Realty, Acre NJ, or Acre Rental to continue to the sign-in step.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
