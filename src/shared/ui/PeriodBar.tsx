type PeriodBarProps = {
    from: string;
    to: string;
};

const PeriodBar = ({ from, to }: PeriodBarProps) => {
    const getPeriodProgress = (from: string, to: string): number => {
        const start = new Date(from).getTime();
        const end = new Date(to).getTime();
        const now = Date.now();

        if (now <= start) return 0;
        if (now >= end) return 100;

        return ((now - start) / (end - start)) * 100;
    };

    const progress = getPeriodProgress(from, to);

    return (
        <div className="flex flex-col space-y-2">
            <div className="w-full h-1.5 bg-gray-200 rounded overflow-hidden">
                <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex flex-col gap-2 text-sm text-black leading-snug">
                <div>from {new Date(from).toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
                <div>till {new Date(to).toLocaleDateString("en-US", { dateStyle: "medium" })}</div>
            </div>
        </div>
    );
};

export default PeriodBar;