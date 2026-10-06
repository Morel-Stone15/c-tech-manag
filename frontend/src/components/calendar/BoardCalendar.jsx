import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, MapPin, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

const CATEGORIES = ['Conférence', 'Atelier', 'Hackathon', 'Formation', 'Rencontre', 'Compétition'];
const catColor = { Conférence: 'primary', Atelier: 'cyan', Hackathon: 'violet', Formation: 'emerald', Rencontre: 'amber', Compétition: 'rose' };

export function BoardCalendar({ user, showToast }) {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', event_date: '', event_time: '09:00', location: 'Campus', category: 'Conférence'
  });

  function load() {
    api.getCalendar().then(d => setEvents(Array.isArray(d) ? d : [])).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.addCalendarEvent({ ...form, operator: user?.first_name || 'Bureau' });
      showToast('Événement créé avec succès', 'success');
      setModalOpen(false);
      setForm({ title: '', description: '', event_date: '', event_time: '09:00', location: 'Campus', category: 'Conférence' });
      load();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la création de l\'événement.', 'error');
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Supprimer l'événement "${title}" ?`)) return;
    try {
      await api.deleteCalendarEvent(id, user?.first_name || 'Bureau');
      showToast('Événement supprimé', 'success');
      load();
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    }
  }

  // Sort events by date
  const sorted = [...events].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  return (
    <>
      {modalOpen && (
        <Modal title="Créer un Événement / Atelier" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Titre de l'Événement</label>
              <input className="form-input" placeholder="Ex: Hackathon AI 2026" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Programme, objectifs et prérequis..." value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 90 }} />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.event_date}
                  onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Heure</label>
                <input type="time" className="form-input" value={form.event_time}
                  onChange={e => setForm(p => ({ ...p, event_time: e.target.value }))} />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Lieu / Salle</label>
                <input className="form-input" placeholder="Ex: Amphithéâtre A" value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select className="form-select" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
              <button className="btn btn-primary" type="submit">Enregistrer l'Événement</button>
            </div>
          </form>
        </Modal>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            <Calendar size={24} style={{ color: 'var(--accent-primary-light)' }} />
            Calendrier des Événements
          </h1>
          <p className="page-subtitle">Planification des ateliers, conférences et hackathons</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Nouvel Événement
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state card" style={{ padding: 48 }}>
          <Calendar size={40} />
          <h3>Aucun événement planifié</h3>
          <p>Créez le premier événement du club pour qu'il apparaisse dans le calendrier.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Créer un événement
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-5)'
        }}>
          {sorted.map(ev => (
            <div key={ev.id} className="card">
              <div className="card-header">
                <span className={`badge badge-${catColor[ev.category] || 'primary'}`}>{ev.category}</span>
                <button className="btn btn-danger btn-icon sm" onClick={() => handleDelete(ev.id, ev.title)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="card-body">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{ev.title}</h3>
                {ev.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    {ev.description}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} />
                    <strong style={{ color: 'var(--text-secondary)' }}>{ev.event_date}</strong>
                    {ev.event_time && ` à ${ev.event_time}`}
                  </div>
                  {ev.location && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={12} /> {ev.location}
                    </div>
                  )}
                  {ev.participant_count > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--accent-emerald)' }}>
                      👥 {ev.participant_count} participant(s)
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
