import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield, MapPin, Users, Wrench } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — FixNear India" },
      { name: "description", content: "Learn how FixNear India connects customers with verified electronics repair technicians across the country." },
      { property: "og:title", content: "About Us — FixNear India" },
      { property: "og:description", content: "Learn how FixNear India connects customers with verified electronics repair technicians across the country." },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    title: "Trust First",
    description: "We verify technician identities, skills, and work history so customers feel confident letting someone into their home.",
    Icon: Shield,
  },
  {
    title: "Local Focus",
    description: "Our matching prioritizes nearby technicians, reducing wait times and supporting local repair professionals.",
    Icon: MapPin,
  },
  {
    title: "People-Centered",
    description: "Both customers and technicians deserve a fair, transparent experience with clear communication and honest pricing.",
    Icon: Users,
  },
  {
    title: "Quality Repairs",
    description: "We encourage proper diagnosis, quality parts, and accountable service so devices last longer after repair.",
    Icon: Wrench,
  },
];

function AboutPage() {
  return (
    <div className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About FixNear India</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            FixNear India is a platform built to solve a simple, everyday problem: when your electronics break, finding a reliable, nearby technician shouldn't be difficult.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-muted/50 p-8"
          >
            <h2 className="text-2xl font-semibold">For Customers</h2>
            <p className="mt-4 text-muted-foreground">
              We help you book repairs for laptops, desktops, TVs, ACs, washing machines, inverters, UPS units, and more. Describe the issue, upload a photo, and get matched with a verified technician who can fix it.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-muted/50 p-8"
          >
            <h2 className="text-2xl font-semibold">For Technicians</h2>
            <p className="mt-4 text-muted-foreground">
              FixNear India gives skilled repair professionals a steady stream of local jobs, transparent customer expectations, and a review system that rewards great work. Register your skills and start accepting requests.
            </p>
          </motion.div>
        </div>

        <div className="mt-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">Our Values</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <FeatureCard
                key={value.title}
                title={value.title}
                description={value.description}
                Icon={value.Icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
