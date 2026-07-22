import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FixNear India" },
      { name: "description", content: "Read the FixNear India privacy policy to understand how we handle your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-6 text-muted-foreground">
          FixNear India is committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information.
        </p>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="text-xl font-semibold">Information We Collect</h2>
            <p className="mt-2 text-muted-foreground">
              We collect account information (name, email, phone), location data for matching technicians, repair request details, and payment information when applicable.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">How We Use Information</h2>
            <p className="mt-2 text-muted-foreground">
              Your information is used to provide repair services, match you with nearby technicians, process payments, send notifications, and improve our platform.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Data Sharing</h2>
            <p className="mt-2 text-muted-foreground">
              We share necessary information with technicians to fulfill your repair request. We do not sell your personal data to third parties.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="mt-2 text-muted-foreground">
              We use industry-standard security measures including encryption, secure authentication, and access controls to protect your data.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
