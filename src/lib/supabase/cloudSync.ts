import { getSupabaseClient } from "@/lib/supabase/client";
import type { ChartSymbol, GuideState, Layer } from "@/types/chart";

export type Plan = "free" | "premium";

/** Free plan cap on saved cloud charts — also enforced in the DB (chart_enforce_project_limit),
 *  this is just so the app can show a friendly message before even attempting the save. */
export const FREE_PLAN_PROJECT_LIMIT = 3;

export interface CloudProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export interface CloudProject extends CloudProjectSummary {
  symbols: ChartSymbol[];
  layers: Layer[];
  guide: GuideState;
}

/** Thrown when a free-plan user tries to save a new cloud project past their limit —
 *  whether caught client-side (see saveNewCloudProject) or surfaced from the DB trigger. */
export class ProjectLimitError extends Error {
  constructor() {
    super("free_plan_project_limit_reached");
    this.name = "ProjectLimitError";
  }
}

export async function getProfilePlan(userId: string): Promise<Plan> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("chart_profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  // No row yet (trigger hasn't run, or account predates it) defaults to free.
  return (data?.plan as Plan | undefined) ?? "free";
}

/** Temporary, self-service plan switch until real billing exists. */
export async function setProfilePlanForTesting(userId: string, plan: Plan): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("chart_profiles")
    .upsert({ id: userId, plan, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function listCloudProjects(userId: string): Promise<CloudProjectSummary[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("chart_projects")
    .select("id, name, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, updatedAt: p.updated_at }));
}

export async function loadCloudProject(userId: string, projectId: string): Promise<CloudProject | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: projectRow, error: projectError } = await supabase
    .from("chart_projects")
    .select("id, name, guide, updated_at")
    .eq("user_id", userId)
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!projectRow) return null;

  const { data: layerRows, error: layersError } = await supabase
    .from("chart_layers")
    .select("id, name, visible, order")
    .eq("project_id", projectId)
    .order("order", { ascending: true });
  if (layersError) throw layersError;

  const { data: symbolRows, error: symbolsError } = await supabase
    .from("chart_symbols")
    .select("id, type, x, y, rotation, layer_id, parent_ids, attach_type, color, loop_count, base_stitch")
    .eq("project_id", projectId);
  if (symbolsError) throw symbolsError;

  return {
    id: projectRow.id,
    name: projectRow.name,
    updatedAt: projectRow.updated_at,
    guide: projectRow.guide as GuideState,
    layers: (layerRows ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      visible: l.visible,
      order: l.order,
    })),
    symbols: (symbolRows ?? []).map((s) => ({
      id: s.id,
      type: s.type,
      x: s.x,
      y: s.y,
      rotation: s.rotation,
      layerId: s.layer_id,
      parentIds: s.parent_ids ?? [],
      attachType: s.attach_type,
      groupId: null,
      color: s.color ?? null,
      loopCount: s.loop_count ?? 3,
      baseStitch: s.base_stitch ?? "double",
    })) as ChartSymbol[],
  };
}

interface ProjectContent {
  name: string;
  symbols: ChartSymbol[];
  layers: Layer[];
  guide: GuideState;
}

async function writeProjectRows(
  userId: string,
  projectId: string,
  project: ProjectContent,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  await supabase.from("chart_symbols").delete().eq("project_id", projectId);
  await supabase.from("chart_layers").delete().eq("project_id", projectId);

  const { error: layersError } = await supabase.from("chart_layers").insert(
    project.layers.map((l) => ({
      id: l.id,
      user_id: userId,
      project_id: projectId,
      name: l.name,
      visible: l.visible,
      order: l.order,
    })),
  );
  if (layersError) throw layersError;

  if (project.symbols.length > 0) {
    const { error: symbolsError } = await supabase.from("chart_symbols").insert(
      project.symbols.map((s) => ({
        id: s.id,
        user_id: userId,
        project_id: projectId,
        type: s.type,
        x: s.x,
        y: s.y,
        rotation: s.rotation,
        layer_id: s.layerId,
        parent_ids: s.parentIds,
        attach_type: s.attachType,
        color: s.color,
        loop_count: s.loopCount,
        base_stitch: s.baseStitch,
      })),
    );
    if (symbolsError) throw symbolsError;
  }
}

/** Creates a brand-new cloud project. Rejected client-side with ProjectLimitError once a free
 *  plan already has FREE_PLAN_PROJECT_LIMIT saved — the DB trigger is the real enforcement,
 *  this is just to fail fast with a friendly message instead of a raw DB error. */
export async function saveNewCloudProject(
  userId: string,
  plan: Plan,
  project: ProjectContent,
): Promise<CloudProjectSummary> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  if (plan !== "premium") {
    const existing = await listCloudProjects(userId);
    if (existing.length >= FREE_PLAN_PROJECT_LIMIT) throw new ProjectLimitError();
  }

  const { data, error } = await supabase
    .from("chart_projects")
    .insert({ user_id: userId, name: project.name, guide: project.guide })
    .select("id, name, updated_at")
    .single();
  if (error) {
    // Belt-and-suspenders: the DB trigger raises this same message if the client-side
    // check above raced with another save (or was bypassed).
    if (error.message?.includes("free_plan_project_limit_reached")) throw new ProjectLimitError();
    throw error;
  }

  await writeProjectRows(userId, data.id, project);
  return { id: data.id, name: data.name, updatedAt: data.updated_at };
}

/** Overwrites an existing cloud project's content (and touches updated_at) — doesn't count
 *  against the plan's project limit, since it isn't creating a new one. */
export async function updateCloudProject(
  userId: string,
  projectId: string,
  project: ProjectContent,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("chart_projects")
    .update({ name: project.name, guide: project.guide, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", projectId);
  if (error) throw error;

  await writeProjectRows(userId, projectId, project);
}

export async function renameCloudProject(userId: string, projectId: string, name: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("chart_projects")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", projectId);
  if (error) throw error;
}

export async function deleteCloudProject(userId: string, projectId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");
  // chart_layers/chart_symbols cascade-delete via their project_id foreign key.
  const { error } = await supabase.from("chart_projects").delete().eq("user_id", userId).eq("id", projectId);
  if (error) throw error;
}
