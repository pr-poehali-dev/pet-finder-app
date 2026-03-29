import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";
import { t } from "@/lib/i18n";

type Mode = "login" | "register" | "forgot" | "forgot_sent";

interface Props {
  onClose?: () => void;
}

export default function AuthPage({ onClose }: Props) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Добро пожаловать!");
      onClose?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, password, name, role });
      toast.success("Аккаунт создан!");
      onClose?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setMode("forgot_sent");
    } catch {
      toast.error("Ошибка. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot_sent") {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Mail" size={20} />
            Письмо отправлено
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Если аккаунт с таким email существует, мы отправим ссылку для восстановления пароля.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setMode("login")}>
            Вернуться ко входу
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === "forgot") {
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>{t("auth.reset")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1">
              <Label>{t("auth.email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("misc.loading") : t("auth.send_link")}
            </Button>
            <button
              type="button"
              className="text-sm text-primary underline w-full text-center"
              onClick={() => setMode("login")}
            >
              Вернуться ко входу
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>{mode === "login" ? t("auth.login") : t("auth.register")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1">
              <Label>{t("auth.name")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Иванов"
                required
              />
            </div>
          )}
          <div className="space-y-1">
            <Label>{t("auth.email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>{t("auth.password")}</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPass(!showPass)}
              >
                <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </div>
          {mode === "register" && (
            <div className="space-y-1">
              <Label>{t("auth.role")}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("auth.role.user")}</SelectItem>
                  <SelectItem value="shelter">{t("auth.role.shelter")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("misc.loading") : mode === "login" ? t("auth.login") : t("auth.register")}
          </Button>

          {mode === "login" && (
            <button
              type="button"
              className="text-sm text-primary underline w-full text-center"
              onClick={() => setMode("forgot")}
            >
              {t("auth.forgot")}
            </button>
          )}

          <div className="text-sm text-center text-muted-foreground">
            {mode === "login" ? t("auth.no_account") : t("auth.has_account")}{" "}
            <button
              type="button"
              className="text-primary underline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? t("auth.register") : t("auth.login")}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
