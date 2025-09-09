
import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    data-ai-logo
  >
    <path d="M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0 -20 0"></path>
    <path d="M14 12a2 2 0 1 0 -4 0v-2a2 2 0 1 0 4 0"></path>
  </svg>
);
