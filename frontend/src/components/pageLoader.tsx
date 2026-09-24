import { useState, useEffect } from "react";
import type { ReactNode } from "react";

interface loadingProps{
  loading: boolean,
  children: ReactNode,
}

export default function PageLoader({ loading, children }: loadingProps) {
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      const contentTimer = setTimeout(() => setIsContentVisible(true), 350);
      const overlayTimer = setTimeout(() => setIsOverlayVisible(false), 1300);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(overlayTimer);
      };
    } else {
      setIsOverlayVisible(true);
      setIsContentVisible(false);
    }
  }, [loading]);

  return (
    <div className="page-container">
      {/* 1. L'overlay de chargement */}
      {isOverlayVisible && (
        <div className={`loader-overlay ${!loading ? "fade-out" : ""}`}>
          <div className="spinner"></div>
        </div>
      )}

      {/* 2. Le contenu de la page */}
      <main className={`page-content ${isContentVisible ? "visible" : ""}`}>
        {children}
      </main>
    </div>
  );
}
