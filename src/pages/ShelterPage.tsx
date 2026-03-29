import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { t } from "@/lib/i18n";

interface Shelter {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  is_verified: boolean;
  active_count?: number;
}

interface Props {
  onBack?: () => void;
}

export default function ShelterPage({ onBack }: Props) {
  const { user } = useAuth();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", address: "", city: "", phone: "", email: "", website: ""
  });

  useEffect(() => {
    api
      .getShelters()
      .then((d: unknown) => {
        const data = d as { items: Shelter[] };
        const mine = data.items.find(() => true);
        if (mine) {
          setShelter(mine);
          setForm({
            name: mine.name || "",
            description: mine.description || "",
            address: mine.address || "",
            city: mine.city || "",
            phone: mine.phone || "",
            email: mine.email || "",
            website: mine.website || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const d = (await api.createShelter(form)) as Shelter;
      setShelter(d);
      setEditing(false);
      toast.success("Профиль приюта создан!");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!shelter) return;
    setSaving(true);
    try {
      const d = (await api.updateShelter(shelter.id, form)) as Shelter;
      setShelter(d);
      setEditing(false);
      toast.success("Профиль обновлён");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== "shelter") {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Этот раздел доступен только для приютов.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const ShelterForm = (
    <form onSubmit={shelter ? handleUpdate : handleCreate} className="space-y-3">
      {[
        { key: "name", label: "Название приюта", required: true },
        { key: "city", label: "Город" },
        { key: "address", label: "Адрес" },
        { key: "phone", label: "Телефон" },
        { key: "email", label: "Email" },
        { key: "website", label: "Сайт" },
      ].map(({ key, label, required }) => (
        <div key={key} className="space-y-1">
          <Label>{label}{required && " *"}</Label>
          <Input
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            required={required}
          />
        </div>
      ))}
      <div className="space-y-1">
        <Label>Описание</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? t("misc.loading") : shelter ? t("action.save") : "Создать профиль"}
        </Button>
        {shelter && (
          <Button type="button" variant="outline" onClick={() => setEditing(false)}>
            {t("action.cancel")}
          </Button>
        )}
      </div>
    </form>
  );

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        {onBack && <button onClick={onBack}><Icon name="ArrowLeft" size={20} /></button>}
        <h2 className="font-semibold">{t("profile.shelter_profile")}</h2>
      </div>

      <div className="p-4">
        {!shelter || editing ? (
          ShelterForm
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="Home" size={24} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{shelter.name}</h3>
                  {shelter.is_verified && <Icon name="BadgeCheck" size={18} className="text-primary" />}
                </div>
                {shelter.city && <p className="text-sm text-muted-foreground">{shelter.city}</p>}
              </div>
            </div>

            {shelter.active_count !== undefined && (
              <div className="border rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-primary">{shelter.active_count}</p>
                <p className="text-xs text-muted-foreground">активных объявлений</p>
              </div>
            )}

            <div className="space-y-2 text-sm">
              {shelter.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="MapPin" size={15} />{shelter.address}
                </div>
              )}
              {shelter.phone && (
                <a href={`tel:${shelter.phone}`} className="flex items-center gap-2 text-primary">
                  <Icon name="Phone" size={15} />{shelter.phone}
                </a>
              )}
              {shelter.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="Mail" size={15} />{shelter.email}
                </div>
              )}
              {shelter.website && (
                <a href={shelter.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary">
                  <Icon name="Globe" size={15} />{shelter.website}
                </a>
              )}
            </div>

            {shelter.description && (
              <p className="text-sm text-muted-foreground">{shelter.description}</p>
            )}

            {!shelter.is_verified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                <Icon name="AlertCircle" size={15} className="inline mr-1" />
                Профиль ожидает верификации администратором
              </div>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={() => setEditing(true)}>
              <Icon name="Pencil" size={15} />
              {t("action.edit")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
