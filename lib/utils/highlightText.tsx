import { Fragment } from "react";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightText({
  text,
  tokens,
  className,
}: {
  text: string;
  tokens: string[];
  className?: string;
}) {
  if (!text || !tokens.length) {
    return <span className={className}>{text}</span>;
  }

  const pattern = new RegExp(
    `(${tokens.map(escapeRegex).join("|")})`,
    "gi"
  );
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        tokens.some((t) => part.toLowerCase() === t.toLowerCase()) ? (
          <mark
            key={i}
            className="rounded-sm bg-store-accent/25 px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </span>
  );
}
