import { Link } from "react-router";
import { ROUTES } from "../../routes/paths";

export function LoginPage() {
  return (
    <main>
      <h1>Welcome to TAMP</h1>

      <p>Sign in or select a temporary role to test the application routes.</p>

      <nav aria-label="Role selection">
        <ul>
          <li>
            <Link to={ROUTES.freightOwner}>Continue as Freight Owner</Link>
          </li>

          <li>
            <Link to={ROUTES.transporter}>Continue as Transporter</Link>
          </li>

          <li>
            <Link to={ROUTES.admin}>Continue as Administrator</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
