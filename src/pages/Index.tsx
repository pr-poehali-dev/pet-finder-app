import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type PostType = "lost" | "found" | "search";

interface Post {
  id: number;
  type: PostType;
  animal: string;
  breed: string;
  name: string;
  location: string;
  date: string;
  description: string;
  image: string;
  contact: string;
  lat: number;
  lng: number;
}

const DOG_BREEDS = ["Любая порода", "Двортерьер", "Лабрадор", "Немецкая овчарка", "Хаски", "Джек-рассел", "Чихуахуа", "Мопс", "Шпиц", "Такса", "Пудель", "Йоркширский терьер", "Золотистый ретривер", "Бульдог", "Корги"];
const CAT_BREEDS = ["Любая порода", "Беспородный", "Британская", "Персидская", "Сиамская", "Мейн-кун", "Бенгальская", "Шотландская вислоухая", "Сфинкс", "Русская голубая", "Абиссинская"];
const ALL_BREEDS = ["Любая порода", ...DOG_BREEDS.slice(1), ...CAT_BREEDS.slice(1)];

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    type: "lost",
    animal: "Собака",
    breed: "Хаски",
    name: "Байкал",
    location: "Москва, Сокольники",
    date: "27 марта 2026",
    description: "Пропал серо-белый хаски с голубыми глазами. Откликается на имя Байкал. На шее красный ошейник. Очень ласковый.",
    image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg",
    contact: "+7 (916) 234-56-78",
    lat: 55.794,
    lng: 37.675,
  },
  {
    id: 2,
    type: "found",
    animal: "Кошка",
    breed: "Британская",
    name: "Неизвестно",
    location: "Москва, Чистые пруды",
    date: "28 марта 2026",
    description: "Найдена серая короткошёрстная кошка, выглядит домашней. Сытая, ухоженная. Сейчас у нас дома, ищем хозяев.",
    image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/b6401465-6b3d-4bd2-8ab2-ce69a81ec389.jpg",
    contact: "+7 (965) 123-45-67",
    lat: 55.763,
    lng: 37.641,
  },
  {
    id: 3,
    type: "search",
    animal: "Собака",
    breed: "Золотистый ретривер",
    name: "Любой",
    location: "Москва, Митино",
    date: "25 марта 2026",
    description: "Ищу щенка золотистого ретривера в добрые руки. Есть все условия: большая квартира, опыт с собаками, двор с выгулом.",
    image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg",
    contact: "+7 (926) 987-65-43",
    lat: 55.832,
    lng: 37.354,
  },
  {
    id: 4,
    type: "lost",
    animal: "Кошка",
    breed: "Мейн-кун",
    name: "Тигр",
    location: "Санкт-Петербург, Невский",
    date: "26 марта 2026",
    description: "Пропал огромный рыжий мейн-кун. Очень пушистый хвост, янтарные глаза. Пугается громких звуков.",
    image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/b6401465-6b3d-4bd2-8ab2-ce69a81ec389.jpg",
    contact: "+7 (812) 345-67-89",
    lat: 59.934,
    lng: 30.335,
  },
  {
    id: 5,
    type: "found",
    animal: "Собака",
    breed: "Двортерьер",
    name: "Неизвестно",
    location: "Москва, Люблино",
    date: "29 марта 2026",
    description: "Нашли небольшую рыжую собачку около метро. Без ошейника, но в хорошем состоянии. Ждёт хозяев у нас.",
    image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg",
    contact: "+7 (999) 111-22-33",
    lat: 55.678,
    lng: 37.762,
  },
  {
    id: 6,
    type: "lost",
    animal: "Собака",
    breed: "Хаски",
    name: "Арктика",
    location: "Красноярский край, Красноярск, Советский район",
    date: "28 марта 2026",
    description: "Пропала сибирская хаски, чёрно-белая, глаза разного цвета (один голубой, один карий). Убежала во время прогулки в районе ул. Взлётная. Очень общительная, сама подойдёт к людям.",
    image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg",
    contact: "+7 (391) 234-56-78",
    lat: 56.054,
    lng: 92.891,
  },
  {
    id: 7,
    type: "found",
    animal: "Кошка",
    breed: "Шотландская вислоухая",
    name: "Неизвестно",
    location: "Красноярский край, Красноярск, Центральный район",
    date: "29 марта 2026",
    description: "Найдена вислоухая кошка серого окраса, очень ухоженная. Судя по виду — домашняя. Нашли у подъезда на ул. Мира. Временно держим у себя, ищем хозяев.",
    image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/b6401465-6b3d-4bd2-8ab2-ce69a81ec389.jpg",
    contact: "+7 (391) 987-65-43",
    lat: 56.010,
    lng: 92.852,
  },
  {
    id: 8,
    type: "search",
    animal: "Собака",
    breed: "Лабрадор",
    name: "Любой",
    location: "Красноярский край, Норильск",
    date: "26 марта 2026",
    description: "Ищу лабрадора или золотистого ретривера в добрые руки. Живём в частном доме, есть большой двор. Семья с детьми, есть опыт содержания собак. Можно щенка.",
    image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg",
    contact: "+7 (391) 111-22-33",
    lat: 69.334,
    lng: 88.189,
  },
];

const TYPE_CONFIG = {
  lost: { label: "Пропал", icon: "AlertTriangle", className: "tag-lost", bg: "bg-red-50 border-red-100" },
  found: { label: "Найден", icon: "Heart", className: "tag-found", bg: "bg-emerald-50 border-emerald-100" },
  search: { label: "Ищу", icon: "Search", className: "tag-search", bg: "bg-blue-50 border-blue-100" },
};

const NAV_ITEMS = [
  { id: "feed", label: "Лента", icon: "LayoutList" },
  { id: "search", label: "Поиск", icon: "MapPin" },
  { id: "lost", label: "Пропажи", icon: "AlertTriangle" },
  { id: "profile", label: "Профиль", icon: "User" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [filterType, setFilterType] = useState<PostType | "all">("all");
  const [filterAnimal, setFilterAnimal] = useState("all");
  const [filterBreed, setFilterBreed] = useState("Любая порода");
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState([10]);
  const [selectedCity, setSelectedCity] = useState("Москва");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [newPost, setNewPost] = useState({
    type: "lost" as PostType,
    animal: "Собака",
    breed: "",
    name: "",
    location: "",
    description: "",
    contact: "",
  });

  const breedOptions = newPost.animal === "Собака" ? DOG_BREEDS : newPost.animal === "Кошка" ? CAT_BREEDS : ALL_BREEDS;

  const filteredPosts = posts.filter((p) => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (activeTab === "lost" && p.type !== "lost") return false;
    if (filterAnimal !== "all" && p.animal !== filterAnimal) return false;
    if (filterBreed !== "Любая порода" && p.breed !== filterBreed) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.location.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.breed.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  function handleAddPost() {
    const post: Post = {
      id: Date.now(),
      ...newPost,
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }),
      image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg",
      lat: 55.75,
      lng: 37.61,
    };
    setPosts([post, ...posts]);
    setDialogOpen(false);
    setNewPost({ type: "lost", animal: "Собака", breed: "", name: "", location: "", description: "", contact: "" });
  }

  const animalBreeds = filterAnimal === "Собака" ? DOG_BREEDS : filterAnimal === "Кошка" ? CAT_BREEDS : ALL_BREEDS;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="font-bold text-lg text-foreground">НайдиПитомца</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white rounded-full px-4 h-9 shadow-md font-semibold text-sm">
                <Icon name="Plus" size={16} />
                <span className="ml-1">Добавить</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-4 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-bold text-xl">Новое объявление</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Тип объявления</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["lost", "found", "search"] as PostType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewPost({ ...newPost, type: t })}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all ${newPost.type === t ? "border-primary gradient-primary text-white" : "border-border bg-muted text-muted-foreground"}`}
                      >
                        {TYPE_CONFIG[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Животное</Label>
                    <Select value={newPost.animal} onValueChange={(v) => setNewPost({ ...newPost, animal: v, breed: "" })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Собака">🐕 Собака</SelectItem>
                        <SelectItem value="Кошка">🐈 Кошка</SelectItem>
                        <SelectItem value="Другое">🐾 Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Порода</Label>
                    <Select value={newPost.breed} onValueChange={(v) => setNewPost({ ...newPost, breed: v })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Выбери" />
                      </SelectTrigger>
                      <SelectContent>
                        {breedOptions.slice(1).map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Кличка</Label>
                  <Input placeholder="Имя животного" value={newPost.name} onChange={(e) => setNewPost({ ...newPost, name: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Локация</Label>
                  <Input placeholder="Город, район" value={newPost.location} onChange={(e) => setNewPost({ ...newPost, location: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Описание</Label>
                  <Textarea placeholder="Внешность, особые приметы..." value={newPost.description} onChange={(e) => setNewPost({ ...newPost, description: e.target.value })} className="rounded-xl resize-none" rows={3} />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Контакт</Label>
                  <Input placeholder="+7 (___) ___-__-__" value={newPost.contact} onChange={(e) => setNewPost({ ...newPost, contact: e.target.value })} className="rounded-xl" />
                </div>
                <Button onClick={handleAddPost} className="w-full gradient-primary text-white rounded-xl font-semibold py-5">
                  Опубликовать объявление
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5">
        {/* Search tab */}
        {activeTab === "search" && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Icon name="MapPin" size={20} className="text-primary" />
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
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 30px, hsl(160 40% 70%) 30px, hsl(160 40% 70%) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, hsl(160 40% 70%) 30px, hsl(160 40% 70%) 31px)" }} />
              <div className="text-center z-10">
                <div className="text-5xl mb-3 animate-float">📍</div>
                <p className="font-semibold text-emerald-800 text-sm">{selectedCity}</p>
                <p className="text-emerald-600 text-xs mt-1">Радиус {radius[0]} км</p>
              </div>
              {[{ x: "20%", y: "25%", type: "lost" }, { x: "65%", y: "55%", type: "found" }, { x: "45%", y: "35%", type: "search" }, { x: "75%", y: "25%", type: "lost" }].map((dot, i) => (
                <div key={i} className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-md ${dot.type === "lost" ? "bg-red-500" : dot.type === "found" ? "bg-emerald-500" : "bg-blue-500"}`} style={{ left: dot.x, top: dot.y }} />
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
        )}

        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 text-center">
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">👤</div>
              <h2 className="font-bold text-xl">Мой профиль</h2>
              <p className="text-muted-foreground text-sm mt-1">Здесь будут ваши объявления</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
                <Icon name="FileText" size={16} />
                Мои объявления
              </h3>
              <p className="text-sm text-muted-foreground text-center py-6">Войдите, чтобы видеть свои объявления</p>
              <Button className="w-full gradient-primary text-white rounded-xl font-semibold">Войти / Зарегистрироваться</Button>
            </div>
          </div>
        )}

        {/* Feed & Lost tabs */}
        {(activeTab === "feed" || activeTab === "lost") && (
          <div className="space-y-4 animate-fade-in">
            {/* Search bar */}
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по кличке, породе, месту..."
                className="pl-10 rounded-2xl border-border/60 bg-white shadow-sm h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Icon name="Filter" size={13} />
                Фильтры
              </p>

              {/* Type filter (only on feed) */}
              {activeTab === "feed" && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {([["all", "Все", "Layers"], ["lost", "Пропал", "AlertTriangle"], ["found", "Найден", "Heart"], ["search", "Ищу", "Search"]] as const).map(([val, label, icon]) => (
                    <button
                      key={val}
                      onClick={() => setFilterType(val as PostType | "all")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${filterType === val ? "gradient-primary text-white border-transparent shadow-sm" : "bg-muted text-muted-foreground border-border"}`}
                    >
                      <Icon name={icon} size={12} />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Animal filter */}
              <div className="flex gap-2">
                {[["all", "Все 🐾"], ["Собака", "Собаки 🐕"], ["Кошка", "Кошки 🐈"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setFilterAnimal(val); setFilterBreed("Любая порода"); }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterAnimal === val ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Breed filter */}
              <div>
                <Select value={filterBreed} onValueChange={setFilterBreed}>
                  <SelectTrigger className="rounded-xl h-9 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="PawPrint" size={14} className="text-muted-foreground" />
                      <SelectValue placeholder="Любая порода" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {animalBreeds.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground px-1">
              Найдено: <span className="font-semibold text-foreground">{filteredPosts.length}</span> объявлений
              {filterBreed !== "Любая порода" && (
                <span className="ml-2 inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
                  {filterBreed}
                  <button onClick={() => setFilterBreed("Любая порода")} className="ml-0.5 hover:text-red-500">×</button>
                </span>
              )}
            </p>

            {/* Posts */}
            <div className="space-y-4">
              {filteredPosts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="font-semibold">Ничего не найдено</p>
                  <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
                </div>
              )}
              {filteredPosts.map((post, i) => {
                const cfg = TYPE_CONFIG[post.type];
                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 card-hover cursor-pointer"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => setSelectedPost(post)}
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
                          <h3 className="font-bold text-base">{post.name !== "Неизвестно" && post.name !== "Любой" ? post.name : post.breed}</h3>
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
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Post detail dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(o) => !o && setSelectedPost(null)}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl max-h-[85vh] overflow-y-auto">
          {selectedPost && (
            <>
              <img src={selectedPost.image} alt={selectedPost.name} className="w-full h-52 object-cover rounded-xl -mt-1 mb-1" />
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xl">{selectedPost.name}</h3>
                    <p className="text-muted-foreground text-sm">{selectedPost.breed} · {selectedPost.animal}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${TYPE_CONFIG[selectedPost.type].className} bg-white border`}>
                    {TYPE_CONFIG[selectedPost.type].label}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{selectedPost.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="MapPin" size={14} />
                  <span>{selectedPost.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Calendar" size={14} />
                  <span>{selectedPost.date}</span>
                </div>
                <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
                  <Icon name="Phone" size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Связаться</p>
                    <p className="font-semibold text-sm">{selectedPost.contact}</p>
                  </div>
                </div>
                <Button className="w-full gradient-primary text-white rounded-xl font-semibold">
                  <Icon name="Phone" size={16} />
                  <span className="ml-2">Позвонить</span>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
        <div className="max-w-lg mx-auto flex items-center">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${activeTab === id ? "text-primary" : "text-muted-foreground"}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${activeTab === id ? "bg-primary/10" : ""}`}>
                <Icon name={icon as "LayoutList" | "MapPin" | "AlertTriangle" | "User"} size={20} />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}