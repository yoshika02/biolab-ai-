interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "success" | "warning" | "error";
}

const badgeClasses = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-900",
    error: "bg-rose-100 text-rose-800",
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[variant]} ${className}`} {...props} />
    );
}
