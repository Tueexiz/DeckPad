/**
 * Source of truth for all French copy.
 * Tone: autoritaire, sobre, luxe français.
 * Rules: pas d'exclamation, verbes courts, pas d'anglicismes non techniques,
 * pas d'urgence factice, max 1 adjectif par phrase.
 */
export const fr = {
  brand: {
    name: 'DeckPad',
    tagline: 'Ton PC. Ta tablette. Un geste.',
    city: 'Paris',
    version: 'v1.0.0',
  },

  nav: {
    links: [
      { label: 'Fonctionnalités', href: '#fonctionnalites' },
      { label: 'Démo', href: '#demo' },
      { label: 'FAQ', href: '#faq' },
    ],
    cta: 'Télécharger',
    ctaHref: '#telechargement',
    skip: 'Aller au contenu principal',
  },

  hero: {
    eyebrow: 'Édition 2026 · Fait à Paris',
    h1Words: ['Ton', 'PC.', 'Ta', 'tablette.', 'Un', 'geste.'],
    subline:
      'DeckPad transforme ta tablette Android en télécommande de précision pour Windows. Latence sous 30 ms.',
    ctaPrimary: 'Télécharger DeckPad',
    ctaPrimaryHref: '#telechargement',
    ctaSecondary: 'Voir la démo',
    trust: [
      { label: 'Gratuit' },
      { label: 'Sans compte' },
      { label: '100 % local' },
      { label: 'Open source' },
    ],
  },

  benefits: {
    eyebrow: 'Ce qui fait la différence',
    heading: 'Trois principes. Aucun compromis.',
    lead: 'Une télécommande qui ne te trahit pas — pas de cloud, pas de latence, pas de friction.',
  },

  socialProof: {
    eyebrow: 'Pile technique',
    heading: 'Construit sur des fondations vérifiables.',
    techBadges: [
      { label: 'WebSocket' },
      { label: 'Windows 10/11' },
      { label: 'Android 9+' },
      { label: 'WiFi & USB' },
      { label: 'Licence MIT' },
    ],
    metrics: [
      {
        value: 30,
        suffix: ' ms',
        prefix: '< ',
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
    ],
  },

  platforms: {
    eyebrow: 'Comment ça marche',
    heading: 'Deux composants. Une seule expérience.',
    tabs: [
      {
        value: 'windows',
        label: 'Serveur Windows',
        title: 'Un service léger sur ton PC',
        body: 'Le serveur DeckPad ouvre un canal WebSocket chiffré sur ton réseau local et expose les contrôles : entrée souris-clavier, audio par application, capture d’écran, médias actifs.',
        bullets: [
          'Installation par exécutable signé',
          'Démarrage automatique en arrière-plan',
          'Compatible Windows 10 et Windows 11',
        ],
      },
      {
        value: 'android',
        label: 'Client Android',
        title: 'Une PWA qui se comporte comme une app',
        body: 'Le client Android est une Progressive Web App. Aucune installation depuis le Play Store : tu ajoutes simplement DeckPad à ton écran d’accueil et tu te connectes via WiFi ou USB.',
        bullets: [
          'Compatible Android 9 et supérieur',
          'Interface 3D inspirée du Stream Deck',
          'Connexion WiFi locale ou tethering USB',
        ],
      },
    ],
  },

  savings: {
    eyebrow: 'Calculateur',
    heading: 'Combien tu économises.',
    lead: 'Compare ton parc Stream Deck équivalent au coût réel de DeckPad — qui est de zéro.',
    deviceLabel: 'Postes équipés',
    tierLabel: 'Modèle équivalent',
    tiers: [
      { value: 'mini', label: 'Stream Deck Mini', price: 99 },
      { value: 'mk2', label: 'Stream Deck MK.2', price: 169 },
      { value: 'plus', label: 'Stream Deck +', price: 249 },
      { value: 'xl', label: 'Stream Deck XL', price: 279 },
    ],
    youPay: 'Tu paies aujourd’hui',
    deckpadCost: 'Coût DeckPad',
    saved: 'Tu économises',
    note: 'Prix indicatifs constatés en 2025. DeckPad reste gratuit.',
  },

  demo: {
    eyebrow: 'Démonstration',
    heading: 'Trente secondes pour comprendre.',
    lead: 'Voir DeckPad piloter Windows en temps réel — sans son, sans cloud.',
    openLabel: 'Voir la démo',
    dialogTitle: 'Démonstration DeckPad',
    dialogClose: 'Fermer',
    fallback:
      'La vidéo de démonstration n’est pas encore disponible. Reviens dans quelques jours.',
  },

  waitlist: {
    eyebrow: 'Accès anticipé',
    heading: 'Rejoins la première vague.',
    lead: 'Reçois la version 1.0 dès sa publication. Un email, jamais plus.',
    steps: [
      { label: 'Email' },
      { label: 'Usage' },
      { label: 'Confirmation' },
    ],
    step1: {
      title: 'Ton adresse email',
      emailLabel: 'Adresse email',
      emailPlaceholder: 'toi@exemple.fr',
      emailError: 'Adresse email invalide.',
      consentLabel:
        'J’accepte de recevoir un email de notification au lancement de DeckPad. Aucune autre utilisation.',
      consentError: 'Le consentement est requis.',
      next: 'Continuer',
    },
    step2: {
      title: 'Comment vas-tu utiliser DeckPad ?',
      options: [
        { value: 'gaming', label: 'Gaming et streaming en direct' },
        { value: 'streaming', label: 'Production média et podcast' },
        { value: 'productivity', label: 'Productivité et raccourcis pro' },
        { value: 'other', label: 'Autre usage' },
      ],
      back: 'Retour',
      next: 'Continuer',
    },
    step3: {
      title: 'Confirmation',
      labelEmail: 'Email',
      labelUsecase: 'Usage',
      back: 'Retour',
      submit: 'Je rejoins la liste',
    },
    submitting: 'Envoi en cours…',
    success: {
      title: 'Inscription confirmée.',
      body: 'Tu recevras un email de DeckPad au moment du lancement. À très vite.',
      reset: 'Inscrire une autre adresse',
    },
    error: {
      title: 'Une erreur est survenue.',
      body: 'Vérifie ta connexion et réessaie. Si le problème persiste, écris-nous.',
      retry: 'Réessayer',
    },
    toastSuccess: 'Inscription confirmée',
    toastError: 'Inscription échouée',
  },

  faq: {
    eyebrow: 'Questions fréquentes',
    heading: 'Tout ce qu’il faut savoir.',
    lead: 'Huit questions, huit réponses. Pas de promesses creuses.',
    searchPlaceholder: 'Filtrer les questions…',
    empty:
      'Aucune réponse ne correspond. Pose ta question à support@deckpad.app.',
  },

  latency: {
    eyebrow: 'Mesure en direct',
    heading: 'La latence, en temps réel.',
    lead: 'Simulation d’un ping aller-retour entre tablette et PC. Représentatif d’un réseau WiFi 5 GHz sain.',
    tablet: 'Tablette',
    pc: 'PC',
    live: 'Mesure',
    pingNow: 'Lancer un ping',
    best: 'Meilleur',
    avg: 'Moyenne',
    worst: 'Pire',
    jitter: 'Gigue',
    histogram: '8 dernières mesures',
    reset: 'Réinitialiser',
    note: 'Simulation côté navigateur. Les valeurs réelles dépendent de ton réseau.',
  },

  cmd: {
    title: 'Palette de commandes',
    description: 'Recherche et navigation rapides au clavier.',
    placeholder: 'Tape une commande ou une section…',
    searchShort: 'Rechercher',
    openLabel: 'Ouvrir la palette de commandes',
    empty: 'Aucune commande ne correspond.',
    groups: {
      navigation: 'Navigation',
      sections: 'Sections',
      actions: 'Actions',
      social: 'Liens',
    } as Record<'navigation' | 'sections' | 'actions' | 'social', string>,
    cmds: {
      top: 'Retour en haut',
      features: 'Voir les fonctionnalités',
      platforms: 'Composants Windows et Android',
      latency: 'Voir la latence en direct',
      savings: 'Calculer mes économies',
      download: 'Télécharger DeckPad',
      demo: 'Lancer la démo vidéo',
      faq: 'Lire la FAQ',
      github: 'Ouvrir GitHub',
      discord: 'Rejoindre Discord',
      twitter: 'Suivre sur Twitter / X',
    },
    hints: {
      scroll: 'Défile la page',
    },
    legend: {
      navigate: 'Naviguer',
      open: 'Ouvrir',
    },
  },

  compat: {
    eyebrow: 'Vérification automatique',
    heading: 'DeckPad fonctionne sur ton matériel ?',
    lead: 'Nous lisons les informations publiques de ton navigateur pour t’indiquer si DeckPad tournera chez toi.',
    label: 'Compatibilité',
    detecting: 'Analyse en cours…',
    verdicts: {
      compatible: 'Compatible',
      partial: 'Compatibilité partielle',
      incompatible: 'Non compatible',
      unknown: 'Détection limitée',
    } as Record<'compatible' | 'partial' | 'incompatible' | 'unknown', string>,
    fields: {
      os: 'Système',
      browser: 'Navigateur',
      role: 'Rôle',
    },
    roles: {
      server: 'Serveur DeckPad',
      client: 'Client DeckPad',
      none: 'Aucun rôle direct',
    },
    cta: {
      server: 'Télécharger pour Windows',
      client: 'Installer la PWA',
      none: 'Consulter la FAQ',
    },
  },

  footer: {
    columns: [
      {
        title: 'Produit',
        items: [
          { label: 'Téléchargement', href: '#telechargement' },
          { label: 'Fonctionnalités', href: '#fonctionnalites' },
          { label: 'Compatibilité', href: '#compatibilite' },
          { label: 'Roadmap', href: '#roadmap' },
        ],
      },
      {
        title: 'Ressources',
        items: [
          { label: 'Documentation', href: '#docs' },
          { label: 'GitHub', href: 'https://github.com/' },
          { label: 'Changelog', href: '#changelog' },
          { label: 'Statut', href: '#statut' },
        ],
      },
      {
        title: 'Légal',
        items: [
          { label: 'Mentions légales', href: '/mentions-legales' },
          { label: 'Confidentialité', href: '/confidentialite' },
          { label: 'CGU', href: '/cgu' },
          { label: 'Licences', href: '#licences' },
        ],
      },
      {
        title: 'Contact',
        items: [
          { label: 'support@deckpad.app', href: 'mailto:support@deckpad.app' },
          { label: 'Discord', href: '#discord' },
          { label: 'Twitter / X', href: '#twitter' },
        ],
      },
    ],
    legal:
      '© 2026 DeckPad · Conçu avec rigueur à Paris',
    version: 'v1.0.0',
  },
} as const;

export type Copy = typeof fr;
