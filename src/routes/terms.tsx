import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — FixNear India" },
      { name: "description", content: "Read the FixNear India terms of service for customers and technicians." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-6 text-muted-foreground">
          By using FixNear India, you agree to these terms. Please read them carefully.
        </p>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="text-xl font-semibold">Platform Services</h2>
            <p className="mt-2 text-muted-foreground">
              FixNear India connects customers with independent repair technicians. We facilitate matching, scheduling, and communication but are not responsible for the actual repair work performed by technicians.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">User Accounts</h2>
            <p className="mt-2 text-muted-foreground">
              Users must provide accurate information. Technicians must undergo verification before accepting repair requests. Customers must provide accurate device and location details.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Payments & Cancellations</h2>
            <p className="mt-2 text-muted-foreground">
              Payment terms are agreed upon between the customer and technician. Cancellations should be made as early as possible. Repeated cancellations may result in account restrictions.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Liability</h2>
            <p className="mt-2 text-muted-foreground">
              FixNear India is not liable for damages arising from repair services. Disputes between customers and technicians should be resolved directly; we may mediate when necessary.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
