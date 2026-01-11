import React from 'react';

interface DashboardHeaderProps {
  heading: string;
  text?: string;
}

/**
 * Dashboard Header Component
 * 
 * Renders a consistent header for dashboard pages with a heading and optional descriptive text.
 * 
 * @param {DashboardHeaderProps} props - Component properties
 * @returns {JSX.Element} The rendered dashboard header
 */
const DashboardHeader = ({ heading, text }: DashboardHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
      {text && <p className="text-muted-foreground mt-2">{text}</p>}
    </div>
  );
};

export default DashboardHeader; 
