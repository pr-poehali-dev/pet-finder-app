import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { t, setLang, getLang, type Lang } from "@/lib/i18n";
import AuthPage from "./AuthPage";
import PhotoUploader from "@/components/pets/PhotoUploader";

interface Props {
  onNavigate?: (tab: string) => void;
}

export default function ProfilePage({ onNavigate }: Props) {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarPhotos, setAvatarPhotos] = useState<string[]>(user?.avatar_url ? [user.avatar_url] : []);
  const [saving, setSaving] = useState(false);
  const [lang, setCurrentLang] = useState<Lang>(getLang());

  if (!user) {
    return (
      <div className="p-4">
        <AuthPage />
      </div>
    );
  }

  function handleLangChange(val: Lang) {
    setCurrentLang(val);
    setLang(val);
    toast.success(val === "ru" ? "Язык: Русский" : "Language: English");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateUser({ name, phone, avatar_url: avatarPhotos[0] || user?.avatar_url || "" });
      setEditing(false);
      toast.success("Профиль обновлён");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    toast.success("Вы вышли из аккаунта");
  }

  const roleLabel: Record<string, string> = {
    user: "Частное лицо",
    shelter: "Приют / организация",
    admin: "Администратор",
  };

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        {user.avatar_url ? (
          <img src={user.avatar_url} className="w-16 h-16 rounded-full object-cover shrink-0 border" alt="" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <p className="font-bold text-lg">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full mt-1 inline-block">{roleLabel[user.role]}</span>
        </div>
      </div>

      {/* Edit form */}
      {editing ? (
        <div className="space-y-3 border rounded-xl p-4">
          <div className="space-y-1">
            <Label>{t("auth.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("auth.phone")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7..." />
          </div>
          <div className="space-y-1">
            <Label>Фото профиля</Label>
            <PhotoUploader photos={avatarPhotos} onChange={setAvatarPhotos} maxPhotos={1} />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? t("misc.loading") : t("action.save")}
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>{t("action.cancel")}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full gap-2" onClick={() => setEditing(true)}>
          <Icon name="Pencil" size={15} />
          {t("action.edit")} профиль
        </Button>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted transition-colors text-left"
          onClick={() => onNavigate?.("my_posts")}
        >
          <Icon name="ClipboardList" size={18} className="text-primary" />
          <span className="text-sm font-medium">{t("profile.my_posts")}</span>
          <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
        </button>

        <button
          className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted transition-colors text-left"
          onClick={() => onNavigate?.("favorites")}
        >
          <Icon name="Heart" size={18} className="text-primary" />
          <span className="text-sm font-medium">{t("nav.favorites")}</span>
          <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
        </button>

        <button
          className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted transition-colors text-left"
          onClick={() => onNavigate?.("messages")}
        >
          <Icon name="MessageCircle" size={18} className="text-primary" />
          <span className="text-sm font-medium">{t("nav.messages")}</span>
          <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
        </button>

        {user.role === "shelter" && (
          <button
            className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted transition-colors text-left"
            onClick={() => onNavigate?.("shelter")}
          >
            <Icon name="Home" size={18} className="text-primary" />
            <span className="text-sm font-medium">{t("profile.shelter_profile")}</span>
            <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
          </button>
        )}

        {user.role === "admin" && (
          <button
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-orange-200 hover:bg-orange-50 transition-colors text-left"
            onClick={() => onNavigate?.("admin")}
          >
            <Icon name="ShieldCheck" size={18} className="text-orange-500" />
            <span className="text-sm font-medium text-orange-700">{t("profile.admin_panel")}</span>
            <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Language */}
      <div className="border rounded-xl p-4 space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Icon name="Globe" size={15} /> Язык / Language
        </Label>
        <Select value={lang} onValueChange={(v) => handleLangChange(v as Lang)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logout */}
      <Button variant="ghost" className="w-full gap-2 text-destructive" onClick={handleLogout}>
        <Icon name="LogOut" size={16} />
        {t("auth.logout")}
      </Button>
    </div>
  );
}