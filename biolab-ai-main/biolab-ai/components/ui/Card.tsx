type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
    return (
        <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`} {...props} />
    );
}
