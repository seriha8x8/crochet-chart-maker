export type SymbolType =
  | "chain"
  | "slipStitch"
  | "singleCrochet"
  | "halfDouble"
  | "double"
  | "triple"
  | "ring";

export type AttachType = "stitch" | "space";

export interface ChartSymbol {
  id: string;
  type: SymbolType;
  x: number;
  y: number;
  rotation: number;
  layerId: string;
  parentIds: string[];
  attachType: AttachType;
  groupId: string | null;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

export type GuideType = "none" | "chain" | "ring";

export interface ChainGuideParams {
  y: number;
  startX: number;
  length: number;
  stitchSpacing: number;
}

export interface RingGuideParams {
  centerX: number;
  centerY: number;
  ringCount: number;
  ringSpacing: number;
}

export interface GuideState {
  type: GuideType;
  chain: ChainGuideParams;
  ring: RingGuideParams;
}

export interface ChartProject {
  id: string;
  name: string;
  symbols: ChartSymbol[];
  layers: Layer[];
  guide: GuideState;
  updatedAt: string;
}
