import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Post, PostType, ALL_POSTS } from "@/types/pets";
import AddPostDialog from "@/components/pets/AddPostDialog";
import FeedFilters from "@/components/pets/FeedFilters";
import PostCard from "@/components/pets/PostCard";
import LocationSearch from "@/components/pets/LocationSearch";

const NAV_ITEMS = [
  { id: "feed", label: "Лента", icon: "LayoutList" },
  { id: "search", label: "Поиск", icon: "MapPin" },
  { id: "lost", label: "Пропажи", icon: "AlertTriangle" },
  { id: "profile", label: "Профиль", icon: "User" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState<Post[]>(ALL_POSTS);
  const [filterType, setFilterType] = useState<PostType | "all">("all");
  const [filterAnimal, setFilterAnimal] = useState("all");
  const [filterBreed, setFilterBreed] = useState("Любая порода");
  const [filterCity, setFilterCity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedKey, setFeedKey] = useState(0);

  const filteredPosts = posts.filter((p) => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (activeTab === "lost" && p.type !== "lost") return false;
    if (filterAnimal !== "all" && p.animal !== filterAnimal) return false;
    if (filterBreed !== "Любая порода" && p.breed !== filterBreed) return false;
    if (filterCity !== "all" && !p.location.toLowerCase().includes(filterCity.toLowerCase())) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.location.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.breed.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  function handleAddPost(post: Post) {
    setPosts([post, ...posts]);
  }

  function handleRefresh() {
    setIsRefreshing(true);
    setTimeout(() => {
      setPosts([...ALL_POSTS].sort(() => Math.random() - 0.5));
      setFeedKey(k => k + 1);
      setIsRefreshing(false);
    }, 900);
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
          <AddPostDialog onAdd={handleAddPost} />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5">
        {/* Search tab */}
        {activeTab === "search" && (
          <LocationSearch posts={posts} />
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

            {/* Posts */}
            <div key={feedKey} className="space-y-4">
              {filteredPosts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-5xl mb-3">🔍</div>
                  <p className="font-semibold">Ничего не найдено</p>
                  <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
                </div>
              )}
              {filteredPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
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
