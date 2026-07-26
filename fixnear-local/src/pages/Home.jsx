import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";

import { useCategories } from "../hooks/useCategories.js";
import CategoryCard from "../components/CategoryCard.jsx";
import FeatureCard from "../components/FeatureCard.jsx";
import { Button, SectionHeading, Spinner } from "../components/ui.jsx";

const steps = [
  {
    title: "Describe the problem",
    description: "Pick the appliance, add photos and tell us what went wrong.",
    Icon: MessageSquare,
  },
  {
    title: "Get matched nearby",
    description: "We surface verified technicians in your city and pincode range.",
    Icon: MapPin,
  },
  {
    title: "Track till it's fixed",
    description: "Follow the visit status from request to completion in one place.",
    Icon: BadgeCheck,
  },
];

const features = [
  {
    title: "Verified technicians",
    description: "Every technician is manually approved before receiving jobs.",
    Icon: ShieldCheck,
  },
  {
    title: "Transparent pricing",
    description: "Discuss the estimate up front — no surprise charges after the visit.",
    Icon: Wallet,
  },
  {
    title: "Fast response",
    description: "Most requests receive technician interest within a few hours.",
    Icon: Clock,
  },
  {
    title: "Rated by real customers",
    description: "Ratings and reviews come only from completed jobs.",
    Icon: Star,
  },
];

export default function Home() {
  const { data: categories, isLoading } = useCategories();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hero-gradient-start to-hero-gradient-end">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-medium shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Trusted repair marketplace for India
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Electronic repairs,
              <br />
              <span className="text-primary">fixed near you.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Book a verified technician for your AC, fridge, TV, washing machine, mobile
              or laptop. Local experts, honest pricing, no runaround.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/new-request" size="lg">
                Book a repair
              </Button>
              <Button as={Link} to="/register-technician" size="lg" variant="outline">
                Join as a technician
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                ["15+", "Categories"],
                ["100%", "Verified pros"],
                ["24h", "Avg. response"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-bold">{value}</dt>
                  <dd className="text-sm text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="aspect-4/3 overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=70"
                alt="Technician repairing an electronic appliance"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          eyebrow="What we fix"
          title="Every appliance, one platform"
          description="Choose a category and describe the issue — we handle the matching."
        />

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(categories ?? []).map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps to a working device"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-card p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.Icon className="h-6 w-6" />
                </div>
                <p className="mt-5 text-sm font-semibold text-primary">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading eyebrow="Why FixNear" title="Built on trust, not guesswork" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold sm:text-4xl">Something broken at home?</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Post your repair request in under two minutes and get matched with
            technicians near you.
          </p>
          <Button
            as={Link}
            to="/new-request"
            size="lg"
            className="mt-8 bg-card text-foreground hover:opacity-90"
          >
            Book a repair now
          </Button>
        </div>
      </section>
    </>
  );
}
