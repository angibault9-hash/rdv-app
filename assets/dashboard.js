const supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const logoutBtn = document.getElementById('logout-btn');
const listBody = document.querySelector('#list tbody');
const form = document.getElementById('new-appointment-form');
const formMsg = document.getElementById('form-msg');

// Vérifier la session utilisateur → sinon rediriger vers index
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  await refreshList();
})();

// Récupérer et afficher la liste des rendez-vous
async function refreshList() {
  listBody.innerHTML = '<tr><td colspan="5">Chargement…</td></tr>';

  const { data, error } = await supabaseClient
    .from('appointments')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    listBody.innerHTML = `<tr><td colspan="5">Erreur: ${error.message}</td></tr>`;
    return;
  }

  listBody.innerHTML = '';
  for (const row of data) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDT(row.start_time)}</td>
      <td>${formatDT(row.end_time)}</td>
      <td>${row.status}</td>
      <td>${row.notes ?? ''}</td>
      <td><button data-id="${row.id}" class="danger">Supprimer</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => del(row.id));
    listBody.appendChild(tr);
  }
}

// Formatage date/heure lisible
function formatDT(iso) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

// Déconnexion
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  });
}

// Ajout d’un rendez-vous
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const startVal = document.getElementById('start').value;
    const durationMin = parseInt(document.getElementById('duration').value, 10);
    const notes = document.getElementById('notes').value.trim();

    const start = new Date(startVal);
    const end = new Date(start.getTime() + durationMin * 60000);

    if (!(start instanceof Date) || isNaN(start)) {
      formMsg.textContent = 'Date de début invalide.';
      return;
    }
    if (end <= start) {
      formMsg.textContent = 'La fin doit être après le début.';
      return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    const userId = session?.user?.id;

    const { error } = await supabaseClient
      .from('appointments')
      .insert({
        user_id: userId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        notes
      });

    if (error) {
      formMsg.textContent = `Erreur: ${error.message}`;
    } else {
      form.reset();
      document.getElementById('duration').value = 30;
      formMsg.textContent = 'Rendez-vous ajouté ✅';
      await refreshList();
    }
  });
}

// Suppression d’un rendez-vous
async function del(id) {
  const { error } = await supabaseClient
    .from('appointments')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Erreur: ' + error.message);
  } else {
    await refreshList();
  }
}