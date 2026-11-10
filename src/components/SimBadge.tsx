import React from 'react';
import { SimChip } from '../ui/chrome';

/** Kept for call-sites; the chrome renders one global SIMULATION chip. */
export const SimBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`sr-only ${className}`}>
    <SimChip />
  </span>
);
