
import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
        data-ai-logo
    >
        <path d="M17.4,13.26a4.42,4.42,0,0,1-1.57,3.31,4.48,4.48,0,0,1-3.83,1.43,3.41,3.41,0,0,1-1.39-.3,4,4,0,0,1-1.35-1,3.73,3.73,0,0,1-.8-1.51,5,5,0,0,1-.21-1.89A4.58,4.58,0,0,1,12.33,9a4.2,4.2,0,0,1,3.42.74,2.59,2.59,0,0,0,1.65.61,2.83,2.83,0,0,0,1.83-.71,0.22,0.22,0,0,1,.33.3,6.33,6.33,0,0,1-2.16,3.32Z" />
        <path d="M13.23,6.33a2.38,2.38,0,0,1,1.55-2.28,2.53,2.53,0,0,0-2.09,1,2.42,2.42,0,0,1-1.55,2.28,2.53,2.53,0,0,0,2.09-1Z" />
        <text x="11.5" y="15.5" fontFamily="sans-serif" fontSize="3.5" fontWeight="bold" textAnchor="middle" fill="white">F.Co</text>
    </svg>
);
