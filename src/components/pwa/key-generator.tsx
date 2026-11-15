"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * Genera en TU celular las claves para los avisos (VAPID) y el CRON_SECRET.
 * No se mandan a ningún lado: las copiás a Vercel y listo.
 */
export function KeyGenerator() {
  const [keys, setKeys] = useState<{ name: string; value: string }[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async () => {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const pub = await crypto.subtle.exportKey("raw", pair.publicKey);
    const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
    const secret = crypto.getRandomValues(new Uint8Array(32));
    setKeys([
      { name: "VAPID_PUBLIC_KEY", value: b64url(pub) },
      { name: "VAPID_PRIVATE_KEY", value: jwk.d! },
      { name: "CRON_SECRET", value: b64url(secret.buffer) },
    ]);
  };

  const copy = async (name: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Faltan las claves de los avisos. Generalas acá (se crean en tu dispositivo, no se mandan a ningún lado) y
        cargalas en Vercel → Settings → Environment Variables. Después hacé Redeploy.
      </p>
      {!keys ? (
        <Button className="w-full bg-bg" onClick={generate}>
          Generar claves
        </Button>
      ) : (
        <ul className="space-y-2">
          {keys.map((k) => (
            <li key={k.name} className="rounded-xl bg-bg p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">{k.name}</span>
                <button className="text-xs font-bold text-accent" onClick={() => copy(k.name, k.value)}>
                  {copied === k.name ? "¡Copiada!" : "Copiar"}
                </button>
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-muted">{k.value}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
