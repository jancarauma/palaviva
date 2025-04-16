"use client";

import { motion } from 'framer-motion';

export const CircularProgress = ({
  value,
  className,
  strokeWidth = 2,
}: {
  value: number;
  className?: string;
  strokeWidth?: number;
}) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = value / 100;

  return (
    <svg className={className} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        strokeWidth={strokeWidth}
        className="stroke-current text-gray-200 dark:text-gray-700"
        fill="none"
      />
      <motion.circle
        cx="50"
        cy="50"
        r={radius}
        strokeWidth={strokeWidth}
        className="stroke-current"
        fill="none"
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{
          strokeDashoffset: circumference * (1 - progress),
          transition: { duration: 1 }
        }}
        strokeDasharray={circumference}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
};