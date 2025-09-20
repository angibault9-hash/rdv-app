// Initialisation Supabase avec les clés de config.js
const supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// Éléments du DOM
const msg = document.getElementById('msg');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Vérifier si déjà connecté → rediriger vers dashboard
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
  }
})();

// Gestion des onglets
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    // Retirer la classe active de tous les boutons et contenus
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Ajouter la classe active au bouton cliqué
    btn.classList.add('active');
    
    // Afficher le contenu correspondant
    const targetContent = document.getElementById(`${targetTab}-tab`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
    
    // Effacer les messages
    hideMessage();
  });
});

// Fonctions utilitaires pour les messages
function showMessage(text, type = 'error') {
  msg.textContent = text;
  msg.className = `msg ${type}`;
  msg.style.display = 'block';
}

function hideMessage() {
  msg.style.display = 'none';
  msg.className = 'msg';
}

// Connexion
if (signinForm) {
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!email || !password) {
      showMessage('Veuillez remplir tous les champs.', 'error');
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        showMessage(`Erreur de connexion: ${error.message}`, 'error');
      } else if (data?.user) {
        showMessage('Connexion réussie ! Redirection...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      }
    } catch (err) {
      showMessage('Une erreur inattendue s\'est produite.', 'error');
      console.error('Erreur de connexion:', err);
    }
  });
}

// Inscription
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;

    if (!email || !password || !passwordConfirm) {
      showMessage('Veuillez remplir tous les champs.', 'error');
      return;
    }

    if (password !== passwordConfirm) {
      showMessage('Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('Le mot de passe doit contenir au moins 6 caractères.', 'error');
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) {
        showMessage(`Erreur d'inscription: ${error.message}`, 'error');
      } else if (data?.user) {
        showMessage('Compte créé avec succès ! Vous pouvez maintenant vous connecter.', 'success');
        signupForm.reset();
        
        // Passer à l'onglet connexion après inscription réussie
        setTimeout(() => {
          document.querySelector('[data-tab="signin"]').click();
        }, 2000);
      }
    } catch (err) {
      showMessage('Une erreur inattendue s\'est produite.', 'error');
      console.error('Erreur d\'inscription:', err);
    }
  });
}