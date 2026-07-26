import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wrench className="h-5 w-5" />
            </span>
            FixNear <span className="text-primary">India</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Verified local technicians for every electronic repair — booked in minutes,
            tracked end to end.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">About us</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
            </li>
            <li>
              <Link to="/register-technician" className="hover:text-foreground">
                Join as technician
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/privacy" className="hover:text-foreground">Privacy policy</Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-foreground">Terms of service</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FixNear India. All rights reserved.
      </div>
    </footer>
  );
}
