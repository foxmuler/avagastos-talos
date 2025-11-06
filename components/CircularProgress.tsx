
import React from 'react';

interface CircularProgressProps {
    percentage: number;
    strokeWidth: number;
    size: number;
    color: string;
    children: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ percentage, strokeWidth, size, color, children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
            >
                {/* Background Circle */}
                <circle
                    stroke="rgba(255, 255, 255, 0.1)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Circle */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-white">
                {children}
            </div>
        </div>
    );
};

export default CircularProgress;