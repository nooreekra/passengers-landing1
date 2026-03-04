export default function HomeIcon({ stroke }: { stroke: string }) {
    return (
        <svg
            width="25"
            height="24"
            viewBox="0 0 25 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M8 17.0625H17M11.8046 3.21117L4.00457 8.48603C3.68802 8.7001 3.5 9.04666 3.5 9.41605V19.2882C3.5 20.2336 4.30589 21 5.3 21H19.7C20.6941 21 21.5 20.2336 21.5 19.2882V9.41605C21.5 9.04665 21.312 8.7001 20.9954 8.48603L13.1954 3.21117C12.7791 2.92961 12.2209 2.92961 11.8046 3.21117Z"
                stroke={stroke}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
