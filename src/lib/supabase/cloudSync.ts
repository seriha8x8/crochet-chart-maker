import { getSupabaseClient } from "@/lib/supabase/client";
import type { ChartSymbol, GuideState, Layer } from "@/types/chart";

interface CloudProject {
  layers: Layer[];
  symbols: ChartSymbol[];
  guide: GuideState;
}

export async function saveProjectToCloud(userId: string, project: CloudProject): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error: projectError } = await supabase
    .from("chart_projects")
    .upsert({ user_id: userId, guide: project.guide, updated_at: new Date().toISOString() });
  if (projectError) throw projectError;

  await supabase.from("chart_symbols").delete().eq("user_id", userId);
  await supabase.from("chart_layers").delete().eq("user_id", userId);

  const { error: layersError } = await supabase.from("chart_layers").insert(
    project.layers.map((l) => ({
      id: l.id,
      user_id: userId,
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

export async function loadProjectFromCloud(userId: string): Promise<CloudProject | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: projectRow } = await supabase
    .from("chart_projects")
    .select("guide")
    .eq("user_id", userId)
    .maybeSingle();
  if (!projectRow) return null;

  const { data: layerRows, error: layersError } = await supabase
    .from("chart_layers")
    .select("id, name, visible, order")
    .eq("user_id", userId)
    .order("order", { ascending: true });
  if (layersError) throw layersError;

  const { data: symbolRows, error: symbolsError } = await supabase
    .from("chart_symbols")
    .select("id, type, x, y, rotation, layer_id, parent_ids, attach_type, color, loop_count, base_stitch")
    .eq("user_id", userId);
  if (symbolsError) throw symbolsError;

  return {
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
      color: s.color ?? null,
      loopCount: s.loop_count ?? 3,
      baseStitch: s.base_stitch ?? "double",
    })) as ChartSymbol[],
  };
}
