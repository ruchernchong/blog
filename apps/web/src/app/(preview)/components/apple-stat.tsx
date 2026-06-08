interface AppleStatProps {
  value: string | number;
  label: string;
  large?: boolean;
}

export function AppleStat({ value, label, large = true }: AppleStatProps) {
  return (
    <div>
      <div
        className={`font-semibold tabular-nums leading-none tracking-tighter ${large ? "text-5xl" : "text-2xl"}`}
      >
        {value}
      </div>
      <div className="mt-1.5 text-muted text-sm">{label}</div>
    </div>
  );
}
