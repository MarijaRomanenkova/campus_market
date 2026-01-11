'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface LogoWithThemeProps {
  width?: number;
  height?: number;
  alt?: string;
  priority?: boolean;
}

const LogoWithTheme: React.FC<LogoWithThemeProps> = ({
  width = 36,
  height = 36,
  alt = 'Logo',
  priority = false,
}) => {
  const { theme } = useTheme();
  // Default state for server rendering - no inversion
  const [imageFilter, setImageFilter] = useState('');
  const [imageStyle, setImageStyle] = useState({});
  // Track if component is mounted to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  // Update state after component mounts on client side
  useEffect(() => {
    setMounted(true);
    const isDarkMode = theme === 'dark';
    setImageFilter(isDarkMode ? 'filter invert' : '');
    setImageStyle({ filter: isDarkMode ? 'invert(1)' : 'none' });
  }, [theme]);

  return (
    <Link href="/" className="flex-center">
      <Image
        src="/images/logo.svg"
        width={width}
        height={height}
        alt={alt}
        priority={priority}
        className={mounted ? imageFilter : ''}
        style={mounted ? imageStyle : {}}
      />
    </Link>
  );
};

export default LogoWithTheme; 
