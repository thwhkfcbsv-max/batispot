// BatiSpot Artisan PWA — Screen components

const SAMPLE_CHANTIERS = [
  {
    id: 1, metier: 'Plomberie', urgent: true,
    title: 'Remplacement chauffe-eau 200L appartement',
    zone: 'Paris 11e', distance: '4,2 km', budget: '850',
    posted: 'il y a 12 min',
    img: './photos/immeuble-paris.jpg',
    description: 'Chauffe-eau électrique en panne depuis 3 jours. Logement T3 au 4e étage avec ascenseur. Accès facile, arrivée d\'eau accessible. Locataire présent en journée.',
    client: { name: 'Marie L.', rating: 4.8, jobs: 7 },
    surface: '65m²', urgency: 'Sous 48h', when: 'Cette semaine',
  },
  {
    id: 2, metier: 'Électricité',
    title: 'Mise aux normes tableau électrique pavillon',
    zone: 'Vincennes (94)', distance: '8,7 km', budget: '1 200',
    posted: 'il y a 47 min',
    img: './photos/dpe-compteur.jpg',
    description: 'Tableau électrique vétuste à remplacer. Maison 110m² R+1. Diagnostic électrique récent disponible.',
    client: { name: 'Thomas P.', rating: 4.9, jobs: 12 },
    surface: '110m²', urgency: 'Flexible', when: 'Sous 2 semaines',
  },
  {
    id: 3, metier: 'Cuisine',
    title: 'Pose cuisine équipée 12m² + plomberie',
    zone: 'Boulogne (92)', distance: '11 km', budget: '2 800',
    posted: 'il y a 2 h',
    img: './photos/cuisine.jpg',
    description: 'Pose complète cuisine équipée IKEA, livraison déjà faite. Évier, lave-vaisselle, plaque induction et hotte à raccorder.',
    client: { name: 'Sophie R.', rating: 5.0, jobs: 3 },
    surface: '12m²', urgency: 'Flexible', when: 'Mois prochain',
  },
  {
    id: 4, metier: 'Couverture',
    title: 'Réparation fuite toiture après tempête',
    zone: 'Saint-Maur (94)', distance: '14 km', budget: '650',
    posted: 'il y a 3 h',
    img: './photos/combles.jpg',
    description: 'Tuiles déplacées suite vent fort. Infiltration localisée au-dessus chambre. Maison plain-pied, accès toit possible.',
    client: { name: 'Karim B.', rating: 4.7, jobs: 5 },
    surface: '95m²', urgency: 'Urgent', when: 'Cette semaine',
  },
];

// ─────────────────────────────────────────────────────────────
// SCREEN 1 — Onboarding (présentation)
// ─────────────────────────────────────────────────────────────
function OnboardingScreen({ onContinue, safeTop = 50 }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.g1, color: C.white, position: 'relative', overflow: 'hidden' }}>
      <GradientBand height={6}/>
      <div style={{ position: 'absolute', top: 80, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,130,.3) 0%, transparent 70%)' }}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `${safeTop + 12}px 24px 32px`, position: 'relative', zIndex: 1 }}>
        <div>
          <BatiSpotLogo height={28} onDark/>
        </div>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(252,211,77,0.18)', color: C.yellow,
            padding: '6px 12px', borderRadius: 999,
            fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
            marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, background: C.yellow, borderRadius: 999 }}/>
            14 jours d'essai gratuit
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', margin: 0 }}>
            Trouvez vos chantiers en <span style={{ color: C.yellow }}>Île-de-France.</span>
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.45, marginTop: 16, marginBottom: 0, letterSpacing: '-0.01em' }}>
            Plus de 240 demandes de particuliers chaque semaine. Choisissez les chantiers près de chez vous, devisez en 2 minutes.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 28 }}>
            {[
              { n: '240+', l: 'chantiers/sem.' },
              { n: '4,8/5', l: 'note artisans' },
              { n: '39€', l: 'par mois HT' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.yellow, letterSpacing: '-0.02em' }}>{s.n}</div>
                <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Button variant="yellow" size="lg" full onClick={onContinue} trailing={<Icon.chevronRight width={18} height={18}/>}>
            Commencer mon inscription
          </Button>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, opacity: 0.7 }}>
            Déjà inscrit ? <span style={{ color: C.yellow, fontWeight: 700 }}>Se connecter</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            <span style={{ width: 24, height: 4, background: C.yellow, borderRadius: 2 }}/>
            <span style={{ width: 6, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }}/>
            <span style={{ width: 6, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2 — Upload documents
// ─────────────────────────────────────────────────────────────
function UploadDocsScreen({ onBack, onContinue, safeTop = 50 }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.line}`, paddingTop: safeTop }}>
        <GradientBand height={4}/>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: C.text }}>
            <Icon.chevronLeft width={22} height={22}/>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Étape 3 sur 3</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Pièces justificatives</div>
          </div>
        </div>
        <div style={{ height: 4, background: C.line, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, width: '100%', background: `linear-gradient(90deg, ${C.g1}, ${C.g4})` }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 16px', paddingBottom: 100 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.025em', color: C.text, margin: 0, lineHeight: 1.15 }}>
          On vérifie vos documents pro
        </h1>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginTop: 8, marginBottom: 24 }}>
          Validation sous 24h ouvrées. Tant qu'au moins un document est en attente, vous accédez à la liste des chantiers en lecture seule.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DocumentUploadRow label="Extrait KBIS" status="validated" filename="kbis_2026.pdf"/>
          <DocumentUploadRow label="Attestation RC Pro" status="uploaded" filename="rc_pro_axa.pdf"/>
          <DocumentUploadRow label="Garantie décennale" status="pending"/>
          <DocumentUploadRow label="Pièce d'identité" status="rejected" filename="cni.jpg"/>
        </div>
        <div style={{
          background: C.white, borderRadius: 14, padding: 14,
          border: `1px solid ${C.line}`, marginTop: 20,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', color: C.g1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon.shield width={20} height={20}/>
          </div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.45 }}>
            Documents stockés chiffrés en France (OVHcloud). Visibles uniquement par notre équipe vérification.
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px 28px', background: C.white, borderTop: `1px solid ${C.line}` }}>
        <Button variant="primary" size="lg" full onClick={onContinue} trailing={<Icon.chevronRight width={18} height={18}/>}>
          Activer mon compte (39€/mois)
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 3 — Dashboard (chantiers feed)
// ─────────────────────────────────────────────────────────────
function DashboardScreen({ onChantierClick, platform, safeTop = 50 }) {
  const [filter, setFilter] = React.useState('all');
  const [tab, setTab] = React.useState('chantiers');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative' }}>
      <AppHeader
        safeTop={safeTop}
        subtitle="Bonjour Mehdi 👋"
        title="4 nouveaux chantiers près de vous"
        bellCount={3}
      />
      <div style={{ background: C.white, borderBottom: `1px solid ${C.line}` }}>
        <FilterChips
          active={filter}
          onChange={setFilter}
          items={[
            { key: 'all', label: 'Tous', count: 24 },
            { key: 'plomberie', label: 'Plomberie', count: 8 },
            { key: 'elec', label: 'Électricité', count: 6 },
            { key: 'urgent', label: 'Urgent', count: 3 },
            { key: 'proche', label: '< 5km', count: 5 },
          ]}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: C.sub, textTransform: 'uppercase', marginTop: 4 }}>
          Disponibles · 4
        </div>
        {SAMPLE_CHANTIERS.map(c => <ChantierCard key={c.id} chantier={c} onClick={() => onChantierClick?.(c)}/>)}
        <div style={{ height: 8 }}/>
      </div>
      {platform === 'android' && (
        <button style={{
          position: 'absolute', right: 16, bottom: 90,
          width: 56, height: 56, borderRadius: 16,
          background: C.t1, color: C.white, border: 'none',
          boxShadow: '0 6px 20px rgba(10,114,101,.42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10,
        }}>
          <Icon.filter width={22} height={22}/>
        </button>
      )}
      <BottomNav active={tab} onChange={setTab} platform={platform}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 4 — Fiche chantier
// ─────────────────────────────────────────────────────────────
function ChantierDetailScreen({ chantier, onBack, onAccept, safeTop = 50 }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative' }}>
      <div style={{ position: 'relative', height: 220 + safeTop, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: `url('${chantier.img}') center/cover, ${C.g2}` }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,31,23,0.55) 0%, transparent 40%, rgba(15,31,23,0.5) 100%)' }}/>
        <GradientBand height={4}/>
        <div style={{ position: 'absolute', top: safeTop + 8, left: 14, right: 14, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            width: 40, height: 40, borderRadius: 999,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.text,
          }}>
            <Icon.chevronLeft width={20} height={20}/>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {chantier.urgent && <Badge variant="urgent" size="sm">Urgent</Badge>}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
          <MetierBadge metier={chantier.metier}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 110px', background: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.025em', color: C.text, margin: 0, lineHeight: 1.2 }}>
          {chantier.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.sub, fontSize: 13, fontWeight: 600, marginTop: 8 }}>
          <Icon.mapPin width={14} height={14}/> {chantier.zone} · {chantier.distance}
          <span style={{ margin: '0 4px' }}>·</span>
          <Icon.clock width={13} height={13}/> {chantier.posted}
        </div>
        <div style={{
          background: C.bg, borderRadius: 14, padding: 16, marginTop: 16,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
          border: `1px solid ${C.line}`,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Budget client</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.g1, letterSpacing: '-0.02em', marginTop: 2 }}>{chantier.budget}€</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Surface</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>{chantier.surface}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Délai souhaité</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>{chantier.when}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Urgence</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>{chantier.urgency}</div>
          </div>
        </div>
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</div>
          <p style={{ fontSize: 15, color: C.text, lineHeight: 1.55, marginTop: 8, marginBottom: 0 }}>
            {chantier.description}
          </p>
        </div>
        <div style={{ marginTop: 22, padding: 14, background: C.bg, borderRadius: 14, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: C.g4, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>
            {chantier.client.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{chantier.client.name}</div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Icon.star width={12} height={12} stroke={C.warning} fill={C.warning}/> {chantier.client.rating} · {chantier.client.jobs} chantiers BatiSpot
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px 28px', background: C.white, borderTop: `1px solid ${C.line}`, display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="lg" leading={<Icon.message width={18} height={18}/>}>Question</Button>
        <Button variant="primary" size="lg" full onClick={onAccept}>
          J'accepte ce chantier
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 5 — Profil artisan
// ─────────────────────────────────────────────────────────────
function ProfilScreen({ platform, safeTop = 50 }) {
  const [tab, setTab] = React.useState('profil');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative' }}>
      <div style={{ background: C.g1, color: C.white, paddingTop: safeTop }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>Profil</div>
          <button style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: C.white, padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Modifier
          </button>
        </div>
        <div style={{ padding: '8px 20px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: C.g4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: C.white, border: '3px solid rgba(255,255,255,0.2)' }}>
            MB
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>Mehdi Benali</div>
            <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 600, marginTop: 2 }}>Plombier-chauffagiste · SARL Benali Plomberie</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Icon.star width={13} height={13} stroke={C.yellow} fill={C.yellow}/>
              <span style={{ fontSize: 13, fontWeight: 800 }}>4,9</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>· 27 chantiers</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 100px' }}>
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.line}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Métiers</div>
            <button style={{ background: 'none', border: 'none', color: C.t1, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter</button>
          </div>
          <div style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <MetierBadge metier="Plomberie"/>
            <MetierBadge metier="Électricité"/>
            <MetierBadge metier="Cuisine"/>
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.line}`, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zone d'intervention</div>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Paris + 75 / 92 / 93 / 94</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>Rayon 25 km autour de Vincennes</div>
            <div style={{ marginTop: 12, height: 6, background: C.line, borderRadius: 999, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, width: '60%', height: '100%', background: C.t1, borderRadius: 999 }}/>
              <div style={{ position: 'absolute', left: '60%', top: -6, width: 18, height: 18, background: C.t1, borderRadius: 999, border: `3px solid ${C.white}`, boxShadow: '0 2px 6px rgba(0,0,0,.2)', transform: 'translateX(-50%)' }}/>
            </div>
          </div>
        </div>

        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.line}`, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Disponibilités</div>
            <Badge variant="accepted" size="sm">Disponible</Badge>
          </div>
          <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {['L','M','M','J','V','S','D'].map((d, i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 8,
                background: i < 5 ? C.g4 : C.line,
                color: i < 5 ? C.white : C.sub,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
              }}>{d}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 14, border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ce mois</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.g1, letterSpacing: '-0.025em', marginTop: 6 }}>4 980€</div>
            <div style={{ fontSize: 12, color: C.success, fontWeight: 700, marginTop: 2 }}>+ 12% vs mars</div>
          </div>
          <div style={{ background: C.white, borderRadius: 14, padding: 14, border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Taux acceptation</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.g1, letterSpacing: '-0.025em', marginTop: 6 }}>78%</div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginTop: 2 }}>21 / 27 devis</div>
          </div>
        </div>
      </div>
      <BottomNav active={tab} onChange={setTab} platform={platform}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 6 — Notifications
// ─────────────────────────────────────────────────────────────
function NotificationsScreen({ onBack, platform, safeTop = 50 }) {
  const items = [
    { id: 1, type: 'chantier', icon: Icon.briefcase, color: C.g1, title: 'Nouveau chantier près de chez vous', body: 'Plomberie · Paris 11e · 850€ budget', when: 'il y a 12 min', unread: true },
    { id: 2, type: 'message', icon: Icon.message, color: C.t1, title: 'Sophie R. a répondu', body: '« Parfait, lundi 9h ça me va. À demain ! »', when: 'il y a 1 h', unread: true },
    { id: 3, type: 'validated', icon: Icon.checkCircle, color: C.success, title: 'Devis accepté par Thomas P.', body: 'Mise aux normes tableau · 1 200€', when: 'il y a 3 h', unread: true },
    { id: 4, type: 'doc', icon: Icon.shield, color: C.info, title: 'KBIS validé', body: 'Votre extrait est à jour pour 12 mois', when: 'hier' },
    { id: 5, type: 'subscription', icon: Icon.card, color: C.sub, title: 'Prélèvement du mois effectué', body: '39€ HT · facture disponible', when: 'il y a 2 j' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative' }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.line}`, paddingTop: safeTop }}>
        <GradientBand height={4}/>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: C.text }}>
            <Icon.chevronLeft width={22} height={22}/>
          </button>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Notifications</div>
          <button style={{ background: 'none', border: 'none', color: C.t1, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Tout lu</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0 100px' }}>
        {items.map((it, i) => {
          const I = it.icon;
          return (
            <div key={it.id} style={{
              display: 'flex', gap: 12, padding: '14px 16px',
              background: it.unread ? '#F0FDF4' : 'transparent',
              borderBottom: `1px solid ${C.line}`,
              position: 'relative',
            }}>
              {it.unread && <span style={{ position: 'absolute', left: 6, top: 22, width: 6, height: 6, background: C.t1, borderRadius: 999 }}/>}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${it.color}1A`, color: it.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <I width={20} height={20}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{it.title}</div>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', paddingTop: 2 }}>{it.when}</div>
                </div>
                <div style={{ fontSize: 13, color: C.sub, fontWeight: 500, marginTop: 2, lineHeight: 1.4 }}>{it.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav active="messages" onChange={() => {}} platform={platform}/>
    </div>
  );
}

Object.assign(window, {
  SAMPLE_CHANTIERS,
  OnboardingScreen, UploadDocsScreen, DashboardScreen,
  ChantierDetailScreen, ProfilScreen, NotificationsScreen,
});
