import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';

export function BoardLogs({ showToast }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.getLogs().then(d => setLogs(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><ClipboardList size={24} style={{ color: 'var(--accent-primary-light)' }} />Journaux d'Audit & Sécurité</h1>
          <p className="page-subtitle">Historique complet des actions administratives — {logs.length} entrée(s)</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Opérateur</th><th>Description de l'Action</th><th>Date & Heure</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={3}><div className="empty-state" style={{ padding: '32px' }}><ClipboardList size={32} /><h3>Aucun journal</h3><p>Aucune action enregistrée pour l'instant.</p></div></td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td><strong style={{ color: 'var(--accent-primary-light)' }}>{log.operator_name}</strong></td>
                  <td>{log.action_description}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmt(log.timestamp)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
