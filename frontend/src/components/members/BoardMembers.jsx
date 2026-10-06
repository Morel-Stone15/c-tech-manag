import { useState, useEffect, useRef } from 'react';
import { Search, Download, Upload, FileText, RefreshCw, Mail, Trash2, Users } from 'lucide-react';
import { api } from '../../services/api';
import { ALL_FILIERES, ALL_NIVEAUX, fmt } from '../../constants/data';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';

export function BoardMembers({ user, showToast }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [notesModal, setNotesModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const fileRef = useRef(null);

  function load() {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (majorFilter) qs.set('major', majorFilter);
    if (levelFilter) qs.set('level', levelFilter);
    api.getMembers(qs.toString() ? `?${qs.toString()}` : '')
      .then(d => setMembers(Array.isArray(d) ? d : []))
      .catch(err => console.error(err));
  }

  useEffect(() => { load(); }, [search, majorFilter, levelFilter]);

  async function sendCardEmail(m) {
    showToast('Envoi de la carte en cours...', 'info');
    try {
      const res = await api.sendCardEmail(m.id, user?.first_name || 'Bureau');
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message || 'Erreur lors de l\'envoi email.', 'error');
    }
  }

  async function deleteMember(m) {
    if (!window.confirm(`Supprimer définitivement ${m.first_name} ${m.last_name} ?`)) return;
    try {
      await api.deleteMember(m.id, user?.first_name || 'Bureau');
      showToast('Membre supprimé avec succès', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Erreur de suppression.', 'error');
    }
  }

  async function resetPin(m) {
    if (!window.confirm(`Réinitialiser le PIN de ${m.first_name} ${m.last_name} ?`)) return;
    try {
      const res = await api.resetMemberPin(m.id, user?.first_name || 'Bureau');
      showToast(`Nouveau PIN temporaire : ${res.pin}`, 'success');
    } catch (err) {
      showToast(err.message || 'Erreur réinitialisation.', 'error');
    }
  }

  async function saveNotes() {
    try {
      await api.updateNotes(notesModal.id, noteText, user?.first_name || 'Bureau');
      showToast('Notes privées enregistrées', 'success');
      setNotesModal(null);
      load();
    } catch (err) {
      showToast('Erreur d\'enregistrement des notes.', 'error');
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('operator', user?.first_name || 'Bureau');
    try {
      const res = await api.importExcel(fd);
      showToast(res.message, 'success');
      load();
    } catch (err) {
      showToast('Erreur d\'importation Excel.', 'error');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  }

  const filieres = ['', ...ALL_FILIERES];
  const niveaux = ['', ...ALL_NIVEAUX];

  return (
    <>
      {notesModal && (
        <Modal
          title={`Notes privées — ${notesModal.first_name} ${notesModal.last_name}`}
          onClose={() => setNotesModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setNotesModal(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={saveNotes}>Enregistrer</button>
          </>}
        >
          <textarea
            className="form-textarea"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Notes privées (visibles uniquement par le bureau)..."
            style={{ minHeight: 140 }}
          />
        </Modal>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            <Users size={24} style={{ color: 'var(--accent-primary-light)' }} />
            Gestion des Membres
          </h1>
          <p className="page-subtitle">{members.length} membre(s) inscrit(s)</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={() => window.open('/api/export_excel')}>
            <Download size={15} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current.click()} disabled={importLoading}>
            <Upload size={15} /> {importLoading ? 'Importation...' : 'Importer Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      {/* Toolbar: Search + Filters */}
      <div className="toolbar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Rechercher nom, email, numéro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={majorFilter} onChange={e => setMajorFilter(e.target.value)}>
          {filieres.map(f => <option key={f} value={f}>{f || 'Toutes filières'}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          {niveaux.map(n => <option key={n} value={n}>{n || 'Tous niveaux'}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Membre</th>
              <th>N° Membre</th>
              <th>Filière / Niveau</th>
              <th>Contact</th>
              <th>Inscrit le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <Users size={32} />
                    <h3>Aucun membre trouvé</h3>
                    <p>Essayez de modifier vos filtres de recherche.</p>
                  </div>
                </td>
              </tr>
            ) : (
              members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar member={m} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{m.first_name} {m.last_name}</div>
                        {m.is_bureau && <span className="badge badge-violet" style={{ fontSize: 9.5 }}>Bureau</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary-light)', fontSize: 12.5, fontWeight: 700 }}>
                      {m.member_number}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      <span className="badge badge-primary">{m.major}</span>
                      <span className="badge badge-amber">{m.level}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{m.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.phone}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(m.created_at)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-icon sm" title="Notes privées" onClick={() => { setNotesModal(m); setNoteText(m.private_notes || ''); }}>
                        <FileText size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon sm" title="Réinitialiser PIN" onClick={() => resetPin(m)}>
                        <RefreshCw size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon sm" title="Envoyer carte par email" onClick={() => sendCardEmail(m)}>
                        <Mail size={14} />
                      </button>
                      {m.member_number !== 'CT-ADMIN' && (
                        <button className="btn btn-danger btn-icon sm" title="Supprimer" onClick={() => deleteMember(m)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
