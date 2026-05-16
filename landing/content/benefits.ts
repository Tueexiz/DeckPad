import type { LucideIcon } from 'lucide-react';
import { Gamepad2, Zap, Aperture } from 'lucide-react';

export type Benefit = {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Optional micro stat surfaced under the card. */
  stat?: { value: string; label: string };
};

export const benefits: Benefit[] = [
  {
    icon: Gamepad2,
    title: 'Contrôle absolu',
    body: 'Souris, clavier, audio, médias, stream écran. Tout transite par ton réseau local — aucun cloud, aucune télémétrie.',
    stat: { value: '7', label: 'modules natifs' },
  },
  {
    icon: Zap,
    title: 'Latence minimale',
    body: 'Pipeline WebSocket optimisé. Réponse sous 30 ms en WiFi 5 GHz. Mode USB disponible pour la précision absolue.',
    stat: { value: '< 30 ms', label: 'WiFi 5 GHz' },
  },
  {
    icon: Aperture,
    title: 'Précision Stream Deck',
    body: 'Interface 3D inspirée des decks pro. Boutons assignables, raccourcis Windows, soundboard intégrée.',
    stat: { value: '32', label: 'boutons configurables' },
  },
];
