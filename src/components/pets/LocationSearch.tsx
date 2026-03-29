import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Post, PostType, TYPE_CONFIG } from "@/types/pets";

interface LocationSearchProps {
  posts: Post[];
}

export default function LocationSearch({ posts }: LocationSearchProps) {
  const [selectedCity, setSelectedCity] = useState("Москва");
  const [radius, setRadius] = useState([10]);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-primary">📍</span>
          Поиск по местоположению
        </h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Город</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Москва", "Санкт-Петербург", "Новосибирск", "Красноярск", "Красноярский край", "Норильск", "Екатеринбург", "Казань", "Нижний Новгород", "Краснодар"].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Радиус поиска: <span className="text-primary">{radius[0]} км</span>
            </Label>
            <Slider value={radius} onValueChange={setRadius} min={1} max={50} step={1} className="mt-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
              <span>1 км</span><span>25 км</span><span>50 км</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="relative bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl h-52 overflow-hidden border border-border/50 shadow-sm flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 30px, hsl(160 40% 70%) 30px, hsl(160 40% 70%) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, hsl(160 40% 70%) 30px, hsl(160 40% 70%) 31px)",
          }}
        />
        <div className="text-center z-10">
          <div className="text-5xl mb-3 animate-float">📍</div>
          <p className="font-semibold text-emerald-800 text-sm">{selectedCity}</p>
          <p className="text-emerald-600 text-xs mt-1">Радиус {radius[0]} км</p>
        </div>
        {[{ x: "20%", y: "25%", type: "lost" }, { x: "65%", y: "55%", type: "found" }, { x: "45%", y: "35%", type: "search" }, { x: "75%", y: "25%", type: "lost" }].map((dot, i) => (
          <div
            key={i}
            className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-md ${dot.type === "lost" ? "bg-red-500" : dot.type === "found" ? "bg-emerald-500" : "bg-blue-500"}`}
            style={{ left: dot.x, top: dot.y }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["lost", "found", "search"] as PostType[]).map(t => (
          <div key={t} className={`rounded-xl p-3 text-center border ${TYPE_CONFIG[t].bg}`}>
            <div className="text-xl mb-1">{t === "lost" ? "🔴" : t === "found" ? "🟢" : "🔵"}</div>
            <div className="text-xs font-semibold">{TYPE_CONFIG[t].label}</div>
            <div className="text-lg font-bold">{posts.filter(p => p.type === t).length}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
