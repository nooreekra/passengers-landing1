interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input = ({ error, className, ...props }: InputProps) => (
    <div className="flex flex-col gap-1 relative">
        <input
            {...props}
            className={`bg-white w-full h-14 rounded-xl border px-4 outline-none ${
                error ? "border-red-500" : "border-border-default"
            } ${className ?? ""}`}
        />
        {error && <span className="text-xs text-red-500 absolute -bottom-4">{error}</span>}
    </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

export const Textarea = ({ error, className, ...props }: TextareaProps) => (
    <div className="flex flex-col gap-1 relative">
    <textarea
        {...props}
        className={`w-full rounded-xl border p-4 outline-none resize-none ${
            error ? "border-red-500" : "border-border-default"
        } ${className ?? ""}`}
    />
        {error && <span className="text-xs text-red-500 absolute -bottom-4">{error}</span>}
    </div>
);
