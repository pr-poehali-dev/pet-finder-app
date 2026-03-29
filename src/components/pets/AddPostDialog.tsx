import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { Post, PostType, DOG_BREEDS, CAT_BREEDS, ALL_BREEDS, TYPE_CONFIG } from "@/types/pets";

interface AddPostDialogProps {
  onAdd: (post: Post) => void;
}

export default function AddPostDialog({ onAdd }: AddPostDialogProps) {
  const [open, setOpen] = useState(false);
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

  function handleAdd() {
    const post: Post = {
      id: Date.now(),
      ...newPost,
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }),
      image: "https://cdn.poehali.dev/projects/72e8f24a-5c0c-4161-add4-704b787e2131/files/40471b2f-a49f-498f-b018-cb07777cadec.jpg",
      lat: 55.75,
      lng: 37.61,
    };
    onAdd(post);
    setOpen(false);
    setNewPost({ type: "lost", animal: "Собака", breed: "", name: "", location: "", description: "", contact: "" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <Button onClick={handleAdd} className="w-full gradient-primary text-white rounded-xl font-semibold py-5">
            Опубликовать объявление
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
