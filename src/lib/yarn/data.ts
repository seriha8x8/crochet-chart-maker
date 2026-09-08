import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { uploadPhoto, deletePhoto } from "@/lib/yarn/photos";
import { canAddPhoto } from "@/lib/yarn/plan";
import type { Project, Yarn, YarnPlan } from "@/lib/yarn/types";

/** Thrown when a photo change needs a plan the caller doesn't have, so the UI can show the upgrade modal. */
export class UpgradeRequiredError extends Error {
  constructor() {
    super("upgrade_required");
    this.name = "UpgradeRequiredError";
  }
}

function requireSupabase(): SupabaseClient {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase が設定されていません。");
  return supabase;
}

export async function getYarnAppPlan(userId: string): Promise<YarnPlan> {
  const supabase = requireSupabase();
  const { data } = await supabase.from("user_profiles").select("plan").eq("id", userId).single();
  return (data?.plan as YarnPlan | undefined) ?? "free";
}

export type PhotoChange = { removePhoto: boolean; file: File | null };

// --- Yarns ---------------------------------------------------------------

export type YarnFields = {
  name: string;
  color: string | null;
  manufacturer: string | null;
  material: string | null;
  thickness: string | null;
  stock_count: number;
};

export type YarnFilters = {
  q?: string;
  color?: string;
  manufacturer?: string;
  material?: string;
  thickness?: string;
};

export type YarnFacets = {
  color: string[];
  manufacturer: string[];
  material: string[];
  thickness: string[];
};

function uniqueValues(rows: Record<string, unknown>[] | null, key: string): string[] {
  if (!rows) return [];
  const values = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value === "string" && value) values.add(value);
  }
  return Array.from(values).sort();
}

export async function listYarns(userId: string, filters: YarnFilters): Promise<{ yarns: Yarn[]; facets: YarnFacets }> {
  const supabase = requireSupabase();

  let query = supabase.from("yarns").select("*").eq("user_id", userId).order("created_at", { ascending: false });

  if (filters.q) {
    const q = `%${filters.q}%`;
    query = query.or(`name.ilike.${q},manufacturer.ilike.${q}`);
  }
  if (filters.color) query = query.eq("color", filters.color);
  if (filters.manufacturer) query = query.eq("manufacturer", filters.manufacturer);
  if (filters.material) query = query.eq("material", filters.material);
  if (filters.thickness) query = query.eq("thickness", filters.thickness);

  const [{ data: yarns }, { data: allYarns }] = await Promise.all([
    query,
    supabase.from("yarns").select("color, manufacturer, material, thickness").eq("user_id", userId),
  ]);

  return {
    yarns: yarns ?? [],
    facets: {
      color: uniqueValues(allYarns, "color"),
      manufacturer: uniqueValues(allYarns, "manufacturer"),
      material: uniqueValues(allYarns, "material"),
      thickness: uniqueValues(allYarns, "thickness"),
    },
  };
}

export async function listYarnsForPicker(userId: string): Promise<Yarn[]> {
  const supabase = requireSupabase();
  const { data } = await supabase.from("yarns").select("*").eq("user_id", userId).order("name");
  return data ?? [];
}

export async function getYarn(userId: string, id: string): Promise<Yarn | null> {
  const supabase = requireSupabase();
  const { data } = await supabase.from("yarns").select("*").eq("id", id).eq("user_id", userId).single();
  return data ?? null;
}

export type YarnUsageRow = {
  id: string;
  used_count: number;
  project: { id: string; title: string; made_on: string | null } | null;
};

export async function getYarnUsages(yarnId: string): Promise<YarnUsageRow[]> {
  const supabase = requireSupabase();
  const { data } = await supabase
    .from("project_yarns")
    .select("id, used_count, project:projects(id, title, made_on)")
    .eq("yarn_id", yarnId)
    .returns<YarnUsageRow[]>();
  return data ?? [];
}

export async function createYarn(userId: string, fields: YarnFields, photoFile: File | null): Promise<Yarn> {
  const supabase = requireSupabase();

  const { data: yarn, error } = await supabase
    .from("yarns")
    .insert({ ...fields, user_id: userId })
    .select()
    .single();

  if (error || !yarn) {
    throw new Error(error?.message ?? "登録に失敗しました");
  }

  if (photoFile && photoFile.size > 0) {
    const path = `${userId}/yarns/${yarn.id}`;
    await uploadPhoto(supabase, path, photoFile);
    await supabase.from("yarns").update({ photo_url: path }).eq("id", yarn.id);
    yarn.photo_url = path;
  }

  return yarn;
}

export async function updateYarn(
  userId: string,
  yarnId: string,
  fields: YarnFields,
  photo: PhotoChange,
  plan: YarnPlan,
): Promise<void> {
  const supabase = requireSupabase();

  const { data: existing } = await supabase
    .from("yarns")
    .select("photo_url")
    .eq("id", yarnId)
    .eq("user_id", userId)
    .single();

  if (!existing) {
    throw new Error("毛糸が見つかりません");
  }

  const hasNewPhoto = !!photo.file && photo.file.size > 0;
  if (hasNewPhoto && !photo.removePhoto && existing.photo_url && !canAddPhoto(plan, 1)) {
    throw new UpgradeRequiredError();
  }

  let photo_url: string | null = existing.photo_url;

  if (photo.removePhoto && photo_url) {
    await deletePhoto(supabase, photo_url);
    photo_url = null;
  }

  if (hasNewPhoto) {
    const path = `${userId}/yarns/${yarnId}`;
    await uploadPhoto(supabase, path, photo.file as File);
    photo_url = path;
  }

  const { error } = await supabase.from("yarns").update({ ...fields, photo_url }).eq("id", yarnId).eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteYarn(userId: string, yarnId: string): Promise<void> {
  const supabase = requireSupabase();

  const { data: existing } = await supabase
    .from("yarns")
    .select("photo_url")
    .eq("id", yarnId)
    .eq("user_id", userId)
    .single();

  if (existing?.photo_url) {
    await deletePhoto(supabase, existing.photo_url);
  }

  await supabase.from("yarns").delete().eq("id", yarnId).eq("user_id", userId);
}

// --- Projects --------------------------------------------------------------

export type ProjectFields = { title: string; made_on: string | null };
export type YarnSelection = { yarn_id: string; used_count: number };

async function decrementStock(supabase: SupabaseClient, userId: string, selections: YarnSelection[]) {
  for (const selection of selections) {
    const { data: yarn } = await supabase
      .from("yarns")
      .select("stock_count")
      .eq("id", selection.yarn_id)
      .eq("user_id", userId)
      .single();

    if (!yarn) continue;

    await supabase
      .from("yarns")
      .update({ stock_count: Math.max(0, yarn.stock_count - selection.used_count) })
      .eq("id", selection.yarn_id)
      .eq("user_id", userId);
  }
}

export async function listProjects(userId: string): Promise<Project[]> {
  const supabase = requireSupabase();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("made_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProject(userId: string, id: string): Promise<Project | null> {
  const supabase = requireSupabase();
  const { data } = await supabase.from("projects").select("*").eq("id", id).eq("user_id", userId).single();
  return data ?? null;
}

export type ProjectUsageRow = {
  id: string;
  used_count: number;
  yarn: { id: string; name: string; manufacturer: string | null } | null;
};

export async function getProjectUsages(projectId: string): Promise<ProjectUsageRow[]> {
  const supabase = requireSupabase();
  const { data } = await supabase
    .from("project_yarns")
    .select("id, used_count, yarn:yarns(id, name, manufacturer)")
    .eq("project_id", projectId)
    .returns<ProjectUsageRow[]>();
  return data ?? [];
}

export async function createProject(
  userId: string,
  fields: ProjectFields,
  selections: YarnSelection[],
  decrementStockFlag: boolean,
  photoFile: File | null,
): Promise<Project> {
  const supabase = requireSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ ...fields, user_id: userId })
    .select()
    .single();

  if (error || !project) {
    throw new Error(error?.message ?? "登録に失敗しました");
  }

  if (selections.length > 0) {
    await supabase
      .from("project_yarns")
      .insert(selections.map((s) => ({ project_id: project.id, yarn_id: s.yarn_id, used_count: s.used_count })));

    if (decrementStockFlag) {
      await decrementStock(supabase, userId, selections);
    }
  }

  if (photoFile && photoFile.size > 0) {
    const path = `${userId}/projects/${project.id}`;
    await uploadPhoto(supabase, path, photoFile);
    await supabase.from("projects").update({ photo_url: path }).eq("id", project.id);
  }

  return project;
}

export async function updateProject(
  userId: string,
  projectId: string,
  fields: ProjectFields,
  selections: YarnSelection[],
  decrementStockFlag: boolean,
  photo: PhotoChange,
  plan: YarnPlan,
): Promise<void> {
  const supabase = requireSupabase();

  const { data: existing } = await supabase
    .from("projects")
    .select("photo_url")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (!existing) {
    throw new Error("作品メモが見つかりません");
  }

  const hasNewPhoto = !!photo.file && photo.file.size > 0;
  if (hasNewPhoto && !photo.removePhoto && existing.photo_url && !canAddPhoto(plan, 1)) {
    throw new UpgradeRequiredError();
  }

  let photo_url: string | null = existing.photo_url;

  if (photo.removePhoto && photo_url) {
    await deletePhoto(supabase, photo_url);
    photo_url = null;
  }

  if (hasNewPhoto) {
    const path = `${userId}/projects/${projectId}`;
    await uploadPhoto(supabase, path, photo.file as File);
    photo_url = path;
  }

  await supabase.from("project_yarns").delete().eq("project_id", projectId);
  if (selections.length > 0) {
    await supabase
      .from("project_yarns")
      .insert(selections.map((s) => ({ project_id: projectId, yarn_id: s.yarn_id, used_count: s.used_count })));

    if (decrementStockFlag) {
      await decrementStock(supabase, userId, selections);
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({ ...fields, photo_url })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const supabase = requireSupabase();

  const { data: existing } = await supabase
    .from("projects")
    .select("photo_url")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (existing?.photo_url) {
    await deletePhoto(supabase, existing.photo_url);
  }

  await supabase.from("projects").delete().eq("id", projectId).eq("user_id", userId);
}
