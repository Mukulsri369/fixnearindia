import { motion } from "framer-motion";
import {
  Activity,
  Battery,
  Cpu,
  Droplet,
  Factory,
  HeartPulse,
  Laptop,
  Monitor,
  Printer,
  Settings,
  Snowflake,
  Sun,
  Video,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  desktop: Monitor,
  battery: Battery,
  zap: Zap,
  activity: Activity,
  droplet: Droplet,
  snowflake: Snowflake,
  wind: Wind,
  printer: Printer,
  video: Video,
  sun: Sun,
  factory: Factory,
  cpu: Cpu,
  "heart-pulse": HeartPulse,
  wrench: Wrench,
  settings: Settings,
};

interface CategoryCardProps {
  name: string;
  icon: string;
  description?: string;
  index?: number;
}

export function CategoryCard({ name, icon, description, index = 0 }: CategoryCardProps) {
  const Icon = iconMap[icon] ?? Wrench;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{name}</h3>
        {description ? <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p> : null}
      </div>
    </motion.div>
  );
}
