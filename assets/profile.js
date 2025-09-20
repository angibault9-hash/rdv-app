// Profil (profile.html)
const supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const logoutBtn = document.getElementById('logout-btn');
const profileForm = document.getElementById('profile-form');
const fullNameInput = document.getElementById('full-name');
const profileMsg = document.getElementById('profile-msg');

function showMessage(text, type = 'error') {
  if (!profileMsg) return;
  profileMsg.textContent = text;
  profileMsg.className = `msg ${type}`;
  profileMsg.style.display = 'block';
}
function hideMessage() { if (profileMsg) { profileMsg.style.display = 'none'; profileMsg.className = 'msg'; } }

// Vérif session & chargement profil
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return window.location.href = 'index.html';

  const userId = session.user.id;
  const { data, error } = await supabaseClient.from('profiles').select('full_name').eq('id', userId).single();
  if (!error && data?.full_name) fullNameInput.value = data.full_name;
})();

// Logout
if (logoutBtn) logoutBtn.addEventListener('click', async () => { await supabaseClient.auth.signOut(); window.location.href = 'index.html'; });

// Sauvegarde profil
if (profileForm) profileForm.addEventListener('submit', async (e) => {
  e.preventDefault(); hideMessage();
  const full_name = fullNameInput.value.trim();
  const { data: { session } } = await supabaseClient.auth.getSession();
  const userId = session?.user?.id;
  const { error } = await supabaseClient
    .from('profiles')
    .upsert({ id: userId, full_name })
    .eq('id', userId);
  if (error) return showMessage('Erreur: ' + error.message);
  showMessage('Profil mis à jour ✅', 'success');
});
