"use client";

import Image from "next/image";
import { useState } from "react";
import { GAMEBLOC_LOGO_PNG } from "@/lib/gamebloc-logo-path";

const FALLBACK_SRC = "/images/logo.svg";

/** Large local PNGs can break the default optimizer; `unoptimized` serves the file as-is. */
const variantClass = {
  navbar:
    "h-10 sm:h-11 w-auto max-w-[12rem] sm:max-w-[14rem] object-contain object-left",
  auth:
    "h-28 sm:h-32 w-auto max-w-[16rem] sm:max-w-[18rem] object-contain object-center mx-auto",
  footer:
    "h-8 w-auto max-w-[8rem] object-contain object-left opacity-90",
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
