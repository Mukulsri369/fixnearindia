export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">Privacy policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <section className="mt-10 space-y-6 text-muted-foreground">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Information we collect</h2>
          <p className="mt-2">
            Account details (name, email, phone), repair request details including address and
            photos you upload, and technician application information.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">How we use it</h2>
          <p className="mt-2">
            To match your request with technicians near you, communicate job status, and improve
            the service. Your address and phone are shared with a technician only after they
            accept your request.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Data storage</h2>
          <p className="mt-2">
            Data is stored in a managed Postgres database with row level security so users can
            only read their own records. Uploaded images are stored in object storage.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your rights</h2>
          <p className="mt-2">
            You can update your profile at any time and request deletion of your account and
            associated data by writing to support@fixnear.in.
          </p>
        </div>
      </section>
    </div>
  );
}
