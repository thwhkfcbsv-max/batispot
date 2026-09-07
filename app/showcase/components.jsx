// BatiSpot — Artisan PWA components
// Mobile-first, high-contrast (worn outdoor on construction sites).
// Brand: greens (#0F5132 → #166534) + teal CTA (#0A7265).

const C = {
  g1: '#0F5132', g2: '#166534', g3: '#15803D', g4: '#4CAF82',
  t1: '#0A7265', t2: '#0F766E', t3: '#14B8A6',
  yellow: '#FCD34D',
  text: '#0F1F17',
  sub: '#4B6B5A',
  line: '#E5EDE7',
  bg: '#F7FAF8',
  white: '#FFFFFF',
  // status
  success: '#15803D',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#3B82F6',
};

// ─────────────────────────────────────────────────────────────
// Official BatiSpot logo — loads from source SVG files.
// Two declensions only: lockup (icon + wordmark) and mark (icon only).
// Source files live in /assets/. Never re-inline the SVG here —
// always reference the file so there's a single source of truth.
// ─────────────────────────────────────────────────────────────
function BatiSpotLogo({ height = 42, onDark = false }) {
  // Lockup is 200×48 → aspect ratio ≈ 4.17:1
  const width = (200 / 48) * height;
  return (
    <img
      src={onDark ? './logo-lockup-dark.svg' : './logo-lockup.svg'}
      width={width}
      height={height}
      alt="BatiSpot"
      style={{ display: 'block' }}
    />
  );
}

function BatiSpotMark({ size = 40 }) {
  return (
    <img
      src="./logo-mark.svg"
      width={size}
      height={size}
      alt="BatiSpot"
      style={{ display: 'block' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Signature gradient band (charte: top of every card/header)
// ─────────────────────────────────────────────────────────────
function GradientBand({ height = 4 }) {
  return (
    <div style={{
      height,
      background: 'linear-gradient(90deg, #0F5132 0%, #15803D 50%, #4CAF82 100%)',
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
// Icons (Lucide subset, inline SVG, stroke 2)
// ─────────────────────────────────────────────────────────────
const Icon = {
  briefcase: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  fileText: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>,
  user: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  menu: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  mapPin: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  euro: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.7 5.2-2"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  checkCircle: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  calendar: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  upload: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  chevronRight: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
  chevronLeft: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
  filter: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  settings: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  card: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  shield: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  logout: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  message: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  star: (p) => <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  phone: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
};

// ─────────────────────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────────────────────
function Button({ children, variant = 'primary', size = 'md', full, onClick, leading, trailing, style }) {
  const sizes = {
    sm: { h: 40, px: 14, fs: 14, br: 10 },
    md: { h: 52, px: 18, fs: 15, br: 12 },
    lg: { h: 60, px: 22, fs: 17, br: 14 },
  }[size];

  const variants = {
    primary: { bg: C.t1, color: C.white, border: 'none', shadow: '0 4px 14px rgba(10,114,101,.32)' },
    dark: { bg: C.g1, color: C.white, border: 'none', shadow: '0 4px 14px rgba(15,81,50,.32)' },
    yellow: { bg: C.yellow, color: '#3F2A06', border: 'none', shadow: '0 4px 14px rgba(252,211,77,.4)' },
    secondary: { bg: C.white, color: C.g1, border: `1.5px solid ${C.line}`, shadow: 'none' },
    ghost: { bg: 'transparent', color: C.g1, border: 'none', shadow: 'none' },
    danger: { bg: C.white, color: C.danger, border: `1.5px solid ${C.line}`, shadow: 'none' },
  }[variant];

  return (
    <button onClick={onClick} style={{
      height: sizes.h, padding: `0 ${sizes.px}px`,
      fontSize: sizes.fs, fontWeight: 700,
      fontFamily: 'inherit', letterSpacing: '-0.01em',
      background: variants.bg, color: variants.color, border: variants.border,
      borderRadius: sizes.br, boxShadow: variants.shadow,
      width: full ? '100%' : 'auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s',
      ...style,
    }}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────
function Badge({ children, variant = 'new', size = 'md' }) {
  const variants = {
    new:    { bg: '#FEF3C7', fg: '#92400E', dot: C.warning, label: 'Nouveau' },
    pending:{ bg: '#DBEAFE', fg: '#1E40AF', dot: C.info, label: 'En attente' },
    accepted:{ bg: '#D1FAE5', fg: '#065F46', dot: C.success, label: 'Accepté' },
    inprogress:{ bg: '#FEF3C7', fg: '#854D0E', dot: C.warning, label: 'En cours' },
    validated:{ bg: '#D1FAE5', fg: '#065F46', dot: C.success, label: 'Validé' },
    refused:{ bg: '#FEE2E2', fg: '#991B1B', dot: C.danger, label: 'Refusé' },
    urgent: { bg: '#FEE2E2', fg: '#991B1B', dot: C.danger, label: 'Urgent' },
  }[variant] || { bg: C.line, fg: C.text, dot: C.sub };

  const fontSize = size === 'sm' ? 11 : 12;
  const padY = size === 'sm' ? 4 : 5;
  const padX = size === 'sm' ? 8 : 10;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: variants.bg, color: variants.fg,
      padding: `${padY}px ${padX}px`, borderRadius: 999,
      fontSize, fontWeight: 700, letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: variants.dot }}/>
      {children || variants.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Métier badge (with category color)
// ─────────────────────────────────────────────────────────────
function MetierBadge({ metier }) {
  const colors = {
    'Plomberie':    { bg: '#DBEAFE', fg: '#1E40AF' },
    'Électricité':  { bg: '#FEF3C7', fg: '#92400E' },
    'Maçonnerie':   { bg: '#E5E7EB', fg: '#374151' },
    'Menuiserie':   { bg: '#FED7AA', fg: '#9A3412' },
    'Couverture':   { bg: '#DDD6FE', fg: '#5B21B6' },
    'Peinture':     { bg: '#FBCFE8', fg: '#9D174D' },
    'Cuisine':      { bg: '#FED7AA', fg: '#9A3412' },
    'Énergie':      { bg: '#DBEAFE', fg: '#1E40AF' },
    'DPE':          { bg: '#FEF3C7', fg: '#92400E' },
  }[metier] || { bg: C.line, fg: C.sub };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: colors.bg, color: colors.fg,
      padding: '5px 10px', borderRadius: 8,
      fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>{metier}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Chantier card — main feed primitive
// ─────────────────────────────────────────────────────────────
function ChantierCard({ chantier, onClick, accepted = false }) {
  return (
    <div onClick={onClick} style={{
      background: C.white,
      borderRadius: 16,
      overflow: 'hidden',
      border: `1px solid ${C.line}`,
      boxShadow: '0 1px 3px rgba(15,31,23,.04)',
      cursor: 'pointer',
    }}>
      <GradientBand height={3}/>
      <div style={{ display: 'flex', gap: 12, padding: 14 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 12, flexShrink: 0,
          background: `url('${chantier.img}') center/cover, ${C.line}`,
        }}/>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <MetierBadge metier={chantier.metier}/>
            {chantier.urgent && <Badge variant="urgent" size="sm">Urgent</Badge>}
            {accepted && <Badge variant="accepted" size="sm"/>}
          </div>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.text, lineHeight: 1.25, letterSpacing: '-0.01em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {chantier.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.sub, fontSize: 13, fontWeight: 500 }}>
            <Icon.mapPin width={13} height={13}/> {chantier.zone} · {chantier.distance}
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: C.g1, letterSpacing: '-0.02em' }}>{chantier.budget}€</span>
          <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>budget client</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.sub, fontSize: 12, fontWeight: 600 }}>
          <Icon.clock width={12} height={12}/> {chantier.posted}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom navigation (4 tabs)
// ─────────────────────────────────────────────────────────────
function BottomNav({ active, onChange, platform = 'ios' }) {
  const items = [
    { key: 'chantiers', label: 'Chantiers', Icon: Icon.briefcase },
    { key: 'devis', label: 'Mes devis', Icon: Icon.fileText },
    { key: 'messages', label: 'Messages', Icon: Icon.message, badge: 2 },
    { key: 'profil', label: 'Profil', Icon: Icon.user },
  ];
  const isAndroid = platform === 'android';
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: isAndroid ? C.white : 'rgba(255,255,255,0.94)',
      backdropFilter: isAndroid ? 'none' : 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: isAndroid ? 'none' : 'saturate(180%) blur(20px)',
      borderTop: `1px solid ${C.line}`,
      padding: isAndroid ? '6px 0 8px' : '8px 0 28px',
      display: 'flex',
      zIndex: 5,
    }}>
      {items.map(it => {
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onChange?.(it.key)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: isActive ? C.g1 : C.sub,
            padding: '6px 0',
            position: 'relative',
          }}>
            <div style={{ position: 'relative' }}>
              <it.Icon width={isAndroid ? 24 : 26} height={isAndroid ? 24 : 26} stroke={isActive ? C.g1 : C.sub} strokeWidth={isActive ? 2.4 : 2}/>
              {it.badge && (
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  minWidth: 16, height: 16, padding: '0 4px',
                  background: C.danger, color: C.white,
                  fontSize: 10, fontWeight: 800,
                  borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${C.white}`,
                }}>{it.badge}</span>
              )}
            </div>
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 600, letterSpacing: '-0.01em' }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App header — branded green band
// ─────────────────────────────────────────────────────────────
function AppHeader({ title, subtitle, onMenu, onBell, bellCount, dark = true, safeTop = 50 }) {
  return (
    <div style={{
      background: dark ? C.g1 : C.white,
      color: dark ? C.white : C.text,
      paddingTop: safeTop,
    }}>
      {!dark && <GradientBand height={4}/>}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onMenu} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 6 }}>
          <Icon.menu width={24} height={24}/>
        </button>
        <BatiSpotMark size={32}/>
        <button onClick={onBell} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 6, position: 'relative' }}>
          <Icon.bell width={22} height={22}/>
          {bellCount && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              minWidth: 16, height: 16, background: C.yellow, color: '#3F2A06',
              fontSize: 10, fontWeight: 800, borderRadius: 999, padding: '0 4px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${dark ? C.g1 : C.white}`,
            }}>{bellCount}</span>
          )}
        </button>
      </div>
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, letterSpacing: '-0.01em' }}>{subtitle}</div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 2 }}>{title}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter chips
// ─────────────────────────────────────────────────────────────
function FilterChips({ items, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {items.map(it => {
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onChange?.(it.key)} style={{
            padding: '8px 14px', borderRadius: 999,
            background: isActive ? C.g1 : C.white,
            color: isActive ? C.white : C.text,
            border: `1.5px solid ${isActive ? C.g1 : C.line}`,
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            letterSpacing: '-0.01em',
          }}>{it.label}{it.count !== undefined && <span style={{ marginLeft: 6, opacity: 0.7 }}>({it.count})</span>}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Document upload row (KBIS / RC pro / décennale)
// ─────────────────────────────────────────────────────────────
function DocumentUploadRow({ label, status, filename, onUpload }) {
  const variants = {
    pending:   { bg: C.bg, border: C.line, fg: C.sub, label: 'À téléverser', icon: Icon.upload, iconColor: C.sub },
    uploaded:  { bg: '#FEF3C7', border: '#FDE68A', fg: '#92400E', label: 'En vérification', icon: Icon.clock, iconColor: '#92400E' },
    validated: { bg: '#D1FAE5', border: '#A7F3D0', fg: '#065F46', label: 'Validé', icon: Icon.checkCircle, iconColor: C.success },
    rejected:  { bg: '#FEE2E2', border: '#FECACA', fg: '#991B1B', label: 'Refusé — re-téléverser', icon: Icon.x, iconColor: C.danger },
  }[status];
  const I = variants.icon;
  return (
    <button onClick={onUpload} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: variants.bg,
      border: `1.5px solid ${variants.border}`,
      borderRadius: 14, padding: 14,
      width: '100%', textAlign: 'left', cursor: 'pointer',
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: status === 'validated' ? C.success : C.white,
        color: status === 'validated' ? C.white : variants.iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        border: status === 'validated' ? 'none' : `1.5px solid ${variants.border}`,
      }}>
        <I width={22} height={22}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text, letterSpacing: '-0.01em' }}>{label}</div>
        <div style={{ fontSize: 12, color: variants.fg, fontWeight: 600, marginTop: 2 }}>
          {filename ? `${filename} · ${variants.label}` : variants.label}
        </div>
      </div>
      <Icon.chevronRight width={18} height={18} stroke={C.sub}/>
    </button>
  );
}

Object.assign(window, {
  C, BatiSpotMark, BatiSpotLogo, GradientBand, Icon,
  Button, Badge, MetierBadge, ChantierCard, BottomNav,
  AppHeader, FilterChips, DocumentUploadRow,
});
