/** Verifiable credibility signals — no fabricated logos or quotes. */
export type Metric = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  note: string;
};

export const metrics: Metric[] = [
  {
    value: 30,
    prefix: '< ',
    suffix: ' ms',
    label: 'Latence WiFi 5 GHz',
    note: 'Mesurée en ping-pong WebSocket sur réseau local.',
  },
  {
    value: 60,
    suffix: ' fps',
    label: 'Streaming d’écran adaptatif',
    note: 'JPEG progressif, qualité ajustée à la bande passante.',
  },
  {
    value: 0,
    suffix: ' ko',
    label: 'Envoyés vers Internet',
    note: 'Tout transite par ton réseau local. Aucune télémétrie.',
  },
];
