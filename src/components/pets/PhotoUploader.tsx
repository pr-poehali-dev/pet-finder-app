import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUploader({ photos, onChange, maxPhotos = 5 }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const remaining = maxPhotos - photos.length;
    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    try {
      const urls = await Promise.all(toUpload.map((f) => api.uploadPhoto(f)));
      onChange([...photos, ...urls]);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Ошибка загрузки фото");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(idx: number) {
    onChange(photos.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border">
              <img src={url} className="w-full h-full object-cover" alt="" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {photos.length < maxPhotos && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Загружаю...
              </>
            ) : (
              <>
                <Icon name="Camera" size={18} />
                {photos.length === 0 ? "Добавить фото" : "Ещё фото"}
                <span className="text-xs opacity-60">({photos.length}/{maxPhotos})</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}
    </div>
  );
}
