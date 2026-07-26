import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Wrench, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { Button } from "./ui.jsx";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const { isAuthenticated, isTechnician, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${isActive ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </span>
          FixNear <span className="text-primary">India</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {publicLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/requests" className={linkClass}>
                My Requests
              </NavLink>
              {isTechnician && (
                <NavLink to="/technician-requests" className={linkClass}>
                  My Jobs
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            ) : (
              <>
                <Button as={Link} to="/register-technician" variant="ghost" size="sm">
                  Become a technician
                </Button>
                <Button as={Link} to="/auth" size="sm">
                  Sign in
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {publicLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setOpen(false)} end>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/requests" className={linkClass} onClick={() => setOpen(false)}>
                  My Requests
                </NavLink>
                {isTechnician && (
                  <NavLink to="/technician-requests" className={linkClass} onClick={() => setOpen(false)}>
                    My Jobs
                  </NavLink>
                )}
                <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                  Profile
                </NavLink>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="mt-2">
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/register-technician" className={linkClass} onClick={() => setOpen(false)}>
                  Become a technician
                </NavLink>
                <Button as={Link} to="/auth" size="sm" className="mt-2" onClick={() => setOpen(false)}>
                  Sign in
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
