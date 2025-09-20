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

// Fonctions utilitaires pour les messages
function showMessage(text, type = 'error') {
  formMsg.textContent = text;
  formMsg.className = `message ${type}`;
  formMsg.style.display = 'block';
}

function hideMessage() {
  formMsg.style.display = 'none';
  formMsg.className = 'message';
}

// Récupérer et afficher la liste des rendez-vous
async function refreshList() {
  listBody.innerHTML = '<tr><td colspan="5">🔄 Chargement…</td></tr>';

  try {
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      listBody.innerHTML = `<tr><td colspan="5">❌ Erreur: ${error.message}</td></tr>`;
      return;
    }

    listBody.innerHTML = '';
    
    if (data.length === 0) {
      listBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666; padding: 2rem;">📅 Aucun rendez-vous planifié</td></tr>';
      return;
    }

    for (const row of data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDT(row.start_time)}</td>
        <td>${formatDT(row.end_time)}</td>
        <td><span class="status-badge">${row.status || 'Planifié'}</span></td>
        <td>${row.notes || '<em style="color: #999;">Aucune note</em>'}</td>
        <td>
          <button onclick="del(${row.id})" class="btn-danger">
            🗑️ Supprimer
          </button>
        </td>
      `;
      listBody.appendChild(tr);
    }
  } catch (err) {
    listBody.innerHTML = `<tr><td colspan="5">❌ Erreur inattendue: ${err.message}</td></tr>`;
    console.error('Erreur lors du chargement des rendez-vous:', err);
  }
}

// Formatage date/heure lisible
function formatDT(iso) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { 
    dateStyle: 'short', 
    timeStyle: 'short' 
  });
}

// Déconnexion
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await supabaseClient.auth.signOut();
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Rediriger quand même en cas d'erreur
      window.location.href = 'index.html';
    }
  });
}

// Ajout d'un rendez-vous
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    
    const startVal = document.getElementById('start').value;
    const durationMin = parseInt(document.getElementById('duration').value, 10);
    const notes = document.getElementById('notes').value.trim();

    // Validation des données
    if (!startVal) {
      showMessage('Veuillez sélectionner une date et heure de début.', 'error');
      return;
    }

    if (!durationMin || durationMin < 5) {
      showMessage('La duree doit etre d\'au moins 5 minutes.', 'error');
      return;
    }

    const start = new Date(startVal);
    const now = new Date();
    
    if (start <= now) {
      showMessage('La date de début doit être dans le futur.', 'error');
      return;
    }

    const end = new Date(start.getTime() + durationMin * 60000);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        showMessage('Session expirée. Veuillez vous reconnecter.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
      }

      const { error } = await supabaseClient
        .from('appointments')
        .insert({
          user_id: userId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          notes: notes || null,
          status: 'Planifié'
        });

      if (error) {
        showMessage(`Erreur lors de l'ajout: ${error.message}`, 'error');
      } else {
        form.reset();
        document.getElementById('duration').value = 30;
        showMessage('✅ Rendez-vous ajouté avec succès !', 'success');
        await refreshList();
      }
    } catch (err) {
      showMessage('Une erreur inattendue s\'est produite.', 'error');
      console.error('Erreur lors de l\'ajout du rendez-vous:', err);
    }
  });
}

// Suppression d'un rendez-vous
async function del(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      alert('❌ Erreur lors de la suppression: ' + error.message);
    } else {
      await refreshList();
    }
  } catch (err) {
    alert('❌ Erreur inattendue lors de la suppression.');
    console.error('Erreur lors de la suppression:', err);
  }
}

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