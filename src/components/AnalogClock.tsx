/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface AnalogClockProps {
  timeZone: string; // e.g. 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'
  label: string; // e.g. 'Eastern (EST)', 'Central (CST)'
  subLabel?: string; // e.g. 'New York / Atlanta / Miami'
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'blue';
  showDigitalSubtitle?: boolean;
}

export default function AnalogClock({
  timeZone,
  label,
  subLabel,
  size = 'md',
  variant = 'light',
  showDigitalSubtitle = true
}: AnalogClockProps) {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute timezone-adjusted date parts
  const getTimeInZone = (date: Date, tz: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: tz,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(date);
      let hours = 0;
      let minutes = 0;
      let seconds = 0;

      parts.forEach(p => {
        if (p.type === 'hour') hours = parseInt(p.value, 10);
        if (p.type === 'minute') minutes = parseInt(p.value, 10);
        if (p.type === 'second') seconds = parseInt(p.value, 10);
      });

      // Also get formatted 12-hr string
      const options12: Intl.DateTimeFormatOptions = {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const formatted12 = new Intl.DateTimeFormat('en-US', options12).format(date);

      return { hours, minutes, seconds, formatted12 };
    } catch {
      return {
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        formatted12: date.toLocaleTimeString()
      };
    }
  };

  const { hours, minutes, seconds, formatted12 } = getTimeInZone(time, timeZone);

  // Compute angles in degrees
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = ((minutes + seconds / 60) / 60) * 360;
  const hourAngle = (((hours % 12) + minutes / 60 + seconds / 3600) / 12) * 360;

  // Sizing configurations
  const sizeMap = {
    sm: { diameter: 72, radius: 36, cx: 36, cy: 36, strokeScale: 0.75 },
    md: { diameter: 100, radius: 50, cx: 50, cy: 50, strokeScale: 1.0 },
    lg: { diameter: 140, radius: 70, cx: 70, cy: 70, strokeScale: 1.3 },
    xl: { diameter: 180, radius: 90, cx: 90, cy: 90, strokeScale: 1.6 }
  };

  const currentSize = sizeMap[size];
  const { cx, cy, radius } = currentSize;

  // Theme variant styles
  const isDark = variant === 'dark';
  const isBlue = variant === 'blue';

  const dialBg = isDark
    ? '#0f172a'
    : isBlue
    ? '#0284c7'
    : '#ffffff';

  const dialBorder = isDark
    ? '#334155'
    : isBlue
    ? '#38bdf8'
    : '#cbd5e1';

  const hourTickColor = isDark ? '#94a3b8' : isBlue ? '#ffffff' : '#334155';
  const minuteTickColor = isDark ? '#475569' : isBlue ? '#bae6fd' : '#94a3b8';
  const hourHandColor = isDark ? '#f8fafc' : isBlue ? '#ffffff' : '#0f172a';
  const minuteHandColor = isDark ? '#cbd5e1' : isBlue ? '#e0f2fe' : '#475569';
  const secondHandColor = '#ef4444'; // classic vibrant red second hand
  const centerPinColor = isDark ? '#f8fafc' : isBlue ? '#ffffff' : '#0f172a';

  // 12 ticks and 60 minute pips
  const hourMarkers = Array.from({ length: 12 }, (_, i) => i * 30);
  const minuteMarkers = Array.from({ length: 60 }, (_, i) => i * 6).filter(deg => deg % 30 !== 0);

  return (
    <div className="flex flex-col items-center select-none text-center">
      {/* Analog Wall Clock Dial */}
      <div
        className="relative flex items-center justify-center rounded-full transition-transform hover:scale-105 duration-200"
        style={{
          width: currentSize.diameter,
          height: currentSize.diameter,
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.05)'
            : '0 8px 20px -4px rgba(14, 116, 144, 0.15), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.8)'
        }}
      >
        <svg
          width={currentSize.diameter}
          height={currentSize.diameter}
          viewBox={`0 0 ${currentSize.diameter} ${currentSize.diameter}`}
          className="overflow-visible"
        >
          <defs>
            {/* Outer Bezel Rim Gradient */}
            <linearGradient id={`bezel-grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDark ? '#475569' : isBlue ? '#0369a1' : '#e2e8f0'} />
              <stop offset="50%" stopColor={isDark ? '#1e293b' : isBlue ? '#0284c7' : '#ffffff'} />
              <stop offset="100%" stopColor={isDark ? '#0f172a' : isBlue ? '#075985' : '#cbd5e1'} />
            </linearGradient>

            {/* Inner Dial Shadow */}
            <radialGradient id={`dial-grad-${label}`} cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor={dialBg} />
              <stop offset="100%" stopColor={isDark ? '#090d16' : isBlue ? '#0369a1' : '#f1f5f9'} />
            </radialGradient>
          </defs>

          {/* Outer Bezel Rim */}
          <circle
            cx={cx}
            cy={cy}
            r={radius - 1}
            fill={`url(#bezel-grad-${label})`}
            stroke={dialBorder}
            strokeWidth={2}
          />

          {/* Clock Dial Face */}
          <circle
            cx={cx}
            cy={cy}
            r={radius - 4}
            fill={`url(#dial-grad-${label})`}
          />

          {/* Subtle Inner Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius - 8}
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
            strokeWidth={1}
          />

          {/* 60 Minute Tick Marks (No numbers, pure classic analog markers) */}
          {minuteMarkers.map((deg, idx) => (
            <line
              key={`min-${idx}`}
              x1={cx}
              y1={cy - radius + 5}
              x2={cx}
              y2={cy - radius + 7.5}
              stroke={minuteTickColor}
              strokeWidth={0.75}
              strokeLinecap="round"
              transform={`rotate(${deg} ${cx} ${cy})`}
            />
          ))}

          {/* 12 Main Hour Markers (Bold classic ticks at 12, 3, 6, 9, and other hours) */}
          {hourMarkers.map((deg, idx) => {
            const isCardinal = deg % 90 === 0;
            return (
              <line
                key={`hr-${idx}`}
                x1={cx}
                y1={cy - radius + 5}
                x2={cx}
                y2={cy - radius + (isCardinal ? 12 : 9.5)}
                stroke={hourTickColor}
                strokeWidth={isCardinal ? 2.5 : 1.5}
                strokeLinecap="round"
                transform={`rotate(${deg} ${cx} ${cy})`}
              />
            );
          })}

          {/* Hour Hand */}
          <line
            x1={cx}
            y1={cy + 4}
            x2={cx}
            y2={cy - radius * 0.52}
            stroke={hourHandColor}
            strokeWidth={3}
            strokeLinecap="round"
            transform={`rotate(${hourAngle} ${cx} ${cy})`}
            style={{
              filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.3))',
              transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
            }}
          />

          {/* Minute Hand */}
          <line
            x1={cx}
            y1={cy + 6}
            x2={cx}
            y2={cy - radius * 0.76}
            stroke={minuteHandColor}
            strokeWidth={2}
            strokeLinecap="round"
            transform={`rotate(${minuteAngle} ${cx} ${cy})`}
            style={{
              filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.3))',
              transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
            }}
          />

          {/* Second Hand (Vibrant Red with Counterweight) */}
          <g
            transform={`rotate(${secondAngle} ${cx} ${cy})`}
            style={{ filter: 'drop-shadow(0 1px 2px rgba(239, 68, 68, 0.4))' }}
          >
            {/* Long needle */}
            <line
              x1={cx}
              y1={cy + radius * 0.22}
              x2={cx}
              y2={cy - radius * 0.85}
              stroke={secondHandColor}
              strokeWidth={1.2}
              strokeLinecap="round"
            />
            {/* Counterweight circle */}
            <circle
              cx={cx}
              cy={cy + radius * 0.12}
              r={2}
              fill={secondHandColor}
            />
          </g>

          {/* Center Pin & Metallic Bevel */}
          <circle
            cx={cx}
            cy={cy}
            r={3.5}
            fill={centerPinColor}
            stroke={secondHandColor}
            strokeWidth={1}
          />
          <circle
            cx={cx}
            cy={cy}
            r={1.2}
            fill={secondHandColor}
          />
        </svg>
      </div>

      {/* Clock Label & Timezone Title */}
      <div className="mt-2.5 space-y-0.5">
        <div className="text-xs font-black tracking-tight text-slate-800 flex items-center justify-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{label}</span>
        </div>

        {subLabel && (
          <div className="text-[10px] font-medium text-slate-400 truncate max-w-[130px]">
            {subLabel}
          </div>
        )}

        {showDigitalSubtitle && (
          <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md bg-blue-50 border border-blue-100 text-[11px] font-mono font-bold text-blue-700 shadow-2xs">
            {formatted12}
          </div>
        )}
      </div>
    </div>
  );
}
