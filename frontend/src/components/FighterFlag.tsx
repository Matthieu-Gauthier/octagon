import { getFlagForHometown } from "@/lib/flags";

/**
 * Renders a country flag image for a fighter based on their hometown.
 * Returns null if no flag can be determined.
 */
export function FighterFlag({
  hometown,
  size = "sm",
}: {
  hometown?: string | null;
  size?: "sm" | "md";
}) {
  const code = getFlagForHometown(hometown);
  if (!code) return null;

  const dims = size === "md"
    ? "w-[28px] h-[20px]"
    : "w-[22px] h-[15px]";

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt=""
      className={`${dims} rounded-[2px] object-cover shadow-[0_1px_3px_rgba(0,0,0,0.5)] shrink-0`}
    />
  );
}
