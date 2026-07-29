import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import "../styles/RoleLayout.css";

import {
  clearCurrentSession,
  getCurrentSession,
} from "../services/authService";

import { ROUTES } from "../routes/paths";

interface NavigationItem {
  label: string;
  to: string;
}

interface RoleLayoutProps {
  roleName: string;
  navigation: NavigationItem[];
}

export function RoleLayout({ roleName, navigation }: RoleLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  const session = getCurrentSession();

  const handleLogout = () => {
    clearCurrentSession();
    navigate(ROUTES.login, { replace: true });
  };

  const handleNavigation = () => {
    setIsNavigationOpen(false);
  };

  const userInitial = session?.email
    ? session.email.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="role-layout">
      <aside
        className={`role-layout__sidebar ${
          isNavigationOpen ? "role-layout__sidebar--open" : ""
        }`}
      >
        <div className="role-layout__brand">
          <div className="role-layout__brand-mark">T</div>

          <div className="role-layout__brand-copy">
            <span className="role-layout__brand-name">TAMP</span>

            <span className="role-layout__brand-description">
              Freight Platform
            </span>
          </div>

          <button
            type="button"
            className="role-layout__close-navigation"
            aria-label="Close navigation"
            onClick={() => setIsNavigationOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="role-layout__role">
          <span>Workspace</span>
          <strong>{roleName}</strong>
        </div>

        <nav
          className="role-layout__navigation"
          aria-label={`${roleName} navigation`}
        >
          <ul>
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  onClick={handleNavigation}
                  className={({ isActive }) =>
                    [
                      "role-layout__navigation-link",
                      isActive ? "role-layout__navigation-link--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  <span
                    className="role-layout__navigation-indicator"
                    aria-hidden="true"
                  />

                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="role-layout__sidebar-footer">
          <div className="role-layout__sidebar-user">
            <div className="role-layout__avatar" aria-hidden="true">
              {userInitial}
            </div>

            <div className="role-layout__sidebar-user-details">
              <span>{roleName}</span>

              {session?.email && (
                <small title={session.email}>{session.email}</small>
              )}
            </div>
          </div>

          <button
            type="button"
            className="role-layout__logout"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      {isNavigationOpen && (
        <button
          type="button"
          className="role-layout__overlay"
          aria-label="Close navigation"
          onClick={() => setIsNavigationOpen(false)}
        />
      )}

      <div className="role-layout__workspace">
        <header className="role-layout__topbar">
          <div className="role-layout__topbar-left">
            <button
              type="button"
              className="role-layout__menu-button"
              aria-label="Open navigation"
              aria-expanded={isNavigationOpen}
              onClick={() => setIsNavigationOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>

            <div>
              <p className="role-layout__topbar-label">TAMP</p>

              <p className="role-layout__topbar-role">{roleName}</p>
            </div>
          </div>

          <div className="role-layout__topbar-user">
            <div>
              <span>{roleName}</span>

              {session?.email && <small>{session.email}</small>}
            </div>

            <div className="role-layout__avatar" aria-hidden="true">
              {userInitial}
            </div>
          </div>
        </header>

        <main className="role-layout__content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
