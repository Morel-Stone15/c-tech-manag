import { useState } from 'react';
import { Download, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { api } from '../../services/api';

export function BoardBackup({ showToast }) {
  const [resetting, setResetting] = useState(false);

  async function handleResetDB() {
    if (!window.confirm("⚠️ ATTENTION : Êtes-vous sûr de vouloir réinitialiser la base de données ? Toutes les données sauf l'admin principal seront définitivement supprimées !")) {
      return;
    }
    const check = prompt("Pour confirmer, saisissez exactement 'PURGER' :");
    if (check !== 'PURGER') {
      showToast("Réinitialisation annulée.", "info");
      return;
    }

    setResetting(true);
    try {
      const res = await api.resetDatabase();
      showToast(res.message || "Base de données réinitialisée avec succès !", "success");
    } catch (err) {
      showToast(err.message || "Erreur lors de la réinitialisation.", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            <Settings size={24} style={{ color: 'var(--accent-primary-light)' }} />
            Sauvegarde & Maintenance
          </h1>
          <p className="page-subtitle">Export de la base de données SQLite et maintenance système</p>
        </div>
      </div>

      <div className="form-grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-header-title">
              <Download size={18} /> Télécharger la Sauvegarde BDD
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              Téléchargez un fichier SQLite complet de la base de données (<code>clubtech.db</code>) contenant
              l'ensemble des membres, rôles, événements et logs d'audit.
            </p>
            <button className="btn btn-primary w-full" onClick={() => window.open('/api/backup')}>
              <Download size={16} /> Télécharger Fichier SQL .db
            </button>
          </div>
        </div>

        <div className="card" style={{ borderColor: 'rgba(244,63,94,0.3)' }}>
          <div className="card-header">
            <div className="card-header-title" style={{ color: 'var(--accent-rose)' }}>
              <AlertTriangle size={18} /> Réinitialisation Complète BDD
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              Purger toutes les tables et réinitialiser le système à son état d'origine.
              <strong style={{ color: 'var(--accent-rose)' }}> Seul le compte Administrateur par défaut sera conservé.</strong>
            </p>
            <button className="btn btn-danger w-full" onClick={handleResetDB} disabled={resetting}>
              {resetting ? 'Purge en cours...' : <><RefreshCw size={16} /> Purger & Réinitialiser la BDD</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
