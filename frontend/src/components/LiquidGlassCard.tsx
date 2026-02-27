"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Types
export interface LiquidGlassCardProps {
    children: React.ReactNode;
    className?: string;
    draggable?: boolean;
    expandable?: boolean;
    width?: string;
    height?: string;
    expandedWidth?: string;
    expandedHeight?: string;
    blurIntensity?: "sm" | "md" | "lg" | "xl";
    shadowIntensity?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
    borderRadius?: string;
    glowIntensity?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
}

// SVG Filter Component
export const GlassFilter: React.FC = () => (
    <svg style={{ display: "none" }}>
        <filter
            id="glass-distortion"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
        >
            <feTurbulence
                type="fractalNoise"
                baseFrequency="0.001 0.005"
                numOctaves="1"
                seed="17"
                result="turbulence"
            />
            <feComponentTransfer in="turbulence" result="mapped">
                <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
                <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
                <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
            </feComponentTransfer>
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feSpecularLighting
                in="softMap"
                surfaceScale="5"
                specularConstant="1"
                specularExponent="100"
                lightingColor="white"
                result="specLight"
            >
                <fePointLight x="-200" y="-200" z="300" />
            </feSpecularLighting>
            <feComposite
                in="specLight"
                operator="arithmetic"
                k1="0"
                k2="1"
                k3="1"
                k4="0"
                result="litImage"
            />
            <feDisplacementMap
                in="SourceGraphic"
                in2="softMap"
                scale="200"
                xChannelSelector="R"
                yChannelSelector="G"
            />
        </filter>
    </svg>
);

// Liquid Glass Card Component
export const LiquidGlassCard = ({
    children,
    className = "",
    draggable = true,
    expandable = false,
    width,
    height,
    expandedWidth,
    expandedHeight,
    blurIntensity = "xl",
    borderRadius = "32px",
    glowIntensity = "sm",
    shadowIntensity = "md",
    ...props
}: LiquidGlassCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggleExpansion = (e: any) => {
        if (!expandable) return;
        if (e.target.closest("a, button, input, select, textarea")) return;
        setIsExpanded(!isExpanded);
    };

    const blurClasses = {
        sm: "backdrop-blur-sm",
        md: "backdrop-blur-md",
        lg: "backdrop-blur-lg",
        xl: "backdrop-blur-xl",
    };

    const shadowStyles = {
        none: "inset 0 0 0 0 rgba(255, 255, 255, 0)",
        xs: "inset 1px 1px 1px 0 rgba(255, 255, 255, 0.3), inset -1px -1px 1px 0 rgba(255, 255, 255, 0.3)",
        sm: "inset 2px 2px 2px 0 rgba(255, 255, 255, 0.35), inset -2px -2px 2px 0 rgba(255, 255, 255, 0.35)",
        md: "inset 3px 3px 3px 0 rgba(255, 255, 255, 0.45), inset -3px -3px 3px 0 rgba(255, 255, 255, 0.45)",
        lg: "inset 4px 4px 4px 0 rgba(255, 255, 255, 0.5), inset -4px -4px 4px 0 rgba(255, 255, 255, 0.5)",
        xl: "inset 6px 6px 6px 0 rgba(255, 255, 255, 0.55), inset -6px -6px 6px 0 rgba(255, 255, 255, 0.55)",
    };

    const glowStyles = {
        none: "0 4px 4px rgba(0, 0, 0, 0.05), 0 0 12px rgba(0, 0, 0, 0.05)",
        xs: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 16px rgba(255, 255, 255, 0.05)",
        sm: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 24px rgba(255, 255, 255, 0.1)",
        md: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 32px rgba(255, 255, 255, 0.15)",
        lg: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 40px rgba(255, 255, 255, 0.2)",
        xl: "0 4px 4px rgba(0, 0, 0, 0.15), 0 0 12px rgba(0, 0, 0, 0.08), 0 0 48px rgba(255, 255, 255, 0.25)",
    };

    const containerVariants = {
        collapsed: {
            width: width || "auto",
            height: height || "auto",
            transition: {
                duration: 0.4,
                ease: [0.5, 1.5, 0.5, 1] as [number, number, number, number],
            },
        },
        expanded: {
            width: expandedWidth || "auto",
            height: expandedHeight || "auto",
            transition: {
                duration: 0.4,
                ease: [0.5, 1.5, 0.5, 1] as [number, number, number, number],
            },
        },
    };

    const MotionComponent = draggable || expandable ? motion.div : "div";

    const motionProps =
        draggable || expandable
            ? {
                variants: expandable ? containerVariants : undefined,
                animate: expandable ? (isExpanded ? "expanded" : "collapsed") : undefined,
                onClick: expandable ? handleToggleExpansion : undefined,
                drag: draggable,
                dragConstraints: draggable ? { left: 0, right: 0, top: 0, bottom: 0 } : undefined,
                dragElastic: draggable ? 0.3 : undefined,
                dragTransition: draggable
                    ? {
                        bounceStiffness: 300,
                        bounceDamping: 10,
                        power: 0.3,
                    }
                    : undefined,
                whileDrag: draggable ? { scale: 1.02 } : undefined,
                whileHover: { scale: 1.01 },
                whileTap: { scale: 0.98 },
            }
            : {};

    return (
        <>
            <svg className="hidden">
                <defs>
                    <filter
                        id="glass-blur"
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        filterUnits="objectBoundingBox"
                    >
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.003 0.007"
                            numOctaves="1"
                            result="turbulence"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="turbulence"
                            scale="20"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>
            <MotionComponent
                className={cn(
                    `relative ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${expandable ? "cursor-pointer" : ""
                    }`,
                    className
                )}
                style={{
                    borderRadius,
                    ...(width && !expandable && { width }),
                    ...(height && !expandable && { height }),
                }}
                {...motionProps}
                {...props}
            >
                <div
                    className={`absolute inset-0 ${blurClasses[blurIntensity]} z-0`}
                    style={{
                        borderRadius,
                        filter: "url(#glass-blur)",
                    }}
                />
                <div
                    className="absolute inset-0 z-10"
                    style={{
                        borderRadius,
                        boxShadow: glowStyles[glowIntensity],
                    }}
                />
                <div
                    className="absolute inset-0 z-20"
                    style={{
                        borderRadius,
                        boxShadow: shadowStyles[shadowIntensity],
                    }}
                />
                <div className={cn("relative z-30")}>{children}</div>
            </MotionComponent>
        </>
    );
};
