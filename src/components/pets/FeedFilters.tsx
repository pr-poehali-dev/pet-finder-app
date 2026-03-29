import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { PostType, DOG_BREEDS, CAT_BREEDS, ALL_BREEDS, CITY_OPTIONS } from "@/types/pets";

interface FeedFiltersProps {
  activeTab: string;
  searchQuery: string;
  filterType: PostType | "all";
  filterAnimal: string;
  filterBreed: string;
  filterCity: string;
  filteredCount: number;
  isRefreshing: boolean;
  onSearchChange: (v: string) => void;
  onFilterTypeChange: (v: PostType | "all") => void;
  onFilterAnimalChange: (v: string) => void;
  onFilterBreedChange: (v: string) => void;
  onFilterCityChange: (v: string) => void;
  onRefresh: () => void;
}

export default function FeedFilters({
  activeTab,
  searchQuery,
  filterType,
  filterAnimal,
  filterBreed,
  filterCity,
  filteredCount,
  isRefreshing,
  onSearchChange,
  onFilterTypeChange,
  onFilterAnimalChange,
  onFilterBreedChange,
  onFilterCityChange,
  onRefresh,
}: FeedFiltersProps) {
  const animalBreeds = filterAnimal === "Собака" ? DOG_BREEDS : filterAnimal === "Кошка" ? CAT_BREEDS : ALL_BREEDS;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по кличке, породе, месту..."
          className="pl-10 rounded-2xl border-border/60 bg-white shadow-sm h-11"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
                onClick={() => onFilterTypeChange(val as PostType | "all")}
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
              onClick={() => { onFilterAnimalChange(val); onFilterBreedChange("Любая порода"); }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterAnimal === val ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Breed filter */}
        <div>
          <Select value={filterBreed} onValueChange={onFilterBreedChange}>
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

        {/* City filter */}
        <div>
          <Select value={filterCity} onValueChange={onFilterCityChange}>
            <SelectTrigger className="rounded-xl h-9 text-sm">
              <div className="flex items-center gap-2">
                <Icon name="MapPin" size={14} className="text-muted-foreground" />
                <SelectValue placeholder="Все города" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {CITY_OPTIONS.map((c) => (
                <SelectItem key={c.val} value={c.val}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count + refresh */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          Найдено: <span className="font-semibold text-foreground">{filteredCount}</span> объявлений
          {filterBreed !== "Любая порода" && (
            <span className="ml-2 inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-semibold">
              {filterBreed}
              <button onClick={() => onFilterBreedChange("Любая порода")} className="ml-0.5 hover:text-red-500">×</button>
            </span>
          )}
          {filterCity !== "all" && (
            <span className="ml-2 inline-flex items-center gap-1 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">
              <Icon name="MapPin" size={10} />
              {CITY_OPTIONS.find(c => c.val === filterCity)?.label}
              <button onClick={() => onFilterCityChange("all")} className="ml-0.5 hover:text-red-500">×</button>
            </span>
          )}
        </p>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-all disabled:opacity-60"
        >
          <Icon name="RefreshCw" size={13} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Обновляю..." : "Обновить"}
        </button>
      </div>
    </div>
  );
}
