import { useState } from 'react';
import {
  LayoutDashboard, Users, ScanLine, Network, Layers,
  MessageSquare, Calendar, ClipboardList, HardDrive, Shield, LogOut, Menu, X
} from 'lucide-react';
import { ChangePinModal } from '../auth/ChangePinModal';
import { BoardDashboard } from '../dashboard/BoardDashboard';
import { BoardMembers } from '../members/BoardMembers';
import { BoardScanner } from '../attendance/BoardScanner';
import { BoardOrgChart } from '../org_chart/BoardOrgChart';
import { BoardCommissions } from '../commissions/BoardCommissions';
import { BoardCommunication } from '../communication/BoardCommunication';
import { BoardCalendar } from '../calendar/BoardCalendar';
import { BoardLogs } from '../admin/BoardLogs';
import { BoardBackup } from '../admin/BoardBackup';

export function BoardWorkspace({ member, onLogout, showToast }) {
  const [page, setPage] = useState('dashboard');
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Tableau de Bord' },
    { id: 'members', icon: <Users size={18} />, label: 'Membres' },
    { id: 'scanner', icon: <ScanLine size={18} />, label: 'Scanner QR' },
    { id: 'orgchart', icon: <Network size={18} />, label: 'Organigramme' },
    { id: 'commissions', icon: <Layers size={18} />, label: 'Commissions' },
    { id: 'communication', icon: <MessageSquare size={18} />, label: 'Communication' },
    { id: 'calendar', icon: <Calendar size={18} />, label: 'Calendrier' },
    { id: 'logs', icon: <ClipboardList size={18} />, label: 'Journaux' },
    { id: 'backup', icon: <HardDrive size={18} />, label: 'Sauvegarde' },
  ];

  const handleNavClick = (id) => {
    setPage(id);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {changePinOpen && (
        <ChangePinModal member={member} onClose={() => setChangePinOpen(false)} showToast={showToast} />
      )}

      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo.png" alt="Logo" style={{ height: 36, width: 'auto' }} />
              <div>
                <div className="logo-text">C-TECH</div>
                <div className="logo-sub">ESPACE BUREAU</div>
              </div>
            </div>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)} style={{ display: sidebarOpen ? 'flex' : 'none' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Administration</div>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => handleNavClick(item.id)}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
            <div className="avatar" style={{ background: 'var(--gradient-primary)' }}>
              <Shield size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{member.first_name} {member.last_name}</div>
              <div style={{ fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 700 }}>Espace Bureau</div>
            </div>
          </div>
          <button className="btn btn-secondary w-full" onClick={() => setChangePinOpen(true)} style={{ justifyContent: 'center', marginBottom: 8 }}>
            Changer mon PIN
          </button>
          <button className="btn btn-ghost w-full" onClick={onLogout} style={{ justifyContent: 'center' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="mobile-header-bar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent-primary-light)' }}>
            C-TECH <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— Espace Bureau</span>
          </div>
        </div>

        <div>
          {page === 'dashboard' && <BoardDashboard showToast={showToast} />}
          {page === 'members' && <BoardMembers member={member} showToast={showToast} />}
          {page === 'scanner' && <BoardScanner member={member} showToast={showToast} />}
          {page === 'orgchart' && <BoardOrgChart member={member} showToast={showToast} />}
          {page === 'commissions' && <BoardCommissions member={member} showToast={showToast} />}
          {page === 'communication' && <BoardCommunication member={member} showToast={showToast} />}
          {page === 'calendar' && <BoardCalendar member={member} showToast={showToast} />}
          {page === 'logs' && <BoardLogs showToast={showToast} />}
          {page === 'backup' && <BoardBackup showToast={showToast} />}
        </div>
      </main>
    </div>
  );
}
