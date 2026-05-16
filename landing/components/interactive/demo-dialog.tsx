'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { fr } from '@/lib/copy/fr';

type Props = {
  trigger: ReactNode;
};

export function DemoDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-play on open, pause on close (browser permitting)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.play().catch(() => {
        /* autoplay blocked: user can press play */
      });
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="text-eyebrow">{fr.demo.eyebrow}</p>
          <DialogTitle>{fr.demo.dialogTitle}</DialogTitle>
          <DialogDescription>{fr.demo.lead}</DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[var(--color-hairline-strong)] bg-black">
          {videoError ? (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <p className="text-[14px] text-[var(--color-platinum-400)]">
                {fr.demo.fallback}
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              controls
              playsInline
              muted
              preload="none"
              poster="/deckpad-hero-poster.webp"
              onError={() => setVideoError(true)}
              aria-label="Démonstration vidéo de DeckPad"
            >
              <source src="/deckpad-demo.webm" type="video/webm" />
              <source src="/deckpad-demo.mp4" type="video/mp4" />
            </video>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
