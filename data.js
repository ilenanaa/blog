/* ==========================================================================
   data.js
   C'est le SEUL fichier à modifier pour gérer le contenu du blog.
   - Pour ajouter un article : copie un objet dans POSTS et modifie-le.
   - Pour changer ta bio ou tes liens : modifie BIO et SOCIAL_LINKS.
   ========================================================================== */

const SITE_NAME = "ilénana";

const BIO = "to define is to limit.\n -oscar wilde";

const SOCIAL_LINKS = {
  spotify: "https://open.spotify.com/user/aobi10zsrxxujl5b85a9gakip?si=2f8f35c0ad074580",
  instagram: "https://instagram.com",
  pinterest: "https://pin.it/7cIN6G0Yz",
  substack: "https://substack.com",
};

/*
  Champs de chaque article :
  - id            : identifiant unique, sans espace (ex: "brat-ascension")
  - title         : titre affiché
  - category      : étiquette affichée en vert (ex: "ENGLISH", "FRANÇAIS")
  - image         : URL de l'image de couverture
  - date          : format "AAAA-MM-JJ"
  - content       : le texte complet de l'article (les sauts de ligne sont conservés)
*/
const POSTS = [
  {
    id: "tu-es-bizarre",
    title: `"t'es trop bizarre, t'es folle !"`,
    category: "FRANCAIS",
    image: "images/tu-es-bizarre.jpg",
    date: "2026-04-29",
    content: "text/tu-es-bizarre.txt",
    initalLikes: 0,
  },
  {
    id: "ai-destroyed-my-childhood-dream",
    title: "AI destroyed my childhood dream",
    category: "ENGLISH",
    image: "images/ai-destroyed-my-childhood-dream.jpg",
    date: "2026-01-29",
    content: "text/ai-destroyed-my-childhood-dream.txt",
    initalLikes: 0,
  },
  {
    id: "brat-ascension",
    title: "a BRAT ascension and the fall of a \"brat\"",
    category: "ENGLISH",
    image: "images/brat-ascension.jpg",
    date: "2026-01-28",
    content: "text/brat-ascension.txt",
    initalLikes: 0,
  },
  {
    id: "today-was-a-heavy-day",
    title: "today was a heavy day.",
    category: "ENGLISH",
    image: "images/today-was-a-heavy-day.jpg",
    date: "2025-10-14",
    content: "text/today-was-a-heavy-day.txt",
    initalLikes: 0,
  },
  {
    id: "question-mark",
    title: "*question mark*",
    category: "ENGLISH",
    image: "images/question-mark.jpg",
    date: "2025-06-28",
    content: "text/question-mark.txt",
    initalLikes: 0,
  },
  {
    id: "i-hated-spring",
    title: "i hated spring",
    category: "ENGLISH",
    image: "images/i-hated-spring.jpg",
    date: "2023-10-08",
    content: "text/i-hated-spring.txt",
    initalLikes: 0,
  },
  {
    id: "my-definition",
    title: "my definition",
    category: "ENGLISH",
    image: "images/my-definition.jpg",
    date: "2023-05-29",
    content: "text/my-definition.txt",
    initalLikes: 0,
  }
];
