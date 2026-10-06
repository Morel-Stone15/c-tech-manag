import { useState, useEffect } from 'react';
import { Users, Activity, Layers, Calendar, ClipboardList, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';
import { Avatar } from '../common/Avatar';

export function BoardDashboard({ user, showToast }) {
  const [stats, setStats] = useState({ members: 0, attendance: 0, commissions: 0, events: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getMembers(),
      api.getAttendance(),
      api.getCommissions(),
      api.getCalendar(),
      api.getLogs()
    ]).then(([members, att, comms, cal, logs]) => {
      setStats({
        members: Array.isArray(members) ? members.length : 0,
        attendance: Array.isArray(att) ? att.length : 0,
        commissions: Array.isArray(comms) ? comms.length : 0,
        events: Array.isArray(cal) ? cal.length : 0,
      });
      setRecentLogs(Array.isArray(logs) ? logs.slice(0, 6) : []);
      setRecentMembers(Array.isArray(members) ? members.slice(0, 6) : []);
    }).catch(err => console.error(err));
  }, []);

  const statCards = [
    { label: 'Membres Actifs', value: stats.members, icon: <Users size={22} />, color: 'indigo' },
    { label: 'Présences', value: stats.attendance, icon: <Activity size={22} />, color: 'cyan' },
    { label: 'Commissions', value: stats.commissions, icon: <Layers size={22} />, color: 'violet' },
    { label: 'Événements', value: stats.events, icon: <Calendar size={22} />, color: 'emerald' },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            <TrendingUp size={24} style={{ color: 'var(--accent-primary-light)' }} />
            Tableau de Bord
          </h1>
          <p className="page-subtitle">
            Aperçu général de l'activité du Club C-TECH — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(sc => (
          <div className="stat-card" key={sc.label}>
            <div className={`stat-icon ${sc.color}`}>{sc.icon}</div>
            <div className="stat-content">
              <div className="stat-label">{sc.label}</div>
              <div className="stat-value">{sc.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="form-grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <Users size={16} style={{ color: 'var(--accent-primary-light)' }} />
              Derniers Membres Inscrits
            </div>
            <span className="badge badge-primary">{recentMembers.length}</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {recentMembers.map(m => (
              <div key={m.id} className="flex items-center gap-3" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <Avatar member={m} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.first_name} {m.last_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.major} · {m.level}</div>
                </div>
                <span className="badge badge-ghost" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{m.member_number}</span>
              </div>
            ))}
            {recentMembers.length === 0 && (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>Aucun membre inscrit</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <ClipboardList size={16} style={{ color: 'var(--accent-cyan)' }} />
              Journal d'Activité
            </div>
            <span className="badge badge-cyan">{recentLogs.length}</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {recentLogs.map(log => (
              <div key={log.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 13.5, marginBottom: 3, lineHeight: 1.4 }}>{log.action_description}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  Par <strong style={{ color: 'var(--accent-primary-light)' }}>{log.operator_name}</strong> · {fmt(log.timestamp)}
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
