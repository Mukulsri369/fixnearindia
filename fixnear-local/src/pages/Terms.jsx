export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">Terms of service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <section className="mt-10 space-y-6 text-muted-foreground">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Marketplace role</h2>
          <p className="mt-2">
            FixNear India connects customers with independent repair technicians. We are not the
            service provider and do not perform repairs ourselves.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Customer responsibilities</h2>
          <p className="mt-2">
            Provide accurate device, address and contact details, and be available at the agreed
            visit time. Repair charges are agreed directly with the technician.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Technician responsibilities</h2>
          <p className="mt-2">
            Maintain accurate profile information, honour accepted jobs, quote transparently and
            follow applicable laws and safety practices.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Account suspension</h2>
          <p className="mt-2">
            We may suspend accounts that submit fraudulent requests, repeatedly abandon accepted
            jobs, or receive consistently poor reviews.
          </p>
        </div>
      </section>
    </div>
  );
}
