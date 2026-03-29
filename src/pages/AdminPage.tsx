import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { t } from "@/lib/i18n";

interface Stats {
  users: { total: number; by_role: Record<string, number> };
  animals: { total: number; by_status: Record<string, number> };
  shelters: number;
  messages: number;
}

interface Animal {
  id: number;
  name?: string;
  animal_type: string;
  breed?: string;
  post_type: string;
  status: string;
  user_name: string;
  user_email: string;
  city?: string;
  created_at: string;
  photos: string[];
}

interface AUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

type AdminTab = "stats" | "moderation" | "users";

interface Props {
  onBack?: () => void;
}

export default function AdminPage({ onBack }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingAnimals, setPendingAnimals] = useState<Animal[]>([]);
  const [users, setUsers] = useState<AUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "stats") loadStats();
    else if (tab === "moderation") loadPending();
    else if (tab === "users") loadUsers();
  }, [tab]);

  async function loadStats() {
    setLoading(true);
    try {
      const d = await api.adminStats();
      setStats(d as Stats);
    } catch {
      toast.error(t("misc.error"));
    } finally {
      setLoading(false);
    }
  }

  async function loadPending() {
    setLoading(true);
    try {
      const d = (await api.adminGetAnimals({ status: "pending" })) as { items: Animal[] };
      setPendingAnimals(d.items);
    } catch {
      toast.error(t("misc.error"));
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const d = (await api.adminGetUsers()) as { items: AUser[] };
      setUsers(d.items);
    } catch {
      toast.error(t("misc.error"));
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: number) {
    await api.adminApprove(id);
    setPendingAnimals((prev) => prev.filter((a) => a.id !== id));
    toast.success("Объявление одобрено");
  }

  async function reject(id: number) {
    await api.adminReject(id, "Не соответствует правилам");
    setPendingAnimals((prev) => prev.filter((a) => a.id !== id));
    toast.success("Объявление отклонено");
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p>Доступ запрещён</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
        {onBack && (
          <button onClick={onBack}>
            <Icon name="ArrowLeft" size={20} />
          </button>
        )}
        <h2 className="font-semibold">{t("profile.admin_panel")}</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(["stats", "moderation", "users"] as AdminTab[]).map((t_) => (
          <button
            key={t_}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t_ ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            onClick={() => setTab(t_)}
          >
            {{ stats: "Статистика", moderation: "Модерация", users: "Пользователи" }[t_]}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Stats */}
        {tab === "stats" && !loading && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.users.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Пользователей</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.animals.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Объявлений</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.shelters}</p>
                <p className="text-xs text-muted-foreground mt-1">Приютов</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.messages}</p>
                <p className="text-xs text-muted-foreground mt-1">Сообщений</p>
              </div>
            </div>
            <div className="border rounded-xl p-4">
              <p className="font-medium text-sm mb-2">Объявления по статусам</p>
              <div className="space-y-1.5">
                {Object.entries(stats.animals.by_status).map(([s, c]) => (
                  <div key={s} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t(`animal.status.${s}`)}</span>
                    <span className="font-medium">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Moderation */}
        {tab === "moderation" && !loading && (
          <div className="space-y-3">
            {!pendingAnimals.length && (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="CheckCircle" size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Нет объявлений на проверке</p>
              </div>
            )}
            {pendingAnimals.map((a) => (
              <div key={a.id} className="border rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {a.photos?.[0] && (
                    <img src={a.photos[0]} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{a.name || t(`animal.${a.animal_type}`)}</p>
                    <p className="text-xs text-muted-foreground">{a.user_name} · {a.user_email}</p>
                    {a.city && <p className="text-xs text-muted-foreground">{a.city}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{t(`animal.${a.post_type}`)}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1" onClick={() => approve(a.id)}>
                    <Icon name="Check" size={14} />{t("action.approve")}
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => reject(a.id)}>
                    <Icon name="X" size={14} />{t("action.reject")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === "users" && !loading && (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl border ${!u.is_active ? "opacity-50" : ""}`}>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs shrink-0">
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
