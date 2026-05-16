export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

/** 8 questions ordered by purchase intent (highest first). */
export const faq: FaqItem[] = [
  {
    id: 'install',
    question: 'Comment installer DeckPad sur mon PC et ma tablette ?',
    answer:
      'Tu télécharges l’exécutable signé pour Windows depuis la page de téléchargement et tu le lances une fois. Le serveur se loge en arrière-plan et affiche un code PIN. Sur ta tablette, tu ouvres deckpad.app dans Chrome, tu ajoutes l’icône à l’écran d’accueil, tu saisis l’adresse IP de ton PC et le code PIN. La connexion est établie en quelques secondes.',
  },
  {
    id: 'offline',
    question: 'DeckPad fonctionne-t-il sans connexion Internet ?',
    answer:
      'Oui, intégralement. DeckPad ne dépend d’aucun serveur distant. Tablette et PC communiquent directement via ton réseau WiFi local, ou via câble USB en mode tethering. Une fois la PWA installée sur la tablette, plus aucun accès Internet n’est requis pour utiliser l’application.',
  },
  {
    id: 'latency',
    question: 'Quelle est la latence réelle en WiFi et en USB ?',
    answer:
      'En WiFi 5 GHz sur un réseau local sain, la latence aller-retour mesurée en ping-pong WebSocket reste sous 30 ms — soit imperceptible pour piloter une souris ou déclencher un raccourci. En USB, elle descend typiquement sous 10 ms, comparable à un périphérique filaire.',
  },
  {
    id: 'privacy',
    question: 'Mes données ou mes frappes clavier sortent-elles de mon réseau local ?',
    answer:
      'Non. DeckPad n’envoie aucune donnée vers Internet. Aucune analytique, aucune télémétrie, aucune connexion sortante. Le serveur Windows ne dialogue qu’avec les clients explicitement appairés via PIN sur ton réseau local. Le code source est ouvert et vérifiable.',
  },
  {
    id: 'compat',
    question: 'Quelles versions de Windows et d’Android sont compatibles ?',
    answer:
      'Côté PC : Windows 10 version 1909 et Windows 11, en 64 bits. Côté tablette : Android 9 (Pie) ou supérieur, avec un navigateur Chromium récent (Chrome, Edge, Brave). iPad et iOS ne sont pas officiellement pris en charge sur cette version.',
  },
  {
    id: 'custom',
    question: 'Puis-je personnaliser les boutons et créer mes propres raccourcis ?',
    answer:
      'Oui. Chaque bouton du deck peut être assigné à une action native : ouverture d’application, raccourci clavier Windows, contrôle média, lecture d’un son local. Les configurations sont enregistrées dans un fichier JSON, modifiable à la main ou via l’interface de réglages.',
  },
  {
    id: 'perf',
    question: 'Le streaming d’écran consomme-t-il beaucoup de ressources CPU ?',
    answer:
      'Le streaming utilise un encodage JPEG progressif adapté à la bande passante disponible. Sur une machine équipée d’un Core i5 ou Ryzen 5 récent, la capture en 720p à 60 fps reste sous 6 % d’utilisation CPU. Tu peux baisser la qualité à 480p pour les configurations modestes.',
  },
  {
    id: 'price',
    question: 'DeckPad est-il vraiment gratuit, et le restera-t-il ?',
    answer:
      'Oui. DeckPad est publié sous licence MIT — gratuit, libre de modification, sans achat intégré, sans abonnement, sans version Pro payante. Le projet est financé par son auteur et par d’éventuels dons. Aucun changement de modèle économique n’est prévu.',
  },
];
