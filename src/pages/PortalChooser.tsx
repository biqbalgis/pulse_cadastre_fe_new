import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { BrandLogos, PartnerBadge } from "@/components/brand";
import { ChevronRightIcon } from "@/components/icons";
import fieldsArt from "@/assets/fields.svg";
import { PORTAL_ORDER, PORTALS, type PortalKey } from "@/portals";
import { useAuth } from "@/state/auth";

export function LandingFrame({ children }: { children: ReactNode }) {
  return (
    <div className="landing">
      <header className="landing__header">
        <BrandLogos />
        <span className="header__app-name">PLRA Enterprise GIS</span>
      </header>
      <div className="landing__body">
        <div className="landing__content">{children}</div>
        <div
          className="landing__art"
          role="img"
          aria-label="Aerial view of agricultural parcels"
          style={{ backgroundImage: `url("${fieldsArt}")` }}
        />
      </div>
      <footer className="landing__footer">
        <PartnerBadge />
      </footer>
    </div>
  );
}

export function PortalChooser() {
  const navigate = useNavigate();
  const { user, canAccess, logout } = useAuth();

  useEffect(() => {
    document.title = "Choose a Portal · PLRA Enterprise GIS";
  }, []);

  const open = (key: PortalKey) => {
    if (!user) navigate(`/login?portal=${key}`);
    else if (canAccess(key)) navigate(PORTALS[key].home);
    else navigate(`/login?portal=${key}&denied=1`);
  };

  return (
    <LandingFrame>
      <h1 className="landing__title">Choose a Portal</h1>
      <p className="landing__sub">Select a portal for your role.</p>
      <div className="portal-list">
        {PORTAL_ORDER.map((key) => {
          const portal = PORTALS[key];
          const Icon = portal.icon;
          const locked = !!user && !canAccess(key);
          return (
            <button
              key={key}
              type="button"
              className={`portal-card${locked ? " is-locked" : ""}`}
              onClick={() => open(key)}
              title={locked ? "Your account does not have this role" : undefined}
            >
              <span className="portal-card__icon">
                <Icon />
              </span>
              <span>
                <span className="portal-card__title" style={{ display: "block" }}>
                  {portal.title}
                </span>
                <span className="portal-card__desc" style={{ display: "block" }}>
                  {portal.description}
                </span>
              </span>
              <ChevronRightIcon className="portal-card__chevron" />
            </button>
          );
        })}
      </div>
      {user ? (
        <p className="muted mt-24">
          Signed in as <strong>{user.name || user.username}</strong> ·{" "}
          <button type="button" className="btn btn--outline btn--sm" onClick={logout}>
            Sign out
          </button>
        </p>
      ) : null}
    </LandingFrame>
  );
}
