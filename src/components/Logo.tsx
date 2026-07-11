import logo from "@/assets/sriviswa-logo.jpg.asset.json";

export function Logo({ size = 40, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo.url}
        alt="Sri Viswa Group of Institutions"
        width={size}
        height={size}
        className="rounded-md bg-white p-0.5 shadow-sm"
        style={{ height: size, width: size, objectFit: "contain" }}
      />
      {showText && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">SRI VISWA</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">
            Group of Institutions
          </div>
        </div>
      )}
    </div>
  );
}
