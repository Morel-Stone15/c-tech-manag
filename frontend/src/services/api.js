const BASE = '/api';

async function req(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur serveur (${res.status})`);
  }
  return data;
}

export const api = {
  // Auth
  login: (data) => req('/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (formData) => req('/register', { method: 'POST', body: formData }),
  changePin: (data) => req('/change_pin', { method: 'POST', body: JSON.stringify(data) }),
  forgotPin: (data) => req('/forgot_pin', { method: 'POST', body: JSON.stringify(data) }),

  // Members
  getMembers: (qs = '') => req(`/members${qs}`),
  getMember: (id) => req(`/members/${id}`),
  updateMember: (id, data) => req(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (id, operator) => req(`/members/${id}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),
  resetMemberPin: (id, operator) => req(`/members/${id}/reset_pin`, { method: 'POST', body: JSON.stringify({ operator }) }),
  updateNotes: (id, notes, operator) => req(`/members/${id}/private_notes`, { method: 'PUT', body: JSON.stringify({ notes, operator }) }),
  sendCardEmail: (id, operator) => req(`/members/${id}/send_card_email`, { method: 'POST', body: JSON.stringify({ operator }) }),

  // Card URLs
  getCardPdfUrl: (id) => `${BASE}/members/${id}/card_pdf`,
  getCardPngUrl: (id) => `${BASE}/members/${id}/card_png`,

  // Attendance
  scanAttendance: (data) => req('/attendance/scan', { method: 'POST', body: JSON.stringify(data) }),
  getAttendance: (memberId) => req(`/attendance${memberId ? `?member_id=${memberId}` : ''}`),

  // Org Chart
  getOrgChart: () => req('/org_chart'),
  addOrgRole: (data) => req('/org_chart', { method: 'POST', body: JSON.stringify(data) }),
  updateOrgRole: (id, data) => req(`/org_chart/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrgRole: (id, operator) => req(`/org_chart/${id}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),

  // Commissions
  getCommissions: () => req('/commissions'),
  createCommission: (data) => req('/commissions', { method: 'POST', body: JSON.stringify(data) }),
  getCommissionMembers: (commId) => req(`/commissions/${commId}/members`),
  addCommissionMember: (commId, data) => req(`/commissions/${commId}/members`, { method: 'POST', body: JSON.stringify(data) }),
  removeCommissionMember: (commId, memberId, operator) => req(`/commissions/${commId}/members/${memberId}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),

  // Discussion & WhatsApp
  getMessages: (qs = '') => req(`/discussion${qs}`),
  postMessage: (payload) => req('/discussion', { method: 'POST', body: payload }),
  getGroups: (memberId) => req(`/discussion/groups${memberId ? `?member_id=${memberId}` : ''}`),
  createGroup: (data) => req('/discussion/groups', { method: 'POST', body: JSON.stringify(data) }),
  getStatuses: () => req('/discussion/statuses'),
  postStatus: (payload) => req('/discussion/statuses', { method: 'POST', body: payload }),
  sendMassEmail: (data) => req('/send_mass_email', { method: 'POST', body: JSON.stringify(data) }),

  // Calendar Events
  getCalendar: () => req('/calendar'),
  addCalendarEvent: (data) => req('/calendar', { method: 'POST', body: JSON.stringify(data) }),
  deleteCalendarEvent: (id, operator) => req(`/calendar/${id}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),

  // Admin
  getLogs: () => req('/logs'),
  resetDatabase: () => req('/reset_database', { method: 'POST' }),
  importExcel: (formData) => req('/import_excel', { method: 'POST', body: formData }),
};
