"use client";

import Image from "next/image";
import AddIcon from "@mui/icons-material/Add";
import styles from "./page.module.scss";

interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfilePicker({ profiles }: { profiles: Profile[] }) {
  const handleSelect = (id: string) => {
    window.location.href = `/api/auth/login?profile=${id}`;
  };

  const handleAdd = () => {
    window.location.href = "/api/auth/login?register=true";
  };

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>Who&apos;s listening?</h1>
      <div className={styles.grid}>
        {profiles.map((profile) => (
          <button
            key={profile.id}
            className={styles.card}
            onClick={() => handleSelect(profile.id)}
          >
            <div className={styles.avatar}>
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  fill
                  className={styles.avatarImg}
                  unoptimized
                />
              ) : (
                <span className={styles.initials}>{initials(profile.name)}</span>
              )}
            </div>
            <span className={styles.name}>{profile.name}</span>
          </button>
        ))}

        <button className={styles.card} onClick={handleAdd}>
          <div className={`${styles.avatar} ${styles.addAvatar}`}>
            <AddIcon sx={{ fontSize: 40, color: "#535353" }} />
          </div>
          <span className={`${styles.name} ${styles.addName}`}>Add profile</span>
        </button>
      </div>
    </div>
  );
}
