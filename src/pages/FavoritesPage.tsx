import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { t } from "@/lib/i18n";

interface Animal {
  id: number;
  name?: string;
  animal_type: string;
  breed?: string;
  city?: string;
  photos: string[];
  post_type: string;
  status: string;
}

const TYPE_COLORS: Record<string, string> = {
  lost: "bg-red-100 text-red-700",
  found: "bg-green-100 text-green-700",
  adopt: "bg-blue-100 text-blue-700",
};

interface Props {
  onSelect: (id: number) => void;
}

export default function FavoritesPage({ onSelect }: Props) {
  const [items, setItems] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFavorites()
      .then((data: unknown) => {
        const d = data as { items: Animal[] };
        setItems(d.items);
      })
      .catch(() => toast.error(t("misc.error")))
      .finally(() => setLoading(false));
  }, []);

  async function removeFav(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    await api.removeFavorite(id);
    setItems((prev) => prev.filter((a) => a.id !== id));
    toast.success("Убрано из избранного");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <Icon name="Heart" size={40} className="opacity-30" />
        <p className="text-sm">Нет сохранённых объявлений</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h2 className="font-semibold text-lg">{t("nav.favorites")}</h2>
      {items.map((a) => (
        <button
          key={a.id}
          className="w-full text-left flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted transition-colors"
          onClick={() => onSelect(a.id)}
        >
          <img
            src={a.photos?.[0] || "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg"}
            className="w-14 h-14 rounded-lg object-cover shrink-0"
            alt=""
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[a.post_type] || "bg-muted"}`}>
                {t(`animal.${a.post_type}`)}
              </span>
            </div>
            <p className="font-medium text-sm truncate">{a.name || t(`animal.${a.animal_type}`)}</p>
            {a.breed && <p className="text-xs text-muted-foreground truncate">{a.breed}</p>}
            {a.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Icon name="MapPin" size={10} />{a.city}
              </p>
            )}
          </div>
          <button
            className="p-1.5 text-muted-foreground hover:text-red-500 shrink-0"
            onClick={(e) => removeFav(e, a.id)}
          >
            <Icon name="X" size={16} />
          </button>
        </button>
      ))}
    </div>
  );
}
