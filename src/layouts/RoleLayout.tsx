import { NavLink, Outlet } from "react-router";

interface NavigationItem {
  label: string;
  to: string;
}

interface RoleLayoutProps {
  roleName: string;
  navigation: NavigationItem[];
}

export function RoleLayout({ roleName, navigation }: RoleLayoutProps) {
  return (
    <div className="role-layout">
      <header>
        <h1>TAMP</h1>
        <p>{roleName}</p>
      </header>

      <nav aria-label={`${roleName} navigation`}>
        <ul>
          {navigation.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
