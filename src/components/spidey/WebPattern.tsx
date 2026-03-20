import React from 'react';

const WebPattern: React.FC = () => {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="web" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          <circle cx="100" cy="100" r="3" fill="currentColor" />
          <line x1="100" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="100" x2="170" y2="30" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="100" x2="170" y2="170" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="100" x2="100" y2="200" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="100" x2="30" y2="170" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="100" x2="0" y2="100" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="100" x2="30" y2="30" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#web)" />
    </svg>
  );
};

export default WebPattern;
