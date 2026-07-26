import { Link } from "react-router-dom";
import { Button } from "../components/ui.jsx";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Button as={Link} to="/" className="mt-8">
        Back to home
      </Button>
    </div>
  );
}
