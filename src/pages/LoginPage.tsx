import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Field } from "@/components/ui";
import { PORTALS, PORTAL_ORDER, type PortalKey } from "@/portals";
import { canonicalRoles, useAuth } from "@/state/auth";
import { errorMessage } from "@/state/toast";
import { LandingFrame } from "./PortalChooser";

export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, canAccess, logout } = useAuth();
  const portalKey = (PORTAL_ORDER as string[]).includes(params.get("portal") ?? "")
    ? (params.get("portal") as PortalKey)
    : null;
  const portal = portalKey ? PORTALS[portalKey] : null;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("denied") ? "Your account does not have access to this portal." : null,
  );

  useEffect(() => {
    document.title = "Sign in · PLRA Enterprise GIS";
  }, []);

  // Already signed in with the right role → go straight in.
  useEffect(() => {
    if (user && portalKey && canAccess(portalKey)) navigate(PORTALS[portalKey].home, { replace: true });
  }, [user, portalKey, canAccess, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await login(username.trim(), password);
      const roles = canonicalRoles(me);
      const allowed = (key: PortalKey) => me.is_superuser || PORTALS[key].roles.some((r) => roles.has(r));
      if (portalKey && allowed(portalKey)) {
        navigate(PORTALS[portalKey].home, { replace: true });
      } else if (portalKey) {
        setError(`Signed in, but this account does not have the ${PORTALS[portalKey].title} role.`);
      } else {
        const first = PORTAL_ORDER.find(allowed);
        navigate(first ? PORTALS[first].home : "/", { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const Icon = portal?.icon;

  return (
    <LandingFrame>
      <h1 className="landing__title">Sign in</h1>
      <p className="landing__sub">
        {portal ? `Continue to the ${portal.title} portal.` : "Use your PLRA Enterprise GIS account."}
      </p>

      <form className="card login-card" onSubmit={onSubmit}>
        {portal && Icon ? (
          <div className="login-card__portal">
            <span className="portal-card__icon" style={{ width: 48, height: 48 }}>
              <Icon />
            </span>
            <div>
              <div className="strong">{portal.title}</div>
              <div className="muted small">{portal.description}</div>
            </div>
          </div>
        ) : null}

        {user && portalKey && !canAccess(portalKey) ? (
          <p className="muted small" style={{ marginBottom: 16 }}>
            Signed in as <strong>{user.username}</strong>.{" "}
            <button type="button" className="btn btn--outline btn--sm" onClick={logout}>
              Use another account
            </button>
          </p>
        ) : null}

        <Field label="Username" required>
          <input
            className="input"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="Password" required>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn btn--primary btn--caps btn--block btn--lg mt-24" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="small muted mt-16">
          <Link to="/">← Choose a different portal</Link>
        </p>
      </form>
    </LandingFrame>
  );
}
