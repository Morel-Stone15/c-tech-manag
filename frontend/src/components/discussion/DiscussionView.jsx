import { useState, useEffect, useRef } from 'react';
import { Send, Image, Paperclip, Plus, MessageSquare, Shield, Users, Check } from 'lucide-react';
import { api } from '../../services/api';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';

export function DiscussionView({ member, showToast }) {
  const [activeTab, setActiveTab] = useState('channel'); // 'channel' | 'direct' | 'groups'
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [statuses, setStatuses] = useState([]);
  const [newStatusText, setNewStatusText] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  function loadMessages() {
    let qs = '';
    if (activeTab === 'direct' && selectedRecipient) {
      qs = `?member_id=${member.id}&other_id=${selectedRecipient.id}`;
    } else if (activeTab === 'groups' && selectedGroup) {
      qs = `?group_id=${selectedGroup.id}`;
    } else {
      qs = `?member_id=${member.id}`;
    }

    api.getMessages(qs).then(d => setMessages(Array.isArray(d) ? d : [])).catch(() => {});
  }

  useEffect(() => {
    loadMessages();
    api.getMembers().then(d => setMembers(Array.isArray(d) ? d.filter(m => m.id !== member.id) : [])).catch(() => {});
    api.getGroups(member.id).then(d => setGroups(Array.isArray(d) ? d : [])).catch(() => {});
    api.getStatuses().then(d => setStatuses(Array.isArray(d) ? d : [])).catch(() => {});

    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [activeTab, selectedRecipient, selectedGroup]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() && !file) return;

    setSending(true);
    try {
      const fd = new FormData();
      fd.append('member_id', member.id);
      if (text.trim()) fd.append('message', text.trim());
      if (file) fd.append('file', file);

      if (activeTab === 'direct' && selectedRecipient) {
        fd.append('receiver_id', selectedRecipient.id);
      } else if (activeTab === 'groups' && selectedGroup) {
        fd.append('group_id', selectedGroup.id);
      }

      await api.postMessage(fd);
      setText('');
      setFile(null);
      loadMessages();
    } catch (err) {
      showToast(err.message || 'Erreur envoi message.', 'error');
    } finally {
      setSending(false);
    }
  }

  async function handlePostStatus(e) {
    e.preventDefault();
    if (!newStatusText.trim()) return;
    try {
      await api.postStatus({
        member_id: member.id,
        content: newStatusText.trim(),
        bg_color: newStatusColor
      });
      showToast('Statut publié !', 'success');
      setStatusModalOpen(false);
      setNewStatusText('');
      api.getStatuses().then(d => setStatuses(Array.isArray(d) ? d : [])).catch(() => {});
    } catch (err) {
      showToast('Erreur publication statut.', 'error');
    }
  }

  return (
    <div className="wa-container">
      {statusModalOpen && (
        <Modal title="Publier un Statut (Story 24h)" onClose={() => setStatusModalOpen(false)}>
          <form onSubmit={handlePostStatus}>
            <div className="form-group">
              <label className="form-label">Votre message / actualité</label>
              <textarea
                className="form-textarea"
                placeholder="Ex: Atelier IA disponible ce samedi ! 🚀"
                value={newStatusText}
                onChange={e => setNewStatusText(e.target.value)}
                required
                style={{ minHeight: 120 }}
              />
            </div>
            <button className="btn btn-primary w-full" type="submit" style={{ marginTop: 14 }}>
              Publier le Statut
            </button>
          </form>
        </Modal>
      )}

      {/* Sidebar WhatsApp */}
      <div className="wa-sidebar">
        <div className="wa-header">
          <div style={{ fontWeight: 800, fontSize: 16 }}>Communauté Tech</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setStatusModalOpen(true)} title="Nouveau Statut">
            <Plus size={16} /> Statut
          </button>
        </div>

        <div className="auth-tabs" style={{ margin: '10px 14px', borderRadius: 8 }}>
          <button className={`auth-tab ${activeTab === 'channel' ? 'active' : ''}`} onClick={() => setActiveTab('channel')}>
            Canal
          </button>
          <button className={`auth-tab ${activeTab === 'direct' ? 'active' : ''}`} onClick={() => setActiveTab('direct')}>
            Privé
          </button>
          <button className={`auth-tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
            Groupes
          </button>
        </div>

        {/* List of contacts or groups */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'direct' && (
            <div>
              {members.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedRecipient(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: selectedRecipient?.id === m.id ? 'rgba(99,102,241,0.14)' : 'transparent'
                  }}
                >
                  <Avatar member={m} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.first_name} {m.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.major}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'channel' && (
            <div style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: 13.5 }}>
              🌐 <strong>Canal Général C-TECH</strong><br />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Espace d'échange public pour tous les membres du club.</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Content */}
      <div className="wa-main">
        <div className="wa-header">
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {activeTab === 'direct' && selectedRecipient ? `${selectedRecipient.first_name} ${selectedRecipient.last_name}` : '🌐 Canal Général Club C-TECH'}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map(msg => {
            const isMe = msg.member_id === member.id;
            return (
              <div key={msg.id} className={`wa-bubble ${isMe ? 'me' : 'them'}`}>
                {!isMe && (
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--accent-primary-light)' }}>
                    {msg.sender_name} {msg.is_bureau && ' (Bureau)'}
                  </div>
                )}
                {msg.message && <div>{msg.message}</div>}
                {msg.attachment_path && (
                  <div style={{ marginTop: 8 }}>
                    {msg.attachment_type === 'image' ? (
                      <img src={`/${msg.attachment_path}`} alt="Pièce jointe" style={{ maxWidth: 240, borderRadius: 10 }} />
                    ) : (
                      <a href={`/${msg.attachment_path}`} target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline', fontSize: 13 }}>
                        📎 {msg.attachment_name || 'Télécharger pièce jointe'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className="wa-input-bar">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])}
          />
          <button type="button" className="wa-icon-btn" onClick={() => fileInputRef.current?.click()} title="Joindre un fichier">
            <Paperclip size={18} />
          </button>
          <input
            className="wa-text-input"
            placeholder="Écrivez votre message..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button type="submit" className={`wa-send-fab ${text.trim() || file ? 'active' : ''}`} disabled={sending}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
