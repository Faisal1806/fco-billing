
import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    {...props}
    data-ai-logo
  >
    <g>
      <path
        d="M50,5A45,45,0,1,1,5,50,45,45,0,0,1,50,5M50,0a50,50,0,1,0,50,50A50,50,0,0,0,50,0Z"
        fill="currentColor"
      />
      <text
        x="50%"
        y="75%"
        fontFamily="Arial, sans-serif"
        fontSize="60"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="black"
      >
        F
      </text>
    </g>
  </svg>
);
