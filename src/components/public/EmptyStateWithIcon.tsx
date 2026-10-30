"use client";

import { Camera, Film as FilmIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";

interface EmptyStateWithIconProps {
  type: "camera" | "film";
  title: string;
  description: string;
}

export function EmptyStateWithIcon({
  type,
  title,
  description,
}: EmptyStateWithIconProps) {
  const Icon = type === "camera" ? Camera : FilmIcon;

  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={description}
    />
  );
}
