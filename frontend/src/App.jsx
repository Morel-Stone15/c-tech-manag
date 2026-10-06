import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, Shield, Calendar, Building2, MessageCircle,
  QrCode, BarChart3, Settings, LogOut, ChevronRight, Menu, X,
  UserPlus, Zap, Globe, ArrowRight, Sparkles, BookOpen
} from 'lucide-react';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Common
import { Toast } from './components/common/Toast';
import { AntigravityCanvas } from './components/common/AntigravityCanvas';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

// Auth
import { AuthPage } from './components/auth/AuthPage';
import { ChangePinModal } from './components/auth/ChangePinModal';
import { ForceChangePinModal } from './components/auth/ForceChangePinModal';

// Bureau Workspace Components
import { BoardDashboard } from './components/dashboard/BoardDashboard';
import { BoardMembers } from './components/members/BoardMembers';
import { BoardOrgChart } from './components/org_chart/BoardOrgChart';
import { BoardCommissions } from './components/commissions/BoardCommissions';
import { BoardCalendar } from './components/calendar/BoardCalendar';
import { BoardScanner } from './components/attendance/BoardScanner';
import { BoardCommunication } from './components/communication/BoardCommunication';
import { BoardLogs } from './components/admin/BoardLogs';
import { BoardBackup } from './components/admin/BoardBackup';

// Member Workspace
import { MemberWorkspace } from './components/members/MemberWorkspace';

// ─── Sidebar Navigation Config ─────────────────────────
const BUREAU_NAV = [
  { id: 'dashboard',     label: 'Tableau de Bord',  icon: LayoutDashboard, section: 'principal' },
  { id: 'members',       label: 'Membres',          icon: Users,           section: 'principal' },
  { id: 'org_chart',     label: 'Organigramme',     icon: Building2,       section: 'principal' },
  { id: 'commissions',   label: 'Commissions',      icon: BookOpen,        section: 'gestion' },
  { id: 'calendar',      label: 'Calendrier',       icon: Calendar,        section: 'gestion' },
  { id: 'scanner',       label: 'Pointage QR',      icon: QrCode,          section: 'gestion' },
  { id: 'communication', label: 'Communication',    icon: MessageCircle,   section: 'gestion' },
  { id: 'logs',          label: 'Journal',           icon: BarChart3,       section: 'admin' },
  { id: 'backup',        label: 'Sauvegarde',        icon: Settings,        section: 'admin' },
];

// ─── Landing Page ──────────────────────────────────────
function LandingPage({ onNavigate }) {
  const features = [
    { icon: Users, title: 'Gestion des Membres', desc: 'Inscriptions, cartes virtuelles, suivi complet des adhérents.' },
    { icon: Building2, title: 'Organigramme', desc: 'Structure hiérarchique interactive du bureau et des pôles.' },
    { icon: Calendar, title: 'Événements', desc: 'Calendrier dynamique, planification et pointage par QR Code.' },
    { icon: MessageCircle, title: 'Communication', desc: 'Discussion interne, messagerie, e-mails groupés, statuts.' },
    { icon: Shield, title: 'Espace Bureau', desc: 'Tableau de bord avancé, statistiques et administration.' },
    { icon: Zap, title: 'Commissions', desc: 'Création et gestion des commissions thématiques du club.' },
  ];

  return (
    <div className="landing-hero">
      <AntigravityCanvas />

      <img src="/logo.png" alt="C-TECH" className="landing-logo" />

      <h1 className="landing-title">
        <span className="text-gradient">C-TECH</span>
      </h1>

      <p className="landing-subtitle">Club Technologique Étudiant</p>

      <div className="landing-actions">
        <button className="btn btn-primary btn-lg" onClick={() => onNavigate('member')}>
          <UserPlus size={18} />
          Espace Membre
          <ArrowRight size={16} />
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('bureau')}>
          <Shield size={18} />
          Espace Bureau
        </button>
      </div>

      {/* Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'var(--space-5)',
        maxWidth: 900,
        width: '100%',
        marginTop: 'var(--space-12)',
        position: 'relative',
        zIndex: 1
      }}>
        {features.map((f, i) => (
          <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
              <div className="stat-icon indigo">
                <f.icon size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, marginBottom: 4 }}>{f.title}</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p style={{
        marginTop: 'var(--space-10)',
        fontSize: 11,
        color: 'var(--text-faint)',
        letterSpacing: 1,
        position: 'relative',
        zIndex: 1
      }}>
        © {new Date().getFullYear()} C-TECH — Propulsé par l'Innovation
      </p>
    </div>
  );
}

// ─── Bureau Layout (Sidebar + Content) ─────────────────
function BureauLayout({ user, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [changePinOpen, setChangePinOpen] = useState(false);

  const showToast = useCallback((msg, type = 'info') => setToast({ msg, type }), []);

  const closeSidebar = () => setSidebarOpen(false);

  const renderPage = () => {
    const props = { user, showToast };
    switch (activePage) {
      case 'dashboard':     return <BoardDashboard {...props} />;
      case 'members':       return <BoardMembers {...props} />;
      case 'org_chart':     return <BoardOrgChart {...props} />;
      case 'commissions':   return <BoardCommissions {...props} />;
      case 'calendar':      return <BoardCalendar {...props} />;
      case 'scanner':       return <BoardScanner {...props} />;
      case 'communication': return <BoardCommunication {...props} />;
      case 'logs':          return <BoardLogs {...props} />;
      case 'backup':        return <BoardBackup {...props} />;
      default:              return <BoardDashboard {...props} />;
    }
  };

  const currentNav = BUREAU_NAV.find(n => n.id === activePage);
  const sections = [...new Set(BUREAU_NAV.map(n => n.section))];

  const sectionLabels = {
    principal: 'Principal',
    gestion: 'Gestion',
    admin: 'Administration'
  };

  return (
    <div className="app-shell has-sidebar">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="C-TECH" className="sidebar-brand-logo" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">C-TECH</span>
            <span className="sidebar-brand-subtitle">Espace Bureau</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => (
            <div key={section}>
              <div className="sidebar-section-label">{sectionLabels[section]}</div>
              {BUREAU_NAV.filter(n => n.section === section).map(nav => (
                <button
                  key={nav.id}
                  className={`sidebar-link ${activePage === nav.id ? 'active' : ''}`}
                  onClick={() => { setActivePage(nav.id); closeSidebar(); }}
                >
                  <nav.icon size={18} />
                  <span>{nav.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <img
              src={user.photo_path ? `/api/uploads/${user.photo_path.replace('uploads/', '')}` : '/logo.png'}
              alt={user.first_name}
              className="sidebar-user-avatar"
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.first_name} {user.last_name}</div>
              <div className="sidebar-user-role">
                {user.is_bureau ? 'Bureau' : 'Membre'} • {user.member_number}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="app-main">
        <header className="app-header">
          <div className="flex items-center gap-3">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="app-header-title">
              {currentNav && <currentNav.icon size={20} style={{ color: 'var(--accent-primary-light)' }} />}
              {currentNav?.label || 'Tableau de Bord'}
            </h1>
          </div>
          <div className="app-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setChangePinOpen(true)}>
              <Shield size={14} /> PIN
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ color: 'var(--accent-rose)' }}>
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </header>

        <div className="app-content animate-fade-in" key={activePage}>
          {renderPage()}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Change PIN Modal */}
      {changePinOpen && (
        <ChangePinModal
          user={user}
          onClose={() => setChangePinOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── Member Layout ─────────────────────────────────────
function MemberLayout({ user, onLogout }) {
  const [toast, setToast] = useState(null);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const showToast = useCallback((msg, type = 'info') => setToast({ msg, type }), []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {/* Simple top bar for member */}
      <header className="app-header">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="C-TECH" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <h1 className="app-header-title">
            Mon Espace Membre
          </h1>
        </div>
        <div className="app-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setChangePinOpen(true)}>
            <Shield size={14} /> PIN
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ color: 'var(--accent-rose)' }}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </header>

      <div className="app-content animate-fade-in">
        <MemberWorkspace user={user} showToast={showToast} />
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {changePinOpen && (
        <ChangePinModal
          user={user}
          onClose={() => setChangePinOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────
function AppInner() {
  const { currentUser, login, logout } = useAuth();
  const [view, setView] = useState('landing'); // landing | auth | app
  const [authTab, setAuthTab] = useState('member');

  // If user is already logged in, go straight to app
  useEffect(() => {
    if (currentUser) {
      setView('app');
    }
  }, [currentUser]);

  const handleNavigateToAuth = (tab) => {
    setAuthTab(tab);
    setView('auth');
  };

  const handleLogin = (userData) => {
    login(userData);
    setView('app');
  };

  const handleLogout = () => {
    logout();
    setView('landing');
  };

  // Force change PIN
  if (currentUser?.must_change_pin && view === 'app') {
    return (
      <ForceChangePinModal
        user={currentUser}
        onPinChanged={(updatedUser) => {
          login({ ...currentUser, ...updatedUser, must_change_pin: false });
        }}
      />
    );
  }

  if (view === 'auth') {
    return (
      <AuthPage
        initialTab={authTab}
        onLogin={handleLogin}
        onBackToHome={() => setView('landing')}
      />
    );
  }

  if (view === 'app' && currentUser) {
    if (currentUser.is_bureau) {
      return <BureauLayout user={currentUser} onLogout={handleLogout} />;
    }
    return <MemberLayout user={currentUser} onLogout={handleLogout} />;
  }

  return <LandingPage onNavigate={handleNavigateToAuth} />;
}

export default function App() {
  return (
    <AuthProvider>
      <PWAInstallPrompt />
      <AppInner />
    </AuthProvider>
  );
}
