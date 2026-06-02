"use client";

import createGlobe from "cobe";
import { useEffect, useEffectEvent, useRef } from "react";
import { useSpring } from "react-spring";

export const Globe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const widthRef = useRef(0);

  const [{ r }, api] = useSpring(() => ({
    r: 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 40,
      precision: 0.001,
    },
  }));

  const handleResize = useEffectEvent(() => {
    if (canvasRef.current) {
      widthRef.current = canvasRef.current.offsetWidth;
    }
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: useEffectEvent should not be in deps
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 3,
      mapSamples: 16000,
      mapBrightness: 1.2,
      baseColor: [1, 1, 1],
      markerColor: [251 / 255, 100 / 255, 21 / 255],
      glowColor: [1.2, 1.2, 1.2],
      offset: [0, 0],
      markers: [
        { location: [1.3521, 103.8198], size: 0.1 }, // Singapore
      ],
      onRender: (state) => {
        state.phi = 2.9 + r.get();
        state.width = widthRef.current * 2;
        state.height = widthRef.current * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative mx-auto aspect-[2/1] w-full max-w-2xl">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        style={{
          contain: "layout paint size",
          mask: "radial-gradient(circle at 50% 50%, rgb(0, 0, 0) 60%, rgb(0, 0, 0, 0) 70%)",
          WebkitMask:
            "radial-gradient(circle at 50% 50%, rgb(0, 0, 0) 60%, rgb(0, 0, 0, 0) 70%)",
        }}
        onPointerDown={(e) => {
          pointerInteracting.current =
            e.clientX - pointerInteractionMovement.current;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = "grabbing";
          }
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = "grab";
          }
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = "grab";
          }
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            api.start({
              r: delta / 200,
            });
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            api.start({
              r: delta / 100,
            });
          }
        }}
      />
    </div>
  );
};
