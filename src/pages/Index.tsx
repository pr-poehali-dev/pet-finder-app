import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ALL_POSTS } from "@/types/pets";
import AddPostDialog from "@/components/pets/AddPostDialog";
import FeedFilters from "@/components/pets/FeedFilters";
import PostCard from "@/components/pets/PostCard";
import LocationSearch from "@/components/pets/LocationSearch";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { t } from "@/lib/i18n";
import AnimalDetailPage from "./AnimalDetailPage";
import FavoritesPage from "./FavoritesPage";
import MessagesPage from "./MessagesPage";
import ProfilePage from "./ProfilePage";
import AdminPage from "./AdminPage";
import ShelterPage from "./ShelterPage";

type NavTab = "feed" | "search" | "lost" | "profile";
type SubPage = "animal_detail" | "favorites" | "messages" | "my_posts" | "admin" | "shelter" | null;

const NAV_ITEMS = [
  { id: "feed" as NavTab, label: "Лента", icon: "LayoutList" },
  { id: "search" as NavTab, label: "Поиск", icon: "MapPin" },
  { id: "lost" as NavTab, label: "Пропажи", icon: "AlertTriangle" },
  { id: "profile" as NavTab, label: "Профиль", icon: "User" },
];

export default function Index() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("feed");
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Feed state
  const [posts, setPosts] = useState(ALL_POSTS);
  const [filterType, setFilterType] = useState<"all" | "lost" | "found" | "search">("all");
  const [filterAnimal, setFilterAnimal] = useState("all");
  const [filterBreed, setFilterBreed] = useState("Любая порода");
  const [filterCity, setFilterCity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    if (user) {
      api.getUnreadCount().then((d: unknown) => {
        setUnreadCount((d as { count: number }).count);
      }).catch(() => {});
    }
  }, [user]);

  const filteredPosts = posts.filter((p) => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (activeTab === "lost" && p.type !== "lost") return false;
    if (filterAnimal !== "all" && p.animal !== filterAnimal) return false;
    if (filterBreed !== "Любая порода" && p.breed !== filterBreed) return false;
    if (filterCity !== "all" && !p.location.toLowerCase().includes(filterCity.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) &&
          !p.location.toLowerCase().includes(q) &&
          !p.breed.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function handleAddPost(post: typeof ALL_POSTS[0]) {
    setPosts([post, ...posts]);
  }

  function handleRefresh() {
    setIsRefreshing(true);
    setTimeout(() => {
      setPosts([...ALL_POSTS].sort(() => Math.random() - 0.5));
      setFeedKey((k) => k + 1);
      setIsRefreshing(false);
    }, 900);
  }

  function openDetail(id: number) {
    setDetailId(id);
    setSubPage("animal_detail");
  }

  function goBack() {
    setSubPage(null);
    setDetailId(null);
  }

  function navigate(tab: string) {
    if (tab === "favorites") setSubPage("favorites");
    else if (tab === "messages") setSubPage("messages");
    else if (tab === "admin") setSubPage("admin");
    else if (tab === "shelter") setSubPage("shelter");
    else if (tab === "my_posts") setSubPage("my_posts");
  }

  // Sub-pages
  if (subPage === "animal_detail" && detailId != null) {
    return (
      <div className="min-h-screen bg-background">
        <AnimalDetailPage
          id={detailId}
          onBack={goBack}
          onMessage={(recipientId, animalId) => {
            setSubPage("messages");
          }}
        />
      </div>
    );
  }

  if (subPage === "favorites") {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
          <button onClick={goBack}><Icon name="ArrowLeft" size={20} /></button>
          <h2 className="font-semibold">{t("nav.favorites")}</h2>
        </div>
        <FavoritesPage onSelect={openDetail} />
      </div>
    );
  }

  if (subPage === "messages") {
    return (
      <div className="min-h-screen bg-background">
        <MessagesPage onBack={goBack} />
      </div>
    );
  }

  if (subPage === "admin") {
    return (
      <div className="min-h-screen bg-background">
        <AdminPage onBack={goBack} />
      </div>
    );
  }

  if (subPage === "shelter") {
    return (
      <div className="min-h-screen bg-background">
        <ShelterPage onBack={goBack} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="font-bold text-lg text-foreground">НайдиПитомца</span>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button
                className="relative p-2 rounded-xl hover:bg-muted transition-colors"
                onClick={() => setSubPage("messages")}
              >
                <Icon name="MessageCircle" size={20} className="text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            <AddPostDialog onAdd={handleAddPost} />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5">
        {/* Search tab */}
        {activeTab === "search" && <LocationSearch posts={posts} />}

        {/* Profile tab */}
        {activeTab === "profile" && <ProfilePage onNavigate={navigate} />}

        {/* Feed & Lost tabs */}
        {(activeTab === "feed" || activeTab === "lost") && (
          <div className="space-y-4 animate-fade-in">
            <FeedFilters
              activeTab={activeTab}
              searchQuery={searchQuery}
              filterType={filterType}
              filterAnimal={filterAnimal}
              filterBreed={filterBreed}
              filterCity={filterCity}
              filteredCount={filteredPosts.length}
              isRefreshing={isRefreshing}
              onSearchChange={setSearchQuery}
              onFilterTypeChange={setFilterType}
              onFilterAnimalChange={setFilterAnimal}
              onFilterBreedChange={setFilterBreed}
              onFilterCityChange={setFilterCity}
              onRefresh={handleRefresh}
            />

            <div key={feedKey} className="space-y-4">
              {filteredPosts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="font-semibold">{t("misc.no_results")}</p>
                  <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
                </div>
              )}
              {filteredPosts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={i}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
        <div className="max-w-lg mx-auto flex items-center">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSubPage(null); }}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${activeTab === id && !subPage ? "text-primary" : "text-muted-foreground"}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${activeTab === id && !subPage ? "bg-primary/10" : ""}`}>
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