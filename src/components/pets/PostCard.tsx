import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { Post, TYPE_CONFIG } from "@/types/pets";

interface PostCardProps {
  post: Post;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  const [open, setOpen] = useState(false);
  const cfg = TYPE_CONFIG[post.type];

  return (
    <>
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 card-hover cursor-pointer"
        style={{ animationDelay: `${index * 60}ms` }}
        onClick={() => setOpen(true)}
      >
        <div className="relative">
          <img src={post.image} alt={post.name} className="w-full h-44 object-cover" />
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${cfg.className} bg-white/90 backdrop-blur-sm shadow-sm`}>
              <Icon name={cfg.icon as "AlertTriangle" | "Heart" | "Search"} size={12} />
              {cfg.label}
            </span>
          </div>
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-muted-foreground">
            {post.animal}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-base">
                {post.name !== "Неизвестно" && post.name !== "Любой" && post.name !== "Любая" ? post.name : post.breed}
              </h3>
              <p className="text-sm text-muted-foreground">{post.breed}</p>
            </div>
            <Badge variant="outline" className="text-xs rounded-full shrink-0 ml-2">{post.date}</Badge>
          </div>
          <p className="text-sm text-foreground/80 line-clamp-2 mb-3">{post.description}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="MapPin" size={12} />
            <span>{post.location}</span>
          </div>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[85vh] overflow-y-auto">
          <img src={post.image} alt={post.name} className="w-full h-52 object-cover rounded-xl -mt-1 mb-1" />
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-xl">{post.name}</h3>
                <p className="text-muted-foreground text-sm">{post.breed} · {post.animal}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${cfg.className} bg-white border`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{post.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="MapPin" size={14} />
              <span>{post.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="Calendar" size={14} />
              <span>{post.date}</span>
            </div>
            <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
              <Icon name="Phone" size={18} className="text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Связаться</p>
                <p className="font-semibold text-sm">{post.contact}</p>
              </div>
            </div>
            <Button className="w-full gradient-primary text-white rounded-xl font-semibold">
              <Icon name="Phone" size={16} />
              <span className="ml-2">Позвонить</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
