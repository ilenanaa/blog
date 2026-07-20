/* ==========================================================================
   script.js
   Logique partagée par toutes les pages. Tu n'as normalement pas besoin d'y
   toucher : pour ajouter du contenu, modifie plutôt data.js.

   Les likes et les commentaires sont maintenant stockés dans Supabase
   (base de données partagée entre tous les visiteurs), configuré dans
   supabase-config.js.
   ========================================================================== */

// ---------- Client Supabase ----------
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- Icônes SVG (inline, pour ne dépendre d'aucune librairie) ----------
const ICONS = {
  heart: (filled) => `<svg class="icon" viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z"/></svg>`,
  comment: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>`,
  music: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  instagram: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4a4 4 0 1 1-7.9-1.1 4 4 0 0 1 7.9 1.1Z"/><path d="M17.5 6.5h.01"/></svg>`,
  pin: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L9 18"/></svg>`,
  book: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>`,
};

// ---------- Utilitaires ----------
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Identité anonyme du visiteur (juste pour éviter les doubles likes) ----------
function getVisitorId() {
  let id = localStorage.getItem("blog_visitor_id");
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem("blog_visitor_id", id);
  }
  return id;
}

// ---------- Appels Supabase : commentaires ----------
async function fetchComments(postId) {
  const { data, error } = await sb
    .from("comments")
    .select("pseudo, text, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Erreur de chargement des commentaires :", error.message);
    return [];
  }
  return data;
}

async function addComment(postId, pseudo, text) {
  const { error } = await sb.from("comments").insert({ post_id: postId, pseudo, text });
  if (error) {
    console.error("Erreur d'envoi du commentaire :", error.message);
    return false;
  }
  return true;
}

// ---------- Appels Supabase : likes ----------
async function hasLiked(postId) {
  const { data, error } = await sb
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("visitor_id", getVisitorId())
    .maybeSingle();
  if (error) {
    console.error("Erreur de vérification du like :", error.message);
    return false;
  }
  return !!data;
}

async function toggleLike(postId) {
  const visitorId = getVisitorId();
  const already = await hasLiked(postId);
  if (already) {
    const { error } = await sb.from("likes").delete().eq("post_id", postId).eq("visitor_id", visitorId);
    if (error) console.error("Erreur de suppression du like :", error.message);
    return false;
  }
  const { error } = await sb.from("likes").insert({ post_id: postId, visitor_id: visitorId });
  if (error) console.error("Erreur d'ajout du like :", error.message);
  return true;
}

async function fetchLikeCount(postId) {
  const { count, error } = await sb
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (error) {
    console.error("Erreur de comptage des likes :", error.message);
    return 0;
  }
  return count || 0;
}

// Récupère en une seule fois les compteurs de tous les articles (pour la grille d'accueil)
async function fetchAllCounts() {
  const [{ data: comments, error: cErr }, { data: likes, error: lErr }] = await Promise.all([
    sb.from("comments").select("post_id"),
    sb.from("likes").select("post_id"),
  ]);
  if (cErr) console.error("Erreur de comptage des commentaires :", cErr.message);
  if (lErr) console.error("Erreur de comptage des likes :", lErr.message);

  const commentCounts = {};
  (comments || []).forEach((c) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });

  const likeCounts = {};
  (likes || []).forEach((l) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });

  return { commentCounts, likeCounts };
}

// ---------- Rendu : réseaux sociaux ----------
function socialRowHtml() {
  const items = [
    { icon: ICONS.music, label: "Spotify", url: SOCIAL_LINKS.spotify },
    { icon: ICONS.instagram, label: "Instagram", url: SOCIAL_LINKS.instagram },
    { icon: ICONS.pin, label: "Pinterest", url: SOCIAL_LINKS.pinterest },
    { icon: ICONS.book, label: "Substack", url: SOCIAL_LINKS.substack },
  ];
  return items
    .map((i) => `<a href="${i.url}" target="_blank" rel="noreferrer">${i.icon}<span>${i.label}</span></a>`)
    .join("");
}

// ---------- Rendu : navbar ----------
function renderNavbar(active) {
  const el = document.getElementById("navbar");
  if (!el) return;
  el.innerHTML = `
    <a href="index.html" class="nav-logo">${SITE_NAME}</a>
    <div class="nav-links">
      <a href="index.html" class="${active === "home" ? "active" : ""}">accueil</a>
      <a href="about.html" class="${active === "about" ? "active" : ""}">à propos</a>
    </div>
  `;
}

// ---------- Page accueil ----------
async function renderHome() {
  const grid = document.getElementById("posts-grid");
  if (!grid) return;

  // Affiche d'abord la grille avec les compteurs de base, pendant le chargement Supabase
  grid.innerHTML = POSTS.map((post) => postCardHtml(post, post.initialLikes, 0)).join("");

  const { commentCounts, likeCounts } = await fetchAllCounts();

  grid.innerHTML = POSTS.map((post) => {
    const likeCount = post.initialLikes + (likeCounts[post.id] || 0);
    const commentCount = commentCounts[post.id] || 0;
    return postCardHtml(post, likeCount, commentCount);
  }).join("");

  const footer = document.getElementById("footer-social");
  if (footer) footer.innerHTML = socialRowHtml();
}

function postCardHtml(post, likeCount, commentCount) {
  return `
    <a class="post-card" href="article.html?id=${encodeURIComponent(post.id)}">
      <img class="post-card-img" src="${post.image}" alt="" loading="lazy" />
      <div class="post-card-overlay"></div>
      <div class="post-meta">
        <div class="name">${SITE_NAME}</div>
        <div class="date">${formatDate(post.date)}</div>
      </div>
      <div class="post-body">
        <span class="post-tag">${escapeHtml(post.category)}</span>
        <h2 class="post-title serif-italic">${escapeHtml(post.title)}</h2>
        <hr class="divider" />
        <div class="post-footer">
          <div class="comments">${ICONS.comment} ${commentCount}</div>
          <div class="likes">${likeCount} ${ICONS.heart(likeCount > 0)}</div>
        </div>
      </div>
    </a>
  `;
}

// ---------- Page à propos ----------
function renderAbout() {
  const bioEl = document.getElementById("about-bio");
  if (!bioEl) return;
  bioEl.textContent = BIO;
  document.getElementById("about-social").innerHTML = socialRowHtml();
}

// ---------- Chargement du contenu d'article depuis un fichier .txt ----------
// Si post.content se termine par ".txt", le texte est chargé depuis ce fichier.
// Sinon (texte écrit directement dans data.js), il est utilisé tel quel.
async function loadArticleContent(content) {
  if (typeof content !== "string") return "";
  if (content.endsWith(".txt") && typeof fetch === "function") {
    try {
      const response = await fetch(content);
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // Fallback silencieux si le fichier ne peut pas être chargé
    }
  }
  return content;
}

// ---------- Page article ----------
async function renderArticle() {
  const container = document.getElementById("article-container");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const post = POSTS.find((p) => p.id === id);

  if (!post) {
    container.innerHTML = `<p style="color:#9a9a92;">article introuvable. <a href="index.html" style="color:#8fae8b;">retour à l'accueil</a></p>`;
    return;
  }

  document.title = `${post.title} — ${SITE_NAME}`;

  const articleText = await loadArticleContent(post.content);

  container.innerHTML = `
    <button class="back-link" onclick="window.location.href='index.html'">← retour</button>
    <div class="article-cover"><img src="${post.image}" alt="" /></div>
    <span class="post-tag">${escapeHtml(post.category)}</span>
    <h1 class="serif-italic">${escapeHtml(post.title)}</h1>
    <div class="article-date">${SITE_NAME} · ${formatDate(post.date)}</div>
    <hr class="divider" />
    <p class="article-content">${escapeHtml(articleText)}</p>
    <div class="article-actions">
      <button id="like-btn" class="like-btn" disabled>${ICONS.heart(false)} <span>…</span></button>
      <div class="comment-count-display">${ICONS.comment} <span id="comment-count-top">…</span></div>
    </div>
    <hr class="divider" />
    <div style="margin-top:28px;">
      <div class="comments-label">COMMENTAIRES</div>
      <div id="comments-list"><div class="comment-empty">chargement...</div></div>
      <div class="comment-form">
        <input id="comment-pseudo" type="text" placeholder="ton pseudo" maxlength="30" />
        <textarea id="comment-text" placeholder="écrire un commentaire..."></textarea>
        <div id="comment-error" class="comment-error"></div>
        <button id="comment-submit">envoyer</button>
      </div>
    </div>
  `;

  await refreshArticleState(post);
  document.getElementById("like-btn").disabled = false;

  document.getElementById("like-btn").addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    await toggleLike(post.id);
    await refreshArticleState(post);
    document.getElementById("like-btn").disabled = false;
  });

  document.getElementById("comment-submit").addEventListener("click", async () => {
    const pseudo = document.getElementById("comment-pseudo").value.trim();
    const text = document.getElementById("comment-text").value.trim();
    const errorEl = document.getElementById("comment-error");
    const submitBtn = document.getElementById("comment-submit");

    if (!pseudo) { errorEl.textContent = "entre un pseudo pour commenter."; return; }
    if (!text) { errorEl.textContent = "écris un commentaire avant d'envoyer."; return; }

    errorEl.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "envoi...";

    const ok = await addComment(post.id, pseudo, text);
    if (!ok) errorEl.textContent = "l'envoi a échoué, réessaie dans un instant.";
    else document.getElementById("comment-text").value = "";

    submitBtn.disabled = false;
    submitBtn.textContent = "envoyer";
    await refreshArticleState(post);
  });
}

async function refreshArticleState(post) {
  const [liked, likeCount, comments] = await Promise.all([
    hasLiked(post.id),
    fetchLikeCount(post.id),
    fetchComments(post.id),
  ]);

  const likeBtn = document.getElementById("like-btn");
  likeBtn.classList.toggle("liked", liked);
  likeBtn.innerHTML = `${ICONS.heart(liked)} <span>${post.initialLikes + likeCount}</span>`;

  document.getElementById("comment-count-top").textContent = comments.length;

  const list = document.getElementById("comments-list");
  if (comments.length === 0) {
    list.innerHTML = `<div class="comment-empty">aucun commentaire pour l'instant. sois la première voix.</div>`;
  } else {
    list.innerHTML = comments
      .map(
        (c) => `
        <div class="comment-item">
          <div class="who">${escapeHtml(c.pseudo)} <span class="when">${formatDate(c.created_at)}</span></div>
          <div class="text">${escapeHtml(c.text)}</div>
        </div>
      `
      )
      .join("");
  }
}

// ---------- Initialisation ----------
document.addEventListener("DOMContentLoaded", () => {
  renderHome();
  renderAbout();
  renderArticle();
});
