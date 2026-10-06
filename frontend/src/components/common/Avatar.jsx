export function Avatar({ member, size = 'md', className = '' }) {
  if (!member) {
    return (
      <div className={`avatar-placeholder avatar-${size} ${className}`} style={{
        width: size === 'sm' ? 28 : size === 'lg' ? 48 : size === 'xl' ? 64 : size === '2xl' ? 88 : 36,
        height: size === 'sm' ? 28 : size === 'lg' ? 48 : size === 'xl' ? 64 : size === '2xl' ? 88 : 36,
        fontSize: size === 'sm' ? 11 : size === 'lg' ? 18 : 14
      }}>?</div>
    );
  }

  const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase() || 'CT';
  const photoUrl = member.photo_path
    ? (member.photo_path.startsWith('http') ? member.photo_path : `/api/${member.photo_path.replace(/^\//, '')}`)
    : null;

  const sizeMap = { sm: 28, md: 36, lg: 48, xl: 64, '2xl': 88 };
  const px = sizeMap[size] || 36;
  const fs = px * 0.38;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${member.first_name} ${member.last_name}`}
        className={`avatar avatar-${size} ${className}`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.replaceWith(Object.assign(document.createElement('div'), {
            className: `avatar-placeholder avatar-${size} ${className}`,
            textContent: initials,
            style: `width:${px}px;height:${px}px;font-size:${fs}px;display:inline-flex;align-items:center;justify-content:center;`
          }));
        }}
      />
    );
  }

  return (
    <div
      className={`avatar-placeholder avatar-${size} ${className}`}
      style={{ width: px, height: px, fontSize: fs }}
    >
      {initials}
    </div>
  );
}
