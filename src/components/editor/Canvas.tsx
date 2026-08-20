"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChartStore } from "@/store/chartStore";
import { SYMBOL_DEFS, DEFAULT_SYMBOL_COLOR } from "@/lib/symbols/definitions";
import { SymbolShape } from "@/components/editor/SymbolShape";
import { getFootPoint, getHeadPoint, centroid, type Point } from "@/lib/symbols/geometry";
import { computeSnap } from "@/lib/symbols/snapping";
import { computeFillBetween } from "@/lib/symbols/straightArray";
import type { ChartSymbol } from "@/types/chart";

const SNAP_THRESHOLD = 9;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
/** Below this drag distance (world units), a placement drag is treated as a plain click. */
const PLACE_LINE_MIN_DRAG = 6;

interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

type DragMode =
  | { kind: "none" }
  | { kind: "moveSelection"; startWorld: { x: number; y: number }; startPositions: Map<string, { x: number; y: number }>; moved: boolean }
  | { kind: "marquee"; startScreen: { x: number; y: number }; currentScreen: { x: number; y: number }; additive: boolean }
  | { kind: "rotate"; symbolId: string; centerScreen: { x: number; y: number } }
  | { kind: "pan"; startScreen: { x: number; y: number }; startPan: { x: number; y: number } }
  | { kind: "placeLine"; startWorld: Point; currentWorld: Point }
  | { kind: "rotateGroup"; ids: string[]; pivot: Point; currentAngle: number };

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [containerOffset, setContainerOffset] = useState({ left: 0, top: 0 });
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, panX: 0, panY: 0 });
  const [drag, setDrag] = useState<DragMode>({ kind: "none" });
  const [snapGuide, setSnapGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [clickCandidate, setClickCandidate] = useState<string | null>(null);
  const [placementPreview, setPlacementPreview] = useState<{
    x: number;
    y: number;
    guideX: number | null;
    guideY: number | null;
  } | null>(null);

  const symbols = useChartStore((s) => s.symbols);
  const layers = useChartStore((s) => s.layers);
  const selectedIds = useChartStore((s) => s.selectedIds);
  const placementTool = useChartStore((s) => s.placementTool);
  const guide = useChartStore((s) => s.guide);
  const highlightIds = useChartStore((s) => s.highlightIds);
  const parentLinkTargetId = useChartStore((s) => s.parentLinkTargetId);
  const canvasBackground = useChartStore((s) => s.canvasBackground);

  const placeSymbolAt = useChartStore((s) => s.placeSymbolAt);
  const addSymbolsBatch = useChartStore((s) => s.addSymbolsBatch);
  const setSelection = useChartStore((s) => s.setSelection);
  const clearSelection = useChartStore((s) => s.clearSelection);
  const setRotation = useChartStore((s) => s.setRotation);
  const toggleParent = useChartStore((s) => s.toggleParent);
  const setHighlightFromSymbol = useChartStore((s) => s.setHighlightFromSymbol);

  const visibleLayerIds = useMemo(
    () => new Set(layers.filter((l) => l.visible).map((l) => l.id)),
    [layers],
  );
  const visibleSymbols = useMemo(
    () => symbols.filter((s) => visibleLayerIds.has(s.layerId)),
    [symbols, visibleLayerIds],
  );
  const symbolById = useMemo(() => new Map(symbols.map((s) => [s.id, s])), [symbols]);
  const activePlacementPreview = placementTool ? placementPreview : null;
  const placeLinePoints =
    drag.kind === "placeLine"
      ? computeFillBetween(drag.startWorld, drag.currentWorld, Math.max(4, guide.chain.stitchSpacing))
      : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateOffset = () => {
      const rect = el.getBoundingClientRect();
      setContainerOffset({ left: rect.left, top: rect.top });
    };
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
      updateOffset();
    });
    ro.observe(el);
    updateOffset();
    window.addEventListener("scroll", updateOffset, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updateOffset, true);
    };
  }, []);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (sx - rect.left - viewport.panX) / viewport.zoom,
        y: (sy - rect.top - viewport.panY) / viewport.zoom,
      };
    },
    [viewport],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const factor = Math.exp(-e.deltaY * 0.0015);
        setViewport((vp) => {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, vp.zoom * factor));
          const worldX = (cursor.x - vp.panX) / vp.zoom;
          const worldY = (cursor.y - vp.panY) / vp.zoom;
          return {
            zoom: newZoom,
            panX: cursor.x - worldX * newZoom,
            panY: cursor.y - worldY * newZoom,
          };
        });
      } else {
        setViewport((vp) => ({ ...vp, panX: vp.panX - e.deltaX, panY: vp.panY - e.deltaY }));
      }
    },
    [],
  );

  const snapCandidatePoints = useCallback(
    (excludeIds: Set<string>) => {
      const pts: { id: string; x: number; y: number }[] = [];
      for (const s of visibleSymbols) {
        if (excludeIds.has(s.id)) continue;
        const foot = getFootPoint(s);
        pts.push({ id: s.id + ":foot", x: foot.x, y: foot.y });
        const head = getHeadPoint(s);
        pts.push({ id: s.id + ":head", x: head.x, y: head.y });
      }
      return pts;
    },
    [visibleSymbols],
  );

  const onSymbolPointerDown = useCallback(
    (e: React.PointerEvent, symbol: ChartSymbol) => {
      e.stopPropagation();

      if (parentLinkTargetId) {
        if (symbol.id !== parentLinkTargetId) toggleParent(symbol.id);
        return;
      }

      // Clicking an existing symbol always selects it, even while a placement
      // tool is still armed, so a symbol can be picked up right after placing it.
      // Clicking any member of a group selects the whole group.
      const groupMemberIds = symbol.groupId
        ? symbols.filter((s) => s.groupId === symbol.groupId).map((s) => s.id)
        : [symbol.id];
      const world = screenToWorld(e.clientX, e.clientY);
      let nextSelection = selectedIds;
      if (e.shiftKey) {
        const allIn = groupMemberIds.every((id) => selectedIds.includes(id));
        nextSelection = allIn
          ? selectedIds.filter((id) => !groupMemberIds.includes(id))
          : Array.from(new Set([...selectedIds, ...groupMemberIds]));
        setSelection(nextSelection);
      } else if (!groupMemberIds.some((id) => selectedIds.includes(id))) {
        // Nothing from this symbol's group is currently selected: select just the group.
        nextSelection = groupMemberIds;
        setSelection(nextSelection);
      }
      setClickCandidate(symbol.id);

      const startPositions = new Map<string, { x: number; y: number }>();
      for (const id of nextSelection) {
        const s = symbolById.get(id);
        if (s) startPositions.set(id, { x: s.x, y: s.y });
      }
      setDrag({ kind: "moveSelection", startWorld: world, startPositions, moved: false });
    },
    [parentLinkTargetId, selectedIds, setSelection, symbols, symbolById, toggleParent, screenToWorld],
  );

  // Lets a group be picked up by clicking anywhere inside its dashed bounding box,
  // not just directly on one of its members.
  const onGroupBBoxPointerDown = useCallback(
    (e: React.PointerEvent, ids: string[]) => {
      e.stopPropagation();
      const world = screenToWorld(e.clientX, e.clientY);
      const startPositions = new Map<string, { x: number; y: number }>();
      for (const id of ids) {
        const s = symbolById.get(id);
        if (s) startPositions.set(id, { x: s.x, y: s.y });
      }
      setDrag({ kind: "moveSelection", startWorld: world, startPositions, moved: false });
    },
    [symbolById, screenToWorld],
  );

  const onRotateHandlePointerDown = useCallback(
    (e: React.PointerEvent, symbol: ChartSymbol) => {
      e.stopPropagation();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerScreen = {
        x: rect.left + viewport.panX + symbol.x * viewport.zoom,
        y: rect.top + viewport.panY + symbol.y * viewport.zoom,
      };
      useChartStore.getState().pushHistory();
      setDrag({ kind: "rotate", symbolId: symbol.id, centerScreen });
    },
    [viewport],
  );

  const onGroupRotateHandlePointerDown = useCallback(
    (e: React.PointerEvent, ids: string[], pivot: Point) => {
      e.stopPropagation();
      const world = screenToWorld(e.clientX, e.clientY);
      const currentAngle = (Math.atan2(world.y - pivot.y, world.x - pivot.x) * 180) / Math.PI;
      useChartStore.getState().pushHistory();
      setDrag({ kind: "rotateGroup", ids, pivot, currentAngle });
    },
    [screenToWorld],
  );

  const onBackgroundPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setDrag({ kind: "pan", startScreen: { x: e.clientX, y: e.clientY }, startPan: { x: viewport.panX, y: viewport.panY } });
        return;
      }
      if (e.button !== 0) return;

      const world = screenToWorld(e.clientX, e.clientY);

      if (parentLinkTargetId) {
        return;
      }
      if (placementTool) {
        // Don't place yet: a plain click places one symbol, but a drag fills a whole line
        // of them evenly between here and the release point. Decided on pointerup.
        const snap = computeSnap(world, snapCandidatePoints(new Set()), SNAP_THRESHOLD / viewport.zoom);
        const startPoint = { x: snap.x, y: snap.y };
        setPlacementPreview(null);
        setDrag({ kind: "placeLine", startWorld: startPoint, currentWorld: startPoint });
        return;
      }
      setDrag({
        kind: "marquee",
        startScreen: { x: e.clientX, y: e.clientY },
        currentScreen: { x: e.clientX, y: e.clientY },
        additive: e.shiftKey,
      });
      if (!e.shiftKey) clearSelection();
    },
    [placementTool, parentLinkTargetId, clearSelection, screenToWorld, viewport, snapCandidatePoints],
  );

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!placementTool || parentLinkTargetId || drag.kind !== "none") {
        if (placementPreview) setPlacementPreview(null);
        return;
      }
      const world = screenToWorld(e.clientX, e.clientY);
      const snap = computeSnap(world, snapCandidatePoints(new Set()), SNAP_THRESHOLD / viewport.zoom);
      setPlacementPreview({ x: snap.x, y: snap.y, guideX: snap.guideX, guideY: snap.guideY });
    },
    [placementTool, parentLinkTargetId, drag.kind, screenToWorld, snapCandidatePoints, viewport.zoom, placementPreview],
  );

  const onSvgPointerLeave = useCallback(() => {
    setPlacementPreview(null);
  }, []);

  useEffect(() => {
    if (drag.kind === "none") return;

    const onMove = (e: PointerEvent) => {
      if (drag.kind === "moveSelection") {
        const world = screenToWorld(e.clientX, e.clientY);
        const dx = world.x - drag.startWorld.x;
        const dy = world.y - drag.startWorld.y;
        if (Math.abs(dx) + Math.abs(dy) > 1 && !drag.moved) {
          useChartStore.getState().pushHistory();
          setDrag({ ...drag, moved: true });
        }
        const excludeIds = new Set(drag.startPositions.keys());
        const candidates = snapCandidatePoints(excludeIds);

        const ids = Array.from(drag.startPositions.keys());
        const primaryId = ids[0];
        const primaryStart = drag.startPositions.get(primaryId)!;
        const rawPoint = { x: primaryStart.x + dx, y: primaryStart.y + dy };
        const snap = computeSnap(rawPoint, candidates, SNAP_THRESHOLD / viewport.zoom);
        const adjustDx = snap.x - rawPoint.x;
        const adjustDy = snap.y - rawPoint.y;
        setSnapGuide({ x: snap.guideX, y: snap.guideY });

        for (const [id, start] of drag.startPositions) {
          useChartStore.getState().updateSymbol(id, {
            x: start.x + dx + adjustDx,
            y: start.y + dy + adjustDy,
          });
        }
      } else if (drag.kind === "marquee") {
        setDrag({ ...drag, currentScreen: { x: e.clientX, y: e.clientY } });
      } else if (drag.kind === "rotate") {
        // The handle always points from the pivot toward the cursor, so the symbol's
        // rotation can be read directly off the cursor's angle around centerScreen
        // (converted from atan2's "0=right" convention to ours, "0=up").
        const pointerAngle = (Math.atan2(e.clientY - drag.centerScreen.y, e.clientX - drag.centerScreen.x) * 180) / Math.PI;
        setRotation(drag.symbolId, pointerAngle + 90);
      } else if (drag.kind === "pan") {
        const dx = e.clientX - drag.startScreen.x;
        const dy = e.clientY - drag.startScreen.y;
        setViewport((vp) => ({ ...vp, panX: drag.startPan.x + dx, panY: drag.startPan.y + dy }));
      } else if (drag.kind === "placeLine") {
        const world = screenToWorld(e.clientX, e.clientY);
        const snap = computeSnap(world, snapCandidatePoints(new Set()), SNAP_THRESHOLD / viewport.zoom);
        setDrag({ ...drag, currentWorld: { x: snap.x, y: snap.y } });
      } else if (drag.kind === "rotateGroup") {
        // Relative angle change since the last tick — applied as a delta, so it stays
        // convention-agnostic (unlike the single-symbol handle, a group has no one
        // "current rotation" value an absolute angle could map onto).
        const world = screenToWorld(e.clientX, e.clientY);
        const newAngle = (Math.atan2(world.y - drag.pivot.y, world.x - drag.pivot.x) * 180) / Math.PI;
        const delta = newAngle - drag.currentAngle;
        useChartStore.getState().orbitGroup(drag.ids, delta, drag.pivot);
        setDrag({ ...drag, currentAngle: newAngle });
      }
    };

    const onUp = () => {
      if (drag.kind === "marquee") {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const x1 = Math.min(drag.startScreen.x, drag.currentScreen.x);
          const x2 = Math.max(drag.startScreen.x, drag.currentScreen.x);
          const y1 = Math.min(drag.startScreen.y, drag.currentScreen.y);
          const y2 = Math.max(drag.startScreen.y, drag.currentScreen.y);
          const w1 = screenToWorld(x1, y1);
          const w2 = screenToWorld(x2, y2);
          // Select anything the marquee overlaps at all (its drawn glyph, not just its
          // origin point), matching how drag-select works in most design tools.
          const caught = visibleSymbols.filter((s) => {
            const def = SYMBOL_DEFS[s.type];
            const pad = def.width / 2;
            const foot = getFootPoint(s);
            const head = getHeadPoint(s);
            const minX = Math.min(foot.x, head.x) - pad;
            const maxX = Math.max(foot.x, head.x) + pad;
            const minY = Math.min(foot.y, head.y) - pad;
            const maxY = Math.max(foot.y, head.y) + pad;
            return !(maxX < w1.x || minX > w2.x || maxY < w1.y || minY > w2.y);
          });
          const caughtIds = new Set(caught.map((s) => s.id));
          // Catching one member of a group pulls in the whole group.
          const caughtGroupIds = new Set(caught.filter((s) => s.groupId).map((s) => s.groupId));
          const inRect = visibleSymbols
            .filter((s) => caughtIds.has(s.id) || (s.groupId && caughtGroupIds.has(s.groupId)))
            .map((s) => s.id);
          if (inRect.length > 0) {
            if (drag.additive) {
              const merged = new Set([...selectedIds, ...inRect]);
              setSelection(Array.from(merged));
            } else {
              setSelection(inRect);
            }
          }
        }
      } else if (drag.kind === "moveSelection") {
        if (!drag.moved && clickCandidate) {
          setHighlightFromSymbol(clickCandidate);
        }
      } else if (drag.kind === "placeLine") {
        const dist = Math.hypot(
          drag.currentWorld.x - drag.startWorld.x,
          drag.currentWorld.y - drag.startWorld.y,
        );
        if (dist < PLACE_LINE_MIN_DRAG) {
          placeSymbolAt(drag.startWorld.x, drag.startWorld.y);
        } else if (placementTool) {
          const spacing = Math.max(4, guide.chain.stitchSpacing);
          const points = computeFillBetween(drag.startWorld, drag.currentWorld, spacing);
          addSymbolsBatch(points.map((p) => ({ type: placementTool, x: p.x, y: p.y, rotation: 0 })));
        }
      }
      setClickCandidate(null);
      setSnapGuide({ x: null, y: null });
      setDrag({ kind: "none" });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, viewport.zoom]);

  const selectedSymbol =
    selectedIds.length === 1 ? symbolById.get(selectedIds[0]) : undefined;

  const multiSelectInfo = useMemo(() => {
    if (selectedIds.length < 2) return null;
    const selected = selectedIds.map((id) => symbolById.get(id)).filter((s): s is ChartSymbol => !!s);
    if (selected.length === 0) return null;
    const isGroup = !!selected[0].groupId && selected.every((s) => s.groupId === selected[0].groupId);
    const pad = 14;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const s of selected) {
      for (const p of [getFootPoint(s), getHeadPoint(s)]) {
        minX = Math.min(minX, p.x - pad);
        minY = Math.min(minY, p.y - pad);
        maxX = Math.max(maxX, p.x + pad);
        maxY = Math.max(maxY, p.y + pad);
      }
    }
    const pivot = centroid(selected.map(getFootPoint));
    return { bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, pivot, isGroup };
  }, [selectedIds, symbolById]);

  // startScreen/currentScreen are viewport-relative (clientX/Y); the overlay div is
  // absolutely positioned inside the canvas container, so offset by the container's
  // own position or the box is drawn away from the cursor.
  const marqueeRect =
    drag.kind === "marquee"
      ? {
          x: Math.min(drag.startScreen.x, drag.currentScreen.x) - containerOffset.left,
          y: Math.min(drag.startScreen.y, drag.currentScreen.y) - containerOffset.top,
          w: Math.abs(drag.currentScreen.x - drag.startScreen.x),
          h: Math.abs(drag.currentScreen.y - drag.startScreen.y),
        }
      : null;

  const isDark = canvasBackground === "dark";

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${isDark ? "bg-neutral-800" : "bg-cream/20"}`}
    >
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className={placementTool ? "cursor-crosshair" : "cursor-default"}
        onWheel={handleWheel}
        onPointerDown={onBackgroundPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerLeave={onSvgPointerLeave}
      >
        <defs>
          <pattern id="dot-grid" width={20} height={20} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={1} fill={isDark ? "#57534e" : "#ecdcc4"} />
          </pattern>
        </defs>
        <rect x={0} y={0} width={size.w} height={size.h} fill="url(#dot-grid)" />

        <g transform={`translate(${viewport.panX},${viewport.panY}) scale(${viewport.zoom})`}>
          <GuideLayer guide={guide} />

          {multiSelectInfo && multiSelectInfo.isGroup && !parentLinkTargetId && (
            <rect
              x={multiSelectInfo.bbox.x}
              y={multiSelectInfo.bbox.y}
              width={multiSelectInfo.bbox.w}
              height={multiSelectInfo.bbox.h}
              rx={6}
              fill="transparent"
              stroke="#f57799"
              strokeWidth={1}
              strokeDasharray="5 4"
              opacity={0.5}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => onGroupBBoxPointerDown(e, selectedIds)}
            />
          )}

          {visibleSymbols.map((symbol) => {
            const isSelected = selectedIds.includes(symbol.id);
            const isHighlighted = highlightIds.includes(symbol.id);
            const isLinkTarget = parentLinkTargetId === symbol.id;
            const isLinkedParent =
              parentLinkTargetId && symbolById.get(parentLinkTargetId)?.parentIds.includes(symbol.id);
            const def = SYMBOL_DEFS[symbol.type];
            const visualR = Math.max(def.width, def.height, 16) / 2 + 7;
            // While a placement tool is armed, shrink the clickable area down to roughly the
            // glyph itself. Otherwise the generous hit padding of a symbol in the row below
            // swallows clicks meant to place a new symbol just above it (rows sit close together).
            const hitR = placementTool ? Math.max(def.width, def.height) / 2 + 1 : visualR;
            const strokeColor = isLinkTarget
              ? "#7c3aed"
              : isLinkedParent
              ? "#059669"
              : isHighlighted
              ? "#dc2626"
              : isSelected
              ? "#f57799"
              : symbol.color ?? DEFAULT_SYMBOL_COLOR;
            return (
              <g
                key={symbol.id}
                transform={`translate(${symbol.x},${symbol.y}) rotate(${symbol.rotation})`}
                onPointerDown={(e) => onSymbolPointerDown(e, symbol)}
                style={{ cursor: parentLinkTargetId ? "pointer" : "grab" }}
              >
                <circle cx={0} cy={-def.height / 2} r={hitR} fill="transparent" />
                {(isSelected || isHighlighted || isLinkTarget || isLinkedParent) && (
                  <circle
                    cx={0}
                    cy={-def.height / 2}
                    r={visualR - 2}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={1.5}
                    strokeDasharray={isHighlighted || isLinkedParent ? "3 2" : undefined}
                    opacity={0.6}
                  />
                )}
                <SymbolShape type={symbol.type} stroke={strokeColor} />
              </g>
            );
          })}

          {selectedSymbol && !parentLinkTargetId && (
            <RotateHandle symbol={selectedSymbol} onPointerDown={onRotateHandlePointerDown} />
          )}

          {multiSelectInfo && !parentLinkTargetId && (
            <GroupRotateHandle
              info={multiSelectInfo}
              liveAngle={drag.kind === "rotateGroup" ? drag.currentAngle : null}
              ids={selectedIds}
              onPointerDown={onGroupRotateHandlePointerDown}
            />
          )}

          {placementTool && activePlacementPreview && !placeLinePoints && (
            <g transform={`translate(${activePlacementPreview.x},${activePlacementPreview.y})`} opacity={0.45} pointerEvents="none">
              <SymbolShape type={placementTool} stroke="#f57799" />
            </g>
          )}

          {placementTool && placeLinePoints && (
            <g pointerEvents="none">
              {placeLinePoints.length > 1 && (
                <line
                  x1={placeLinePoints[0].x}
                  y1={placeLinePoints[0].y}
                  x2={placeLinePoints[placeLinePoints.length - 1].x}
                  y2={placeLinePoints[placeLinePoints.length - 1].y}
                  stroke="#f57799"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
              )}
              {placeLinePoints.map((p, i) => (
                <g key={i} transform={`translate(${p.x},${p.y})`} opacity={0.45}>
                  <SymbolShape type={placementTool} stroke="#f57799" />
                </g>
              ))}
            </g>
          )}

          {(snapGuide.x !== null || activePlacementPreview?.guideX != null) && (
            <line
              x1={snapGuide.x ?? activePlacementPreview!.guideX!}
              y1={-10000}
              x2={snapGuide.x ?? activePlacementPreview!.guideX!}
              y2={10000}
              stroke="#f57799"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
          {(snapGuide.y !== null || activePlacementPreview?.guideY != null) && (
            <line
              x1={-10000}
              y1={snapGuide.y ?? activePlacementPreview!.guideY!}
              x2={10000}
              y2={snapGuide.y ?? activePlacementPreview!.guideY!}
              stroke="#f57799"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
        </g>
      </svg>

      {marqueeRect && (
        <div
          className="pointer-events-none absolute border border-pink bg-pink/10"
          style={{ left: marqueeRect.x, top: marqueeRect.y, width: marqueeRect.w, height: marqueeRect.h }}
        />
      )}

      <ZoomControls viewport={viewport} setViewport={setViewport} />
    </div>
  );
}

function RotateHandle({
  symbol,
  onPointerDown,
}: {
  symbol: ChartSymbol;
  onPointerDown: (e: React.PointerEvent, symbol: ChartSymbol) => void;
}) {
  const def = SYMBOL_DEFS[symbol.type];
  const handleDist = def.height + 24;
  const rad = (symbol.rotation * Math.PI) / 180;
  const hx = symbol.x + handleDist * Math.sin(rad);
  const hy = symbol.y - handleDist * Math.cos(rad);
  return (
    <g>
      <line x1={symbol.x} y1={symbol.y} x2={hx} y2={hy} stroke="#f57799" strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
      <circle
        cx={hx}
        cy={hy}
        r={7}
        fill="#f57799"
        stroke="white"
        strokeWidth={1.5}
        style={{ cursor: "grab" }}
        onPointerDown={(e) => onPointerDown(e, symbol)}
      />
    </g>
  );
}

interface MultiSelectInfo {
  bbox: { x: number; y: number; w: number; h: number };
  pivot: Point;
  isGroup: boolean;
}

function GroupRotateHandle({
  info,
  liveAngle,
  ids,
  onPointerDown,
}: {
  info: MultiSelectInfo;
  /** Raw atan2-convention angle (degrees, 0=right) while actively dragging, else null. */
  liveAngle: number | null;
  ids: string[];
  onPointerDown: (e: React.PointerEvent, ids: string[], pivot: Point) => void;
}) {
  const handleDist = info.bbox.h / 2 + 24;
  const angleRad = liveAngle !== null ? (liveAngle * Math.PI) / 180 : -Math.PI / 2;
  const hx = info.pivot.x + handleDist * Math.cos(angleRad);
  const hy = info.pivot.y + handleDist * Math.sin(angleRad);
  return (
    <g>
      <line x1={info.pivot.x} y1={info.pivot.y} x2={hx} y2={hy} stroke="#f57799" strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
      <circle
        cx={hx}
        cy={hy}
        r={7}
        fill="#f57799"
        stroke="white"
        strokeWidth={1.5}
        style={{ cursor: "grab" }}
        onPointerDown={(e) => onPointerDown(e, ids, info.pivot)}
      />
    </g>
  );
}

function GuideLayer({ guide }: { guide: import("@/types/chart").GuideState }) {
  if (guide.type === "chain") {
    const { y, startX, length, stitchSpacing } = guide.chain;
    const ticks = [];
    for (let x = startX; x <= startX + length; x += stitchSpacing) {
      ticks.push(<line key={x} x1={x} y1={y - 5} x2={x} y2={y + 5} stroke="#fdc3a1" strokeWidth={1} />);
    }
    return (
      <g opacity={0.8}>
        <line x1={startX} y1={y} x2={startX + length} y2={y} stroke="#fdc3a1" strokeWidth={1.5} strokeDasharray="6 4" />
        {ticks}
      </g>
    );
  }
  if (guide.type === "ring") {
    const { centerX, centerY, ringCount, ringSpacing } = guide.ring;
    const circles = [];
    for (let i = 1; i <= ringCount; i++) {
      circles.push(
        <circle
          key={i}
          cx={centerX}
          cy={centerY}
          r={i * ringSpacing}
          fill="none"
          stroke="#fdc3a1"
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />,
      );
    }
    return (
      <g opacity={0.8}>
        {circles}
        <circle cx={centerX} cy={centerY} r={2} fill="#fb9b8f" />
      </g>
    );
  }
  return null;
}

function ZoomControls({
  viewport,
  setViewport,
}: {
  viewport: Viewport;
  setViewport: (updater: (vp: Viewport) => Viewport) => void;
}) {
  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-peach/50 bg-white px-2 py-1 text-xs text-ink shadow-sm">
      <button
        className="rounded px-2 py-1 hover:bg-cream/60"
        onClick={() => setViewport((vp) => ({ ...vp, zoom: Math.max(MIN_ZOOM, vp.zoom - 0.1) }))}
      >
        −
      </button>
      <span className="w-10 text-center tabular-nums">{Math.round(viewport.zoom * 100)}%</span>
      <button
        className="rounded px-2 py-1 hover:bg-cream/60"
        onClick={() => setViewport((vp) => ({ ...vp, zoom: Math.min(MAX_ZOOM, vp.zoom + 0.1) }))}
      >
        +
      </button>
      <button
        className="ml-1 rounded px-2 py-1 hover:bg-cream/60"
        onClick={() => setViewport(() => ({ zoom: 1, panX: 0, panY: 0 }))}
      >
        リセット
      </button>
    </div>
  );
}
