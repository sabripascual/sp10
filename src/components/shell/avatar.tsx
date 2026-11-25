import { cn } from "@/lib/utils";

/** Foto de perfil redonda; sin foto, el perrito. */
export function Avatar({ url, className, emojiClass }: { url: string | null; className?: string; emojiClass?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span className={cn("grid place-items-center rounded-full", className)}>
      <span className={emojiClass}>🐶</span>
    </span>
  );
}
