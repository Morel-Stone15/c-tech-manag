export const POLES = [
  'Génie Logiciel & Dev Web',
  'Intelligence Artificielle & Data',
  'Cybersécurité & Réseaux',
  'Robotique & Systèmes Embarqués',
  'Design UI/UX & Création',
  'Entrepreneuriat & Innovation'
];

export const ALL_FILIERES = [
  'Informatique & Réseaux',
  'Génie Logiciel',
  'CyberSécurité',
  'Intelligence Artificielle',
  'Design UI/UX',
  'Électronique & IoT',
  'Management & Tech'
];

export const ALL_NIVEAUX = [
  'Licence 1',
  'Licence 2',
  'Licence 3',
  'Master 1',
  'Master 2',
  'Ingénieur',
  'Doctorat',
  'Bureau'
];

export function fmt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
