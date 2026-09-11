"use client";

import { useState } from "react";

export interface VideoItem {
  title: string;
  /** Filled in once each tutorial is filmed; null renders the "準備中" placeholder. */
  videoUrl: string | null;
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {
    return null;
  }
  return null;
}

export function VideoCard({ item, thumbnailBg }: { item: VideoItem; thumbnailBg: string }) {
  const [playing, setPlaying] = useState(false);
  const videoId = item.videoUrl ? extractYoutubeId(item.videoUrl) : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#5BC8AC26" }}>
      <div className="relative aspect-video w-full" style={{ backgroundColor: thumbnailBg }}>
        {!videoId && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ color: "#5BC8AC" }}>
            <PlayIcon />
            <span className="text-[11px] font-medium">準備中</span>
          </div>
        )}

        {videoId && !playing && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`${item.title}の動画を再生`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer available */}
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25">
              <PlayButtonOverlay />
            </span>
          </button>
        )}

        {videoId && playing && (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={item.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      {/* Fixed height so every card lines up regardless of how long its title is. */}
      <div className="flex min-h-[3rem] items-center px-3 py-2">
        <p className="line-clamp-2 text-sm font-medium text-[#2f2f2f]">{item.title}</p>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <path d="M14 11l10 6-10 6V11z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function PlayButtonOverlay() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="white" opacity="0.9" />
      <path d="M19 15l16 9-16 9V15z" fill="#F18D9E" />
    </svg>
  );
}
