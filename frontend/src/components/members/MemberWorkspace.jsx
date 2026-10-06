import { useState, useEffect } from 'react';
import {
  CreditCard, Activity, MessageSquare, Download, FileText, CalendarRange
} from 'lucide-react';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';
import { VirtualCard } from './VirtualCard';
import { DiscussionView } from '../discussion/DiscussionView';
import { Avatar } from '../common/Avatar';

export function MemberWorkspace({ user, showToast }) {
  // Support both `user` and legacy `member` prop
  const member = user;
  const [page, setPage] = useState('card');
  const [attendance, setAttendance] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!member?.id) return;
    api.getAttendance(member.id).then(d => setAttendance(Array.isArray(d) ? d : [])).catch(() => {});
    api.getCalendar().then(d => setEvents(Array.isArray(d) ? d : [])).catch(() => {});
  }, [member?.id]);

  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 200);
  }

  const navItems = [
    { id: 'card',       icon: CreditCard,    label: 'Ma Carte Virtuelle' },
    { id: 'discussion', icon: MessageSquare,  label: 'Communauté Tech' },
    { id: 'events',     icon: CalendarRange,  label: 'Événements & Ateliers' },
    { id: 'attendance', icon: Activity,       label: 'Mes Présences' },
  ];

  if (!member) return null;

  return (
    <>
      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`tab ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Welcome header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="flex items-center gap-4">
          <Avatar member={member} size="lg" />
          <div>
            <h1 className="page-title">Bienvenue, {member.first_name} ! 👋</h1>
            <p className="page-subtitle">
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary-light)' }}>
                {member.member_number}
              </span>
              {' · '}{member.major} · {member.level}
            </p>
          </div>
        </div>
      </div>

      {/* Content panels */}
      {page === 'card' && (
        <div style={{ maxWidth: 460 }}>
          <VirtualCard member={member} />
          <div className="flex gap-3" style={{ marginTop: 'var(--space-5)' }}>
            <button
              className="btn btn-primary"
              onClick={() => triggerDownload(api.getCardPdfUrl(member.id), `Carte_C-TECH_${member.member_number}.pdf`)}
            >
              <Download size={16} /> Télécharger PDF
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => triggerDownload(api.getCardPngUrl(member.id), `Carte_C-TECH_${member.member_number}.png`)}
            >
              <FileText size={16} /> Image PNG
            </button>
          </div>
        </div>
      )}

      {page === 'discussion' && (
        <DiscussionView member={member} showToast={showToast} />
      )}

      {page === 'events' && (
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <CalendarRange size={16} style={{ color: 'var(--accent-emerald)' }} />
              Événements à Venir
            </div>
            <span className="badge badge-emerald">{events.length}</span>
          </div>
          <div className="card-body">
            {events.length === 0 ? (
              <div className="empty-state">
                <CalendarRange size={36} />
                <h3>Aucun événement</h3>
                <p>Aucun événement planifié pour le moment.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {events.map(ev => (
                  <div key={ev.id} className="card">
                    <div className="card-body">
                      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{ev.title}</h3>
                        <span className="badge badge-emerald">{ev.category}</span>
                      </div>
                      {ev.description && (
                        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                          {ev.description}
                        </p>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>📅 {ev.event_date} {ev.event_time && `à ${ev.event_time}`}</span>
                        {ev.location && <span>📍 {ev.location}</span>}
                        {ev.participant_count > 0 && <span>👥 {ev.participant_count} participant(s)</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {page === 'attendance' && (
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <Activity size={16} style={{ color: 'var(--accent-cyan)' }} />
              Historique de Présence
            </div>
            <span className="badge badge-cyan">{attendance.length} pointage(s)</span>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Événement</th>
                  <th>Date & Heure du Pointage</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={2}>
                      <div className="empty-state">
                        <Activity size={32} />
                        <h3>Aucune présence</h3>
                        <p>Aucun pointage enregistré pour le moment.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  attendance.map(att => (
                    <tr key={att.id}>
                      <td><strong>{att.event_name}</strong></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(att.scanned_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
