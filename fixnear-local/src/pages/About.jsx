export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">About FixNear India</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        FixNear India is a repair marketplace built for Indian households. We connect people
        with verified local technicians for appliances and electronics — from air
        conditioners and refrigerators to laptops and mobile phones.
      </p>
      <h2 className="mt-12 text-2xl font-semibold">Why we built it</h2>
      <p className="mt-3 text-muted-foreground">
        Finding a trustworthy repair professional usually means asking neighbours and hoping
        for the best. We replace that with verified profiles, transparent request tracking and
        reviews that come only from completed jobs.
      </p>
      <h2 className="mt-10 text-2xl font-semibold">How we verify technicians</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
        <li>Every technician submits an application with experience and service area.</li>
        <li>Applications are manually reviewed before any job is routed to them.</li>
        <li>Only approved and available technicians appear in customer matching.</li>
        <li>Ratings are tied to real, completed repair jobs.</li>
      </ul>
    </div>
  );
}
