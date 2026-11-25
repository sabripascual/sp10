"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { squareImage } from "@/components/body/compress";
import { Avatar } from "@/components/shell/avatar";
import { setAvatar } from "./avatar-actions";

/** Elegir o cambiar la foto de perfil: se recorta en cuadrado y se sube desde el celular. */
export function AvatarPicker({ userId, url }: { userId: string; url: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const blob = await squareImage(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await createClient().storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw new Error(upErr.message);
      const res = await setAvatar(path);
      if (res.error) throw new Error(res.error);
      setPreview(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await setAvatar(null);
    if (res.error) setError(res.error);
    else setPreview(null);
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="relative shrink-0 active:scale-95"
        aria-label="Cambiar foto de perfil"
      >
        <Avatar url={preview} className="size-20 bg-bg" emojiClass="text-4xl" />
        <span className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-accent text-accent-fg ring-4 ring-surface">
          <Camera className="size-4" />
        </span>
      </button>
      <div className="min-w-0 space-y-1">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="font-bold">
          {busy ? "Subiendo…" : preview ? "Cambiar foto" : "Elegir foto"}
        </button>
        {preview && !busy && (
          <button type="button" onClick={remove} className="block text-sm text-muted underline">
            Sacar foto
          </button>
        )}
        {error && <p className="text-sm">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) upload(f);
        }}
      />
    </div>
  );
}
