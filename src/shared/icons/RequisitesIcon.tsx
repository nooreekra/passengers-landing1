export default function RequisitesIcon({ stroke }: { stroke: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M3 7V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V7M3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7M3 7H21M8 11H16M8 15H12"
                stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path
                d="M6 3V7M18 3V7"
                stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}
