import { Link } from "react-router";
import { ROUTES } from "../routes/paths";

export function NotFoundPage() {
  return (
    <main>
      <h1>404 — Page not found</h1>

      <p>The page you requested does not exist.</p>

      <Link to={ROUTES.login}>Return to login</Link>
    </main>
  );
}
