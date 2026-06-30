"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { COOKIE_EXPIRES_AT } from "@/lib/spotify";
import styles from "./page.module.scss";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  isPlaying: boolean;
  volumePercent: number | null;
  durationMs: number;
  progressMs: number;
}

interface NextTrack {
  name: string;
  artist: string;
  albumArt: string | null;
}

const POLL_INTERVAL = 5000;
const REFRESH_BUFFER_MS = 60_000;

export default function KioskPage() {
  const [track, setTrack] = useState<Track | null>(null);
  const [nextTrack, setNextTrack] = useState<NextTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const volumeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshTokenIfNeeded = useCallback(async () => {
    const match = document.cookie.match(
      new RegExp(`${COOKIE_EXPIRES_AT}=(\\d+)`),
    );
    if (!match) return;
    const expiresAt = parseInt(match[1], 10);
    if (Date.now() > expiresAt - REFRESH_BUFFER_MS) {
      await fetch("/api/auth/refresh");
    }
  }, []);

  const fetchNowPlaying = useCallback(async () => {
    await refreshTokenIfNeeded();
    const [nowRes, queueRes] = await Promise.all([
      fetch("/api/now-playing"),
      fetch("/api/queue"),
    ]);

    if (nowRes.status === 401) {
      window.location.href = "/api/auth/login";
      return;
    }
    if (nowRes.ok) {
      const data = await nowRes.json();
      if (!data.error) {
        if (data.track === null) {
          setTrack(null);
          setIsPlaying(false);
        } else {
          setTrack(data);
          setIsPlaying(data.isPlaying);
          if (data.volumePercent !== null) setVolume(data.volumePercent);
        }
      }
    }

    if (queueRes.ok) {
      const queueData = await queueRes.json();
      setNextTrack(queueData.next ?? null);
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

  const handleVolumeChange = (_: Event, value: number | number[]) => {
    const pct = Array.isArray(value) ? value[0] : value;
    setVolume(pct);
    if (volumeDebounceRef.current) clearTimeout(volumeDebounceRef.current);
    volumeDebounceRef.current = setTimeout(() => {
      fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "volume", value: pct }),
      });
    }, 200);
  };

  if (loading) {
    return (
      <div className={styles.root}>
        <p className={styles.idle}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.main}>
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

        <div className={styles.volumeRow}>
          <VolumeDownIcon className={styles.volumeIcon} />
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            min={0}
            max={100}
            aria-label="Volume"
            className={styles.volumeSlider}
            sx={{
              color: "#1db954",
              "& .MuiSlider-thumb": {
                width: 28,
                height: 28,
              },
              "& .MuiSlider-rail": {
                opacity: 0.3,
              },
            }}
          />
          <VolumeUpIcon className={styles.volumeIcon} />
        </div>
      </div>

      {nextTrack && (
        <div className={styles.nextUp}>
          <span className={styles.nextUpLabel}>Next up</span>
          <div className={styles.nextUpArtWrapper}>
            {nextTrack.albumArt ? (
              <Image
                src={nextTrack.albumArt}
                alt=""
                fill
                className={styles.nextUpArt}
                unoptimized
              />
            ) : (
              <div className={styles.nextUpArtPlaceholder} />
            )}
          </div>
          <span className={styles.nextUpTrack}>{nextTrack.name}</span>
          <span className={styles.nextUpArtist}>{nextTrack.artist}</span>
        </div>
      )}
    </div>
  );
}
