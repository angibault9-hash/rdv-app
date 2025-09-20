// Initialisation Supabase avec les clés de config.js
const supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const msg = document.getElementById('msg');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const signupLink = document.getElementById('signup-link');
const signupSection = document.getElementById('signup-section');

// Vérifier si déjà connecté → rediriger vers dashboard
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
  }
})();

// Gestion du menu déroulant pour l'inscription
if (signupLink && signupSection) {
  signupLink.addEventListener('click', () => {
    if (signupSection.style.display === 'none') {
      signupSection.style.display = 'block';
      signupLink.textContent = 'Masquer le formulaire d\'inscription';
    } else {
      signupSection.style.display = 'none';
      signupLink.textContent = 'Créer un compte';
    }
  });
}

// Connexion
if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      msg.textContent = `❌ Erreur connexion: ${error.message}`;
    } else {
      window.location.href = 'dashboard.html';
    }
  });
}

// Inscription
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      msg.textContent = `❌ Erreur inscription: ${error.message}`;
    } else {
      msg.textContent = `✅ Compte créé. Vérifie tes emails si la confirmation est activée.`;
      // Masquer le formulaire d'inscription après création réussie
      if (signupSection) {
        signupSection.style.display = 'none';
        signupLink.textContent = 'Créer un compte';
      }
    }
  });
}