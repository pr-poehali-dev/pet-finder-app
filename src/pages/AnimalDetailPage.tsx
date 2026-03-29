import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { t, formatAge } from "@/lib/i18n";

interface Animal {
  id: number;
  name?: string;
  animal_type: string;
  breed?: string;
  age_months?: number;
  sex: string;
  size?: string;
  color?: string;
  description?: string;
  city?: string;
  address?: string;
  post_type: string;
  status: string;
  photos: string[];
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  is_vaccinated?: boolean;
  is_sterilized?: boolean;
  is_chipped?: boolean;
  has_passport?: boolean;
  shelter_name?: string;
  shelter_logo?: string;
  shelter_verified?: boolean;
  owner_name?: string;
  view_count: number;
  is_favorite?: boolean;
  user_id: number;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  lost: "bg-red-100 text-red-700",
  found: "bg-green-100 text-green-700",
  adopt: "bg-blue-100 text-blue-700",
};

interface Props {
  id: number;
  onBack: () => void;
  onMessage?: (recipientId?: number, animalId?: number) => void;
}

export default function AnimalDetailPage({ id, onBack, onMessage }: Props) {
  const { user } = useAuth();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .getAnimal(id)
      .then((data: unknown) => {
        const a = data as Animal;
        setAnimal(a);
        setIsFav(a.is_favorite ?? false);
      })
      .catch(() => toast.error(t("misc.error")))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleFavorite() {
    if (!user) {
      toast.info("Войдите, чтобы сохранять в избранное");
      return;
    }
    setFavLoading(true);
    try {
      if (isFav) {
        await api.removeFavorite(id);
        setIsFav(false);
        toast.success("Убрано из избранного");
      } else {
        await api.addFavorite(id);
        setIsFav(true);
        toast.success("Добавлено в избранное");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setFavLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!animal) return null;

  const photos = animal.photos?.length ? animal.photos : [
    "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg",
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
        <button onClick={onBack} className="p-1">
          <Icon name="ArrowLeft" size={22} />
        </button>
        <h2 className="font-semibold flex-1 truncate">{animal.name || "Объявление"}</h2>
        <button onClick={toggleFavorite} disabled={favLoading} className="p-1">
          <Icon
            name={isFav ? "Heart" : "Heart"}
            size={22}
            className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}
          />
        </button>
      </div>

      {/* Photos */}
      <div className="relative bg-muted h-72 overflow-hidden">
        <img
          src={photos[photoIdx]}
          alt={animal.name || ""}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg";
          }}
        />
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === photoIdx ? "bg-white" : "bg-white/50"}`}
                onClick={() => setPhotoIdx(i)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[animal.post_type] || "bg-muted"}`}>
                {t(`animal.${animal.post_type}`)}
              </span>
              <Badge variant="outline" className="text-xs">{t(`animal.${animal.animal_type}`)}</Badge>
              {animal.status !== "active" && (
                <Badge variant="secondary" className="text-xs">{t(`animal.status.${animal.status}`)}</Badge>
              )}
            </div>
            <h1 className="text-xl font-bold mt-1">
              {animal.name || (animal.post_type === "found" ? "Без имени" : t(`animal.${animal.animal_type}`))}
            </h1>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{animal.view_count} {t("misc.views")}</span>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2">
          {animal.breed && (
            <span className="bg-muted text-xs px-2 py-1 rounded-full">{animal.breed}</span>
          )}
          {animal.age_months != null && (
            <span className="bg-muted text-xs px-2 py-1 rounded-full">{formatAge(animal.age_months)}</span>
          )}
          {animal.sex && animal.sex !== "unknown" && (
            <span className="bg-muted text-xs px-2 py-1 rounded-full">{t(`animal.${animal.sex}`)}</span>
          )}
          {animal.size && (
            <span className="bg-muted text-xs px-2 py-1 rounded-full">{t(`animal.${animal.size}`)}</span>
          )}
          {animal.color && (
            <span className="bg-muted text-xs px-2 py-1 rounded-full">{animal.color}</span>
          )}
        </div>

        {/* Health */}
        {(animal.is_vaccinated || animal.is_sterilized || animal.is_chipped || animal.has_passport) && (
          <div className="flex flex-wrap gap-2">
            {animal.is_vaccinated && (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                <Icon name="Check" size={12} />{t("animal.vaccinated")}
              </span>
            )}
            {animal.is_sterilized && (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                <Icon name="Check" size={12} />{t("animal.sterilized")}
              </span>
            )}
            {animal.is_chipped && (
              <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                <Icon name="Cpu" size={12} />{t("animal.chipped")}
              </span>
            )}
            {animal.has_passport && (
              <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                <Icon name="FileText" size={12} />{t("animal.passport")}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {(animal.city || animal.address) && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Icon name="MapPin" size={16} className="mt-0.5 shrink-0" />
            <span>{[animal.city, animal.address].filter(Boolean).join(", ")}</span>
          </div>
        )}

        {/* Description */}
        {animal.description && (
          <div>
            <h3 className="font-semibold text-sm mb-1">Описание</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{animal.description}</p>
          </div>
        )}

        {/* Shelter */}
        {animal.shelter_name && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
            {animal.shelter_logo ? (
              <img src={animal.shelter_logo} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="Home" size={18} className="text-primary" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm">{animal.shelter_name}</span>
                {animal.shelter_verified && (
                  <Icon name="BadgeCheck" size={15} className="text-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{t("misc.verified")}</span>
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="space-y-2 pt-2">
          {animal.contact_phone && (
            <a href={`tel:${animal.contact_phone}`}>
              <Button className="w-full gap-2">
                <Icon name="Phone" size={16} />
                {animal.contact_phone}
              </Button>
            </a>
          )}
          {user && onMessage && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => onMessage(animal.user_id, animal.id)}
            >
              <Icon name="MessageCircle" size={16} />
              {t("action.write")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
