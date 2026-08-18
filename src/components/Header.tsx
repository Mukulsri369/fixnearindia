import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Wrench, User, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { signOut } from "@/lib/auth.functions";
import { NotificationBell } from "./NotificationBell";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAuthenticated, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const doSignOut = useServerFn(signOut);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isActive = (to: string) => pathname === to;

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await doSignOut({ data: undefined });
    navigate({ to: "/", replace: true });
    toast.success("Signed out");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">FixNear</span>
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">India</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? <NotificationBell /> : null}
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            {isLoading ? null : isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="gap-2 font-medium">
                    <User className="h-4 w-4" /> Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" className="gap-2 font-medium" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="font-medium">
                    Log in
                  </Button>
                </Link>
                <Link to="/register-technician">
                  <Button className="font-medium">Register as Technician</Button>
                </Link>
              </>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-6 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 border-border" />
                {isLoading ? null : isAuthenticated ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full justify-start font-medium">
                        <User className="mr-2 h-4 w-4" /> Dashboard
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start font-medium" onClick={() => { setOpen(false); handleSignOut(); }}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full justify-start font-medium">
                        Log in
                      </Button>
                    </Link>
                    <Link to="/register-technician" onClick={() => setOpen(false)}>
                      <Button className="w-full justify-start font-medium">Register as Technician</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
