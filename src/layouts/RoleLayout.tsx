import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import "../styles/RoleLayout.css";

import { getUserById, USER_PROFILE_UPDATED_EVENT } from "../services/mockDb";
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

interface ProfileUpdatedEventDetail {
  userId?: string;
}

function ProfileAvatar({
  name,
  profileImage,
}: {
  name: string;
  profileImage?: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="role-layout__avatar" aria-hidden="true">
      {profileImage ? (
        <img className="role-layout__avatar-image" src={profileImage} alt="" />
      ) : (
        initial
      )}
    </div>
  );
}

export function RoleLayout({ roleName, navigation }: RoleLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  const session = getCurrentSession();
  const sessionId = session?.id;

  const [signedInUser, setSignedInUser] = useState(() =>
    sessionId ? getUserById(sessionId) : undefined,
  );

  useEffect(() => {
    if (!sessionId) {
      setSignedInUser(undefined);
      return;
    }

    const refreshSignedInUser = () => {
      setSignedInUser(getUserById(sessionId));
    };

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ProfileUpdatedEventDetail>;

      if (
        !customEvent.detail?.userId ||
        customEvent.detail.userId === sessionId
      ) {
        refreshSignedInUser();
      }
    };

    refreshSignedInUser();

    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);

    window.addEventListener("storage", refreshSignedInUser);

    return () => {
      window.removeEventListener(
        USER_PROFILE_UPDATED_EVENT,
        handleProfileUpdated,
      );

      window.removeEventListener("storage", refreshSignedInUser);
    };
  }, [sessionId, location.pathname]);

  const userFullName = signedInUser?.name ?? "User";

  const userCompany = signedInUser?.company ?? session?.email ?? roleName;

  const profileImage = signedInUser?.profileImage ?? null;

  const settingsPath =
    session?.role === "freight-owner" ? ROUTES.freightOwnerSettings : null;

  const handleLogout = () => {
    clearCurrentSession();
    navigate(ROUTES.login, {
      replace: true,
    });
  };

  const handleNavigation = () => {
    setIsNavigationOpen(false);
  };

  return (
    <div className="role-layout">
      <aside
        className={`role-layout__sidebar ${
          isNavigationOpen ? "role-layout__sidebar--open" : ""
        }`}
      >
        <div className="role-layout__brand role-layout__brand--dark">
          <span className="role-layout__brand-mark" aria-hidden="true" />

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

            {settingsPath && (
              <li className="role-layout__navigation-settings">
                <NavLink
                  to={settingsPath}
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

                  <span>Settings</span>
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="role-layout__sidebar-footer">
          <div className="role-layout__sidebar-user">
            <ProfileAvatar name={userFullName} profileImage={profileImage} />

            <div className="role-layout__sidebar-user-details">
              <span title={userFullName}>{userFullName}</span>

              <small title={userCompany}>{userCompany}</small>
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
            <span className="role-layout__topbar-user-name">
              {userFullName}
            </span>

            <ProfileAvatar name={userFullName} profileImage={profileImage} />
          </div>
        </header>

        <main className="role-layout__content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
