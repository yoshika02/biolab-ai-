interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
}

const variantClasses = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-500",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-teal-400",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
    return (
        <button
            className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${variantClasses[variant]} ${className}`}
            {...props}
        />
    );
}
