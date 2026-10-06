import { forwardRef } from 'react';
import { Shield } from 'lucide-react';

export function getMediaUrl(path) {
  if (!path) return null;
  return path.startsWith('/') ? path : `/${path}`;
}

export const VirtualCard = forwardRef(({ member }, ref) => {
  if (!member) return null;

  const photoUrl = getMediaUrl(member.photo_path);
  const qrUrl = getMediaUrl(member.qr_code_path);

  return (
    <div ref={ref} className="virtual-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, letterSpacing: 3, color: '#fff' }}>C-TECH</div>
          <div style={{ fontSize: 9.5, letterSpacing: 1.5, color: '#a78bfa', textTransform: 'uppercase', fontWeight: 700 }}>
            CLUB TECHNOLOGIQUE ÉTUDIANT
          </div>
        </div>
        <img src="/logo.png" alt="Logo" style={{ height: 38, width: 'auto', filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.6))' }} />
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
        {photoUrl ? (
          <img src={photoUrl} alt="Photo" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167,139,250,0.5)', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }} />
        ) : (
          <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', fontSize: 24, boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>
            {member.first_name?.[0]}{member.last_name?.[0]}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
            {member.first_name} {member.last_name}
          </div>
          <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 6 }}>{member.major}</div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-primary" style={{ fontSize: 10 }}>{member.level}</span>
            {member.is_bureau && <span className="badge badge-purple" style={{ fontSize: 10 }}>MEMBRE DU BUREAU</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>N° Membre Officiel</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#818cf8', letterSpacing: 1.5 }}>
            {member.member_number}
          </div>
        </div>

        {qrUrl && (
          <div className="qr-container">
            <img src={qrUrl} alt="QR Code" style={{ width: 64, height: 64, display: 'block' }} />
          </div>
        )}
      </div>
    </div>
  );
});

VirtualCard.displayName = 'VirtualCard';
