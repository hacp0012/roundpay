import React, { useEffect, useState } from "react";
import { cn } from "../ui/cn";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

interface MemberAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  textClassName?: string;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ src, name, className, textClassName }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;

  if (!showImage) {
    return (
      <div
        className={cn(
          "rounded-full bg-action text-white flex items-center justify-center font-sora font-bold shrink-0",
          className,
        )}
        aria-hidden="true"
      >
        <span className={cn("text-[11px]", textClassName)}>{initials(name)}</span>
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt={name}
      onError={() => setFailed(true)}
      className={cn("rounded-full object-cover shrink-0", className)}
    />
  );
};
