import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Image as ImageIcon, Globe, Coins } from "lucide-react";

export interface TaskCardData {
  id: string;
  title: string;
  description: string;
  type: "video" | "article" | "image" | "website";
  category: string;
  thumbnail_url: string | null;
  reward: number;
}

const typeMeta = {
  video: { label: "Watch Video", Icon: Play, tint: "from-rose-500/30 to-orange-500/20" },
  article: { label: "Read Article", Icon: FileText, tint: "from-blue-500/30 to-cyan-500/20" },
  image: { label: "View Image", Icon: ImageIcon, tint: "from-emerald-500/30 to-teal-500/20" },
  website: { label: "Visit Website", Icon: Globe, tint: "from-violet-500/30 to-fuchsia-500/20" },
};

export function TaskCard({ task, requireAuth = false }: { task: TaskCardData; requireAuth?: boolean }) {
  const meta = typeMeta[task.type];
  const Icon = meta.Icon;
  const href = requireAuth ? "/login" : `/tasks/${task.id}`;

  return (
    <Link to={href as any} className="group block">
      <Card className="overflow-hidden border-border/60 bg-gradient-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
        <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${meta.tint}`}>
          {task.thumbnail_url ? (
            <img src={task.thumbnail_url} alt={task.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Icon className="h-12 w-12 text-foreground/40" /></div>
          )}
          <Badge className="absolute left-3 top-3 gap-1 bg-background/80 text-foreground backdrop-blur">
            <Icon className="h-3 w-3" />{meta.label}
          </Badge>
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gradient-orbit px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
            <Coins className="h-3 w-3" />KES {Number(task.reward).toFixed(0)}
          </div>
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{task.category}</span>
          </div>
          <h3 className="line-clamp-2 font-semibold leading-tight">{task.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
