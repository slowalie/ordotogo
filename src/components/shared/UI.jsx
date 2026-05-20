import { useState } from 'react';

/* ─── Button ─────────────────────────────────────────────────────────────── */
export function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, fullWidth = false, icon, className = '', style = {},
}) {
  const base = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '6px',
    fontFamily:     'var(--font-body)',
    fontWeight:     600,
    cursor:         disabled ? 'not-allowed' : 'pointer',
    border:         'none',
    transition:     'all var(--transition)',
    width:          fullWidth ? '100%' : 'auto',
    opacity:        disabled ? .5 : 1,
    whiteSpace:     'nowrap',
  };

  const sizes = {
    sm:  { padding: '6px 12px', fontSize: '13px', borderRadius: 'var(--radius-sm)' },
    md:  { padding: '10px 20px', fontSize: '14px', borderRadius: 'var(--radius-sm)' },
    lg:  { padding: '13px 24px', fontSize: '15px', borderRadius: 'var(--radius-md)' },
  };

  const variants = {
    primary:   { background: 'var(--color-primary)', color: '#fff' },
    secondary: { background: 'var(--green-50)', color: 'var(--green-800)', outline: '1px solid var(--green-100)' },
    ghost:     { background: 'transparent', color: 'var(--color-text-secondary)', outline: '1px solid var(--color-border)' },
    danger:    { background: 'var(--coral-50)', color: 'var(--coral-600)', outline: '1px solid var(--coral-400)' },
    success:   { background: 'var(--green-400)', color: '#fff' },
  };

  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      className={className}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {icon && <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>}
      {children}
    </button>
  );
}

/* ─── Badge ─────────────────────────────────────────────────────────────── */
const badgeStyles = {
  pending:   { bg: 'var(--amber-50)',  color: 'var(--amber-600)',  label: 'En attente'   },
  processing:{ bg: 'var(--blue-50)',   color: 'var(--blue-600)',   label: 'En cours'     },
  waiting_validation: { bg: 'var(--amber-50)', color: 'var(--amber-400)', label: 'À valider' },
  validated: { bg: 'var(--green-50)',  color: 'var(--green-600)',  label: 'Validée'      },
  paid:      { bg: 'var(--blue-50)',   color: 'var(--blue-800)',   label: 'Payée'        },
  ready:     { bg: 'var(--green-50)',  color: 'var(--green-800)',  label: 'Prête'        },
  delivered: { bg: 'var(--green-50)',  color: 'var(--green-600)',  label: 'Délivrée'     },
  new:       { bg: 'var(--coral-50)', color: 'var(--coral-600)',   label: 'Nouveau'      },
  open:      { bg: 'var(--green-50)', color: 'var(--green-600)',   label: 'Ouvert'       },
  closed:    { bg: 'var(--gray-100)', color: 'var(--gray-600)',    label: 'Fermé'        },
};

export function Badge({ status, custom }) {
  const s = badgeStyles[status] || { bg: 'var(--gray-100)', color: 'var(--gray-600)', label: status };
  return (
    <span style={{
      display:       'inline-flex',
      alignItems:    'center',
      padding:       '3px 10px',
      borderRadius:  'var(--radius-full)',
      background:    s.bg,
      color:         s.color,
      fontSize:      '12px',
      fontWeight:    600,
      letterSpacing: '0.2px',
    }}>
      {custom || s.label}
    </span>
  );
}

/* ─── Card ───────────────────────────────────────────────────────────────── */
export function Card({ children, style = {}, onClick, hover = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      className="ui-card"
      style={{
        borderColor:  hovered ? 'var(--green-100)' : 'var(--color-border)',
        cursor:       onClick ? 'pointer' : 'default',
        boxShadow:    hovered ? 'var(--shadow-sm)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────────── */
export function SectionHeader({ children, action }) {
  return (
    <div className="section-header">
      <span className="section-header__title">
        {children}
      </span>
      {action}
    </div>
  );
}

/* ─── Divider ────────────────────────────────────────────────────────────── */
export function Divider({ style = {} }) {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '12px 0', ...style }} />;
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
export function Avatar({ name, size = 36, color = 'green' }) {
  const colors = {
    green:  { bg: 'var(--green-50)',  text: 'var(--green-800)'  },
    blue:   { bg: 'var(--blue-50)',   text: 'var(--blue-800)'   },
    amber:  { bg: 'var(--amber-50)',  text: 'var(--amber-600)'  },
    coral:  { bg: 'var(--coral-50)',  text: 'var(--coral-600)'  },
  };
  const c = colors[color] || colors.green;
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   '50%',
      background:     c.bg,
      color:          c.text,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontWeight:     700,
      fontSize:       size * 0.36,
      flexShrink:     0,
    }}>
      {initials}
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <div className="empty-state__title">{title}</div>
      {description && <div className="empty-state__description">{description}</div>}
      {action}
    </div>
  );
}

/* ─── Progress Steps ─────────────────────────────────────────────────────── */
export function StepBar({ steps, current }) {
  return (
    <div className="stepbar">
      {steps.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} className="stepbar__step" style={{
            fontWeight:      active ? 700 : 500,
            background:      done ? 'var(--green-400)' : active ? 'var(--green-50)' : 'white',
            color:           done ? 'white' : active ? 'var(--green-800)' : 'var(--color-text-muted)',
          }}>
            {done ? '✓ ' : ''}{step}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
export function Input({ label, value, onChange, placeholder, type = 'text', icon, style = {} }) {
  return (
    <div className="field-group" style={style}>
      {label && <label className="field-label">{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '15px' }}>{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="field-control"
          style={{
            padding:      icon ? '9px 12px 9px 34px' : '9px 12px',
            paddingLeft:  icon ? '34px' : '12px',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--green-400)'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />
      </div>
    </div>
  );
}

/* ─── Textarea ───────────────────────────────────────────────────────────── */
export function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="field-group">
      {label && <label className="field-label">{label}</label>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="field-textarea"
        style={{
        }}
        onFocus={e => e.target.style.borderColor = 'var(--green-400)'}
        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
      />
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────────────────────── */
export function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div className="field-group">
      {label && <label className="field-label">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="field-select"
        style={{
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */
export function Spinner({ size = 24 }) {
  return (
    <div style={{
      width:         size,
      height:        size,
      border:        `2px solid var(--green-100)`,
      borderTop:     `2px solid var(--green-600)`,
      borderRadius:  '50%',
      animation:     'spin 0.8s linear infinite',
    }} />
  );
}

/* ─── Notification Dot ───────────────────────────────────────────────────── */
export function NotifBadge({ count }) {
  if (!count) return null;
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      width:          '18px',
      height:         '18px',
      borderRadius:   '50%',
      background:     'var(--coral-400)',
      color:          'white',
      fontSize:       '11px',
      fontWeight:     700,
    }}>
      {count}
    </span>
  );
}

export function BiIcon({ name, className = '', size = 16, title }) {
  return (
    <i
      className={`bi bi-${name} ${className}`.trim()}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      title={title}
      style={{ fontSize: size, lineHeight: 1 }}
    />
  );
}
