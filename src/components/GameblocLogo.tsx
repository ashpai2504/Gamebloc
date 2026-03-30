"use client";

import Image from "next/image";
import { useState } from "react";
import { GAMEBLOC_LOGO_PNG } from "@/lib/gamebloc-logo-path";

const FALLBACK_SRC = "/images/logo.svg";

/** Large local PNGs can break the default optimizer; `unoptimized` serves the file as-is. */
const variantClass = {
  navbar:
    "h-10 sm:h-11 w-auto max-w-[15rem] sm:max-w-[17rem] object-contain object-left scale-[1.14]",
  auth:
    "h-13 sm:h-15 w-auto max-w-[19rem] sm:max-w-[21rem] object-contain object-center scale-[1.08] mx-auto",
  footer:
    "h-7 w-auto max-w-[9rem] object-contain object-left mix-blend-multiply scale-[1.06] opacity-95",
} as const;

interface GameblocLogoProps {
  variant?: keyof typeof variantClass;
  className?: string;
}

export default function GameblocLogo({
  variant = "navbar",
  className = "",
}: GameblocLogoProps) {
  const [src, setSrc] = useState(GAMEBLOC_LOGO_PNG);
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span
        className={`font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent ${className}`}
      >
        Gamebloc
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center overflow-hidden ${
        variant === "auth" ? "justify-center" : "justify-start"
      } ${className}`}
      aria-label="Gamebloc"
    >
      <Image
        key={src}
        src={src}
        alt="Gamebloc"
        width={520}
        height={140}
        className={variantClass[variant]}
        unoptimized
        priority={variant === "navbar"}
        onError={() => {
          if (src === GAMEBLOC_LOGO_PNG) {
            setSrc(FALLBACK_SRC);
          } else {
            setBroken(true);
          }
        }}
      />
    </span>
  );
}
