import { createContext, startTransition, useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { BrandLogos, PartnerBadge } from "@/components/brand";
import { ArrowLeftIcon, ArrowRightIcon, GearIcon, HomeIcon, UserIcon } from "@/components/icons";
import { PORTALS, type PortalKey } from "@/portals";
import { useAuth } from "@/state/auth";
import { useTheme } from "@/state/theme";

/** Pages publish their title here so the header can show it (Figma header centre). */
const TitleContext = createContext<(title: string) => void>(() => {});

export function usePageTitle(title: string) {
  const set = useContext(TitleContext);
  useEffect(() => {
    set(title);
    document.title = `${title} · PLRA Enterprise GIS`;
  }, [set, title]);
}

export function AppShell({ portal }: { portal: PortalKey }) {
  const config = PORTALS[portal];
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState(config.title);

  const displayName = user?.name || user?.username || config.title;

  return (
    <TitleContext.Provider value={setTitle}>
      <div className="shell">
        <header className="header">
          <div className="header__brand">
            <BrandLogos />
            <span className="header__app-name">PLRA Enterprise GIS</span>
            <nav className="header__nav" aria-label="History">
              <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}>
                <ArrowLeftIcon />
              </button>
              <button type="button" className="icon-btn" aria-label="Forward" onClick={() => navigate(1)}>
                <ArrowRightIcon />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--home"
                aria-label="Choose a portal"
                onClick={() => navigate("/")}
              >
                <HomeIcon />
              </button>
            </nav>
          </div>

          <div className="header__title">{title}</div>

          <div className="header__actions">
            <button
              type="button"
              className="theme-toggle"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Dark theme"
              onClick={toggle}
            />
            <button type="button" className="icon-btn header__gear" aria-label="Settings" title="Settings">
              <GearIcon />
            </button>
            <span className="header__user">{config.title}</span>
            <button
              type="button"
              className="btn btn--primary btn--caps"
              onClick={() => {
                // React Router applies navigations in a transition. Clear the user in
                // the same transition so both land in one render; otherwise
                // RequirePortal sees no user on this route first and redirects to
                // its sign-in page instead of the portal chooser.
                startTransition(() => {
                  logout();
                  navigate("/", { replace: true });
                });
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <aside className="sidebar">
          <div className="sidebar__profile">
            <span className="avatar">
              <UserIcon />
            </span>
            <div>
              <div className="sidebar__name">{displayName}</div>
              <div className="sidebar__role">{config.title}</div>
            </div>
          </div>
          <nav className="sidebar__nav" aria-label={`${config.title} navigation`}>
            {config.nav.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to !== config.home && location.pathname.startsWith(`${item.to}/`));
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={`nav-item${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="main">
          <Outlet />
        </main>

        <footer className="footer">
          <PartnerBadge />
          <span className="footer__product">PLRA Enterprise GIS &nbsp;|&nbsp; Green Parcel</span>
          <span>© {new Date().getFullYear()} Government of Punjab</span>
        </footer>
      </div>
    </TitleContext.Provider>
  );
}
