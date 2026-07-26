import * as Icons from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function CategoryCard({ category, index = 0 }) {
  const Icon = Icons[category.icon] ?? Icons.Wrench;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.35, delay: (index % 5) * 0.05 }}
    >
      <Link
        to="/new-request"
        state={{ categoryId: category.id }}
        className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold">{category.name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{category.description}</p>
      </Link>
    </motion.div>
  );
}
