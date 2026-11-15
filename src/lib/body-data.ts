import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/profile";
import { localDate } from "@/lib/fast";
import { nextCheckDate, type Angle, type BodyCheck } from "@/lib/body";

export type CheckWithPhotos = BodyCheck & { photos: Partial<Record<Angle, string>> }; // angle → URL firmada

export type BodyData = {
  profile: Profile;
  userId: string;
  today: string;
  checks: CheckWithPhotos[]; // del más viejo al más nuevo
  nextDate: string;
};

const SIGNED_URL_SECONDS = 60 * 60;

export async function getBodyData(profileArg?: Profile, { withPhotos = true } = {}): Promise<BodyData> {
  const profile = profileArg ?? (await getProfile());
  const today = localDate(new Date(), profile.timezone);
  const supabase = await createClient();

  const [{ data: checks, error }, { data: photos, error: pErr }] = await Promise.all([
    supabase
      .from("body_checks")
      .select("id, date, weight_kg, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, note")
      .order("date"),
    withPhotos
      ? supabase.from("body_photos").select("check_id, angle, storage_path")
      : Promise.resolve({ data: [] as { check_id: string; angle: string; storage_path: string }[], error: null }),
  ]);
  if (error) throw new Error(`No pude leer los controles: ${error.message}`);
  if (pErr) throw new Error(`No pude leer las fotos: ${pErr.message}`);

  const paths = (photos ?? []).map((p) => p.storage_path as string);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("body-photos").createSignedUrls(paths, SIGNED_URL_SECONDS);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }

  const list: CheckWithPhotos[] = ((checks ?? []) as BodyCheck[]).map((c) => {
    const ph: Partial<Record<Angle, string>> = {};
    (photos ?? [])
      .filter((p) => p.check_id === c.id)
      .forEach((p) => {
        const url = urls.get(p.storage_path as string);
        if (url) ph[p.angle as Angle] = url;
      });
    return { ...c, photos: ph };
  });

  return {
    profile,
    userId: profile.id,
    today,
    checks: list,
    nextDate: nextCheckDate(list, profile.body_check_start, today),
  };
}

export function photoPath(userId: string, checkId: string, angle: Angle) {
  return `${userId}/${checkId}/${angle}.jpg`;
}
