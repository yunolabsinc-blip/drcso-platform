import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md";
  href?: string;
}

export default function Logo({ size = "md", href = "/" }: LogoProps) {
  const iconSize = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const textSize = size === "sm" ? "text-lg" : "text-2xl";

  const content = (
    <span className="inline-flex items-center gap-2">
      <span className={`flex ${iconSize} items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 text-white font-extrabold tracking-tight shadow-sm`}>
        Dr.
      </span>
      <span className={`${textSize} font-extrabold tracking-tight`}>
        <span className="text-primary">Dr.</span>
        <span className="text-gray-900">CSO</span>
      </span>
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
