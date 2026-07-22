import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { queryOptions } from "@tanstack/react-query";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/CategoryCard";
import { FeatureCard } from "@/components/FeatureCard";
import { getCategories } from "@/lib/categories.functions";

const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FixNear India — Trusted Electronics Repair Technicians" },
      { name: "description", content: "Connect with verified electronics repair technicians near you in India. Laptops, ACs, TVs, washing machines, and more." },
      { property: "og:title", content: "FixNear India — Trusted Electronics Repair Technicians" },
      { property: "og:description", content: "Connect with verified electronics repair technicians near you in India. Laptops, ACs, TVs, washing machines, and more." },
      { property: "og:image", content: "https://id-preview--5e5a2763-8d97-4eba-bf3e-b0c5d3930af4.lovable.app/images/hero-technician.jpg" },
      { name: "twitter:image", content: "https://id-preview--5e5a2763-8d97-4eba-bf3e-b0c5d3930af4.lovable.app/images/hero-technician.jpg" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  component: HomePage,
});

const features = [
  {
    title: "Verified Technicians",
    description: "Every technician is identity-verified, skill-checked, and reviewed by real customers.",
    Icon: Shield,
  },
  {
    title: "Nearby Matching",
    description: "We connect you with the closest available technician, reducing wait times and travel costs.",
    Icon: MapPin,
  },
  {
    title: "Fair Pricing",
    description: "Get transparent estimates before work begins. No hidden charges, no surprise fees.",
    Icon: CheckCircle2,
  },
  {
    title: "Fast Turnaround",
    description: "Most repairs are scheduled same-day or next-day, with real-time status updates.",
    Icon: Clock,
  },
  {
    title: "Wide Coverage",
    description: "From laptops and TVs to ACs, washing machines, inverters, and more — we cover it.",
    Icon: Wrench,
  },
  {
    title: "Easy Booking",
    description: "Describe your issue, upload a photo, choose a slot, and relax while we handle the rest.",
    Icon: Calendar,
  },
];

const steps = [
  {
    title: "Describe the problem",
    description: "Select your device category, add symptoms, and upload photos if needed.",
    Icon: Zap,
  },
  {
    title: "Get matched",
    description: "Our system finds nearby technicians based on skill, availability, and distance.",
    Icon: MapPin,
  },
  {
    title: "Repair & review",
    description: "Approve the estimate, get the repair done, and rate your experience.",
    Icon: Star,
  },
];

function HomePage() {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-muted/30 px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-40">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-accent/50 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Now serving Bangalore, expanding across India
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Trusted repair technicians, <span className="text-primary">near you.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              FixNear India connects customers with verified electronics repair experts. From laptops to air conditioners, get reliable help at fair prices.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2 font-medium">
                  Book a Repair <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register-technician">
                <Button size="lg" variant="outline" className="font-medium">
                  Become a Technician
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Verified pros</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Transparent pricing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Quick turnaround</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
              <img
                src="/images/hero-technician.jpg"
                alt="Professional technician repairing a laptop in a modern Indian electronics repair shop"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-lg lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-sm font-semibold">4.9 average rating</p>
                  <p className="text-xs text-muted-foreground">From verified customers</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What do you need fixed?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Choose from a wide range of electronics and appliances. Each category connects you to specialists trained for that device.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                icon={category.icon ?? "wrench"}
                description={category.description ?? undefined}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Three simple steps to get your device back in working order.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <step.Icon className="h-7 w-7" />
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why FixNear India?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Built for Indian homes and technicians, with trust, speed, and transparency at the center.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                Icon={feature.Icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-primary-foreground sm:px-12 lg:px-20">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to fix what's broken?</h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Join thousands of customers who trust FixNear India for fast, reliable repairs.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="gap-2 font-medium">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
