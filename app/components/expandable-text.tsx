import { useState } from "react";
import { cn } from "~/lib/utils";

interface ExpandableTextProps {
  text: string | null | undefined;
  fallback?: string;
  className?: string;
}

export function ExpandableText({
  text,
  fallback = "-",
  className,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <span
      className={cn(
        className,
        expanded ? "whitespace-pre-wrap" : "truncate block"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {text}
    </span>
  );
}
