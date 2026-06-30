"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import styles from "./page.module.scss";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  isPlaying: boolean;
  durationMs: number;
  progressMs: number;
}

const POLL_INTERVAL = 5000;
const REFRESH_BUFFER_MS = 60_000;

export default function KioskPage() {
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshTokenIfNeeded = useCallback(async () => {
    const match = document.cookie.match(/spotify_expires_at=(\d+)/);
    if (!match) return;
    const expiresAt = parseInt(match[1], 10);
    if (Date.now() > expiresAt - REFRESH_BUFFER_MS) {
      await fetch("/api/auth/refresh");
    }
  }, []);

  const fetchNowPlaying = useCallback(async () => {
    await refreshTokenIfNeeded();
    const res = await fetch("/api/now-playing");
    if (res.status === 401) {
      window.location.href = "/api/auth/login";
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    if (data.error) return;
    if (data.track === null) {
      setTrack(null);
      setIsPlaying(false);
    } else {
      setTrack(data);
      setIsPlaying(data.isPlaying);
    }
    setLoading(false);
  }, [refreshTokenIfNeeded]);

  useEffect(() => {
    fetchNowPlaying();
    pollRef.current = setInterval(fetchNowPlaying, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNowPlaying]);

  const sendAction = useCallback(
    async (action: string) => {
      await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setTimeout(fetchNowPlaying, 500);
    },
    [fetchNowPlaying],
  );

  const handlePlayPause = () => sendAction(isPlaying ? "pause" : "play");
  const handleNext = () => sendAction("next");
  const handlePrevious = () => sendAction("previous");

  if (loading) {
    return (
      <div className={styles.root}>
        <p className={styles.idle}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.albumArtWrapper}>
        {track?.albumArt ? (
          <Image
            src={track.albumArt}
            alt={track.album}
            fill
            className={styles.albumArt}
            priority
            unoptimized
          />
        ) : (
          <div className={styles.albumArtPlaceholder}>
            <MusicNoteIcon sx={{ fontSize: 80, color: "#535353" }} />
          </div>
        )}
      </div>

      <div className={styles.trackInfo}>
        <div className={styles.trackName}>
          {track ? track.name : "Nothing playing"}
        </div>
        <div className={styles.artistName}>{track ? track.artist : "—"}</div>
      </div>

      <div className={styles.controls}>
        <IconButton
          className={styles.controlBtn}
          onClick={handlePrevious}
          size="large"
          aria-label="Previous track"
          sx={{ "& svg": { fontSize: 40 } }}
        >
          <SkipPreviousIcon />
        </IconButton>

        <IconButton
          className={styles.playPauseBtn}
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          sx={{ "& svg": { fontSize: 44 } }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        <IconButton
          className={styles.controlBtn}
          onClick={handleNext}
          size="large"
          aria-label="Next track"
          sx={{ "& svg": { fontSize: 40 } }}
        >
          <SkipNextIcon />
        </IconButton>
      </div>
    </div>
  );
}
