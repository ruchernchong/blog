import type { ReactNode } from "react";
import { OG_COLOURS, OG_CORAL_GRADIENT } from "../colours";
import { OG_CONFIG } from "../config";

interface LayoutProps {
  children: ReactNode;
  showBranding?: boolean;
}

/**
 * Base layout wrapper for OG images
 *
 * Provides coral gradient background, white content card, and site branding
 */
export function Layout({ children, showBranding = true }: LayoutProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 60,
        background: OG_CORAL_GRADIENT,
        fontFamily: OG_CONFIG.fontFamily,
      }}
    >
      {/* Content card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 48,
          background: OG_COLOURS.primaryForeground,
          borderRadius: OG_CONFIG.borderRadius * 2,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {children}
      </div>

      {/* Site branding */}
      {showBranding && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <span
            style={{
              color: OG_COLOURS.primaryForeground,
              fontSize: 24,
              fontWeight: 600,
              opacity: 0.9,
            }}
          >
            {OG_CONFIG.siteUrl}
          </span>
        </div>
      )}
    </div>
  );
}
