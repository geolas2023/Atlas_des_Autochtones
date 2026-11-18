// Atlas des Autochtones — Premières Nations, Métis et Inuits dans les sources de l'Amérique française : carte, filtres, chronologie, fiches.
// Version lue dans l'adresse du script (index.html : js/atlas.js?v=…) : à changer à chaque publication pour vider les caches.
const VERSION = (document.currentScript && new URL(document.currentScript.src).searchParams.get('v')) || '';
// Données : data/lieux.geojson (points ; propriétés décrites dans le README).

const COULEURS = {
  village: '#8b2e1f', evenement: '#b23a48', personnage: '#2f6f8f', famille: '#6a4c93',
  commerce: '#3f7f4f', religion: '#7a6a58', exploration: '#d17a22', rencontre: '#c8903e'
};
const CORPUS = { 'Cragin': { libelle: 'Carnets de F. W. Cragin', trait: '#1d2633' },
                 'Atlas Aubry': { libelle: 'Atlas Aubry (renvois)', trait: '#ffffff' },
                 'Recherches': { libelle: 'Recherches (web, littérature)', trait: '#3f7f4f' },
                 'Hafen': { libelle: 'Biographies de Hafen (Mountain Men)', trait: '#e2c27a' },
                 'Hafen MM': { libelle: 'Hafen, Mountain Men, vol. 2, 4-9 (dépouillement)', trait: '#9a6b1f' },
                 'Tassé': { libelle: "Tassé, Les Canadiens de l'Ouest (1878)", trait: '#6b2f6b' },
                 'Illinois français': { libelle: "L'Illinois français et le Midwest", trait: '#2f5d7c' },
                 'Atlas historique du Québec': { libelle: 'La francophonie nord-américaine (Atlas historique du Québec, 2012)', trait: '#c0392b' },
                 'Franco-Amérique': { libelle: 'Franco-Amérique (Louder et Waddell, 2008)', trait: '#e67e22' },
                 'Nouvelle-France': { libelle: 'Nouvelle-France : explorations (Margry, Johnson, Marchand)', trait: '#16a085' },
                 'Nouvelle-Angleterre': { libelle: 'Nouvelle-Angleterre : filatures (Vermette, MacDonald, Belisle)', trait: '#7f8c8d' },
                 "Piste de l'Oregon": { libelle: "La piste de l'Oregon (Bergeron)", trait: '#8e44ad' },
                 'Atlas Iberville': { libelle: "Atlas Iberville (renvois)", trait: '#2a7f7a' },
                 'Atlas Jolliet': { libelle: "Atlas Jolliet (renvois)", trait: '#7a4f1d' },
                 'Atlas Robidoux': { libelle: "Atlas Robidoux (renvois)", trait: '#2f4d63' } };
// Arborescence du filtre « Corpus » : groupes repliables (un corpus absent de la liste va dans « Autres sources »)
const GROUPES_CORPUS = [
  ['Témoignages et recherches', ['Cragin', 'Recherches']],
  ['Hafen et les montagnards', ['Hafen', 'Hafen MM']],
  ['Ouvrages de synthèse', ['Tassé', 'Atlas historique du Québec', 'Franco-Amérique', 'Nouvelle-France']],
  ['Régions', ['Illinois français', 'Nouvelle-Angleterre', "Piste de l'Oregon"]],
  ['Atlas du réseau (renvois)', ['Atlas Aubry', 'Atlas Iberville', 'Atlas Jolliet', 'Atlas Robidoux']]
];
// Vue d'ouverture de l'accueil du réseau : les États-Unis et le Canada (du Pacifique à l'Atlantique, du golfe du Mexique à la baie James)
const VUE_ACCUEIL = [[-128, 24], [-62, 58]];
const CERTITUDES = { certaine: 'certaine', approximative: 'approximative', hypothetique: 'hypothétique' };
const T_MIN = 1560, T_MAX = 2010;

const etat = {
  texte: '', corpus: new Set(Object.keys(CORPUS)), themes: new Set(Object.keys(COULEURS)),
  certitudes: new Set(Object.keys(CERTITUDES)), personne: null, debut: T_MIN, fin: T_MAX, toutes: true,
  nations: null  // ensemble des nations retenues (rempli au chargement)
};
const AIRES = {};  // nation → aire culturelle
let TOUTES = [], LIBELLES = {}, carte, appliquerFond = null;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const anneeTxt = v => Math.floor(v);

// ---------- Données ----------
async function charger() {
  const [lieux, themes] = await Promise.all([
    fetch('data/lieux.geojson?v=' + VERSION).then(r => r.json()),
    fetch('data/themes.json?v=' + VERSION).then(r => r.json())
  ]);
  LIBELLES = themes;
  // Bibliothèque archive.org : un corpus par livre (« archive.org · Morice (1908) »), déclaré à la volée
  lieux.features.forEach(f => {
    const k = f.properties.corpus;
    if (k && k.startsWith('archive.org') && !CORPUS[k]) { CORPUS[k] = { libelle: k.replace(/^archive\.org · /, ''), trait: '#5b6f8a' }; etat.corpus.add(k); }
  });
  // Un point par lieu : les fiches qui partagent exactement les mêmes coordonnées sont regroupées
  lieux.features.forEach(f => {
    const p = f.properties;
    const [x, y] = f.geometry.coordinates;
    p.lon0 = x; p.lat0 = y;
    p.cle = x.toFixed(4) + ',' + y.toFixed(4);
    p.lieu = String(p.nom || '').includes(' : ') ? p.nom.split(' : ')[0] : (p.nom || '');
    p.couleur = COULEURS[p.theme] || '#555';
    (p.nations || []).forEach((n, i) => { AIRES[n] = (p.aires || [])[i] || '—'; });
    p.trait = (CORPUS[p.corpus] || {}).trait || '#000';
    p.index = norm([p.nom, p.description, (p.personnages || []).join(' '), (p.nations || []).join(' '), (p.francophones || []).join(' '), p.note, p.date_edtf].join(' '));
  });
  TOUTES = lieux.features;
  etat.nations = new Set(TOUTES.flatMap(f => f.properties.nations || []));
}

function correspond(f) {
  const p = f.properties;
  if (!etat.corpus.has(p.corpus) || !etat.themes.has(p.theme) || !etat.certitudes.has(p.certitude)) return false;
  if (etat.personne && !(p.personnages || []).includes(etat.personne)) return false;
  if (!(p.nations || []).some(n => etat.nations.has(n))) return false;
  if (!etat.toutes && (p.fin < etat.debut || p.debut > etat.fin + 0.999)) return false;
  if (etat.texte) return etat.texte.split(/\s+/).every(m => p.index.includes(m));
  return true;
}

function filtrer() {
  const visibles = TOUTES.filter(correspond);
  carte.getSource('lieux')?.setData({ type: 'FeatureCollection', features: agreger(visibles) });
  $('#compteur').textContent = `${visibles.length} fiche${visibles.length > 1 ? 's' : ''} affichée${visibles.length > 1 ? 's' : ''} sur ${TOUTES.length}`;
  const bandeau = $('#bandeau-personne');
  if (etat.personne) {
    if (!bandeau) {
      const d = document.createElement('div'); d.id = 'bandeau-personne'; d.className = 'filtre-actif';
      $('#outils').prepend(d);
    }
    $('#bandeau-personne').innerHTML = `Personnage : <strong>${esc(etat.personne)}</strong> — <a href="#" id="retirer-pers">retirer</a>`;
    $('#retirer-pers').onclick = e => { e.preventDefault(); etat.personne = null; filtrer(); majListePers(); };
  } else bandeau?.remove();
  return visibles;
}

// Regroupe les fiches visibles en un point par lieu (taille selon le nombre de fiches)
function agreger(visibles) {
  const m = new Map();
  visibles.forEach(f => {
    const p = f.properties;
    if (!m.has(p.cle)) m.set(p.cle, []);
    m.get(p.cle).push(f);
  });
  LIEUX_VISIBLES = m;
  return [...m.entries()].map(([cle, fs]) => {
    const p0 = fs[0].properties;
    const themes = {};
    fs.forEach(f => { themes[f.properties.theme] = (themes[f.properties.theme] || 0) + 1; });
    const dominant = Object.entries(themes).sort((a, b) => b[1] - a[1])[0][0];
    const vague = fs.every(f => f.properties.certitude === 'hypothetique');
    const noms = {};
    fs.forEach(f => { noms[f.properties.lieu] = (noms[f.properties.lieu] || 0) + 1; });
    return { type: 'Feature', geometry: { type: 'Point', coordinates: [p0.lon0, p0.lat0] },
      properties: {
        cle, n: fs.length, id: fs.length === 1 ? p0.id : '',
        lieu: Object.entries(noms).sort((a, b) => b[1] - a[1])[0][0],
        nom: fs.length === 1 ? p0.nom : Object.entries(noms).sort((a, b) => b[1] - a[1])[0][0],
        couleur: fs.length === 1 ? p0.couleur : (COULEURS[dominant] || '#555'),
        trait: fs.length === 1 ? p0.trait : '#3b3328',
        certitude: vague ? 'hypothetique' : (fs.some(f => f.properties.certitude === 'certaine') ? 'certaine' : 'approximative'),
        corpus: fs.length === 1 ? p0.corpus : '',
        date_edtf: fs.length === 1 ? p0.date_edtf : ''
      } };
  });
}
let LIEUX_VISIBLES = new Map();

// Liste des fiches d'un lieu, regroupées par décennie, avec un filtre rapide
function afficherLieu(cle, idActif = null) {
  const fs = [...(LIEUX_VISIBLES.get(cle) || TOUTES.filter(f => f.properties.cle === cle))]
    .sort((a, b) => a.properties.debut - b.properties.debut || a.properties.nom.localeCompare(b.properties.nom, 'fr'));
  if (!fs.length) return;
  const noms = {};
  fs.forEach(f => { noms[f.properties.lieu] = (noms[f.properties.lieu] || 0) + 1; });
  const titre = Object.entries(noms).sort((a, b) => b[1] - a[1])[0][0];
  const vague = fs.every(f => f.properties.certitude === 'hypothetique');
  const parDecennie = new Map();
  fs.forEach(f => {
    const d = Number.isFinite(f.properties.debut) ? Math.floor(f.properties.debut / 10) * 10 : null;
    const k = d === null ? 'Sans date' : `${d}-${d + 9}`;
    if (!parDecennie.has(k)) parDecennie.set(k, []);
    parDecennie.get(k).push(f);
  });
  const livres = new Set(fs.map(f => f.properties.corpus)).size;
  $('#panneau').innerHTML = `<h2>${esc(titre)}</h2>
    <p class="meta">${fs.length} fiche${fs.length > 1 ? 's' : ''} · ${livres} source${livres > 1 ? 's' : ''} · selon les filtres et la période choisis</p>
    ${vague ? '<p class="note"><strong>Localisation approximative.</strong> Ce point représente une région ou un lieu imprécis, pas un emplacement exact.</p>' : ''}
    <input type="search" id="filtre-lieu" placeholder="Filtrer ces fiches (nom, année, livre)…" class="filtre-lieu">
    <div id="liste-lieu">${[...parDecennie.entries()].map(([k, l]) =>
      `<details class="decennie" open><summary>${esc(k)} <span class="mini">(${l.length})</span></summary><ul class="liste-fiches">${l.map(li).join('')}</ul></details>`).join('')}</div>`;
  const ctx = { feats: fs, titre, cle };
  brancherListe(ctx);
  $('#filtre-lieu').oninput = e => {
    const q = norm(e.target.value);
    document.querySelectorAll('#liste-lieu li').forEach(el => {
      const f = trouver(el.dataset.id);
      el.style.display = !q || f.properties.index.includes(q) || norm(f.properties.corpus).includes(q) ? '' : 'none';
    });
    document.querySelectorAll('#liste-lieu details').forEach(d => {
      d.style.display = [...d.querySelectorAll('li')].some(el => el.style.display !== 'none') ? '' : 'none';
    });
  };
  carte.getSource('selection').setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [fs[0].properties.lon0, fs[0].properties.lat0] }, properties: {} }] });
  if (idActif) document.querySelector(`#liste-lieu li[data-id="${CSS.escape(idActif)}"]`)?.scrollIntoView({ block: 'center' });
  else $('#panneau').scrollTop = 0;
}

// ---------- Interface : filtres ----------
function construireFiltres() {
  const nb = (cle, val) => TOUTES.filter(f => f.properties[cle] === val).length;
  const puceCorpus = k => ({'Cragin':'#1d2633','Atlas Aubry':'#8b2e1f','Recherches':'#3f7f4f','Hafen':'#b8902e'}[k] || CORPUS[k].trait);
  const ligneCorpus = k => `<label><input type="checkbox" data-corpus="${esc(k)}" checked> <i class="puce" style="background:#fff;border-color:${puceCorpus(k)}"></i>${esc(CORPUS[k].libelle)} <span class="mini">(${nb('corpus', k)})</span></label>`;
  const ranges = new Set(GROUPES_CORPUS.flatMap(g => g[1]));
  const archives = Object.keys(CORPUS).filter(k => k.startsWith('archive.org')).sort((a, b) => a.localeCompare(b, 'fr'));
  archives.forEach(k => ranges.add(k));
  const groupes = [...GROUPES_CORPUS, ['Bibliothèque archive.org', archives], ['Autres sources', Object.keys(CORPUS).filter(k => !ranges.has(k))]]
    .map(([titre, ks]) => [titre, ks.filter(k => CORPUS[k])]).filter(([, ks]) => ks.length);
  $('#f-corpus').innerHTML = groupes.map(([titre, ks], g) =>
    `<details class="groupe"><summary><input type="checkbox" data-groupe="${g}" checked title="Tout le groupe"> ${esc(titre)} <span class="mini">(${ks.reduce((s, k) => s + nb('corpus', k), 0)})</span></summary>
      <div class="groupe-corps">${ks.map(ligneCorpus).join('')}</div></details>`).join('');
  $('#f-themes').innerHTML = Object.entries(COULEURS).map(([k, c]) =>
    `<label><input type="checkbox" data-theme="${k}" checked> <i class="puce" style="background:${c}"></i>${esc(LIBELLES[k] || k)} <span class="mini">(${nb('theme', k)})</span></label>`).join('');
  $('#f-certitude').innerHTML = Object.entries(CERTITUDES).map(([k, v]) =>
    `<label><input type="checkbox" data-cert="${k}" checked> ${v} <span class="mini">(${nb('certitude', k)})</span></label>`).join('');
  const majGroupes = () => {
    document.querySelectorAll('[data-groupe]').forEach(cg => {
      const cs = [...cg.closest('details').querySelectorAll('[data-corpus]')], n = cs.filter(c => c.checked).length;
      cg.checked = n === cs.length; cg.indeterminate = n > 0 && n < cs.length;
    });
    const tous = document.querySelectorAll('[data-corpus]'), actifs = [...tous].filter(c => c.checked).length;
    $('#corpus-resume').textContent = actifs === tous.length ? `(tous, ${tous.length})` : `(${actifs} sur ${tous.length})`;
  };
  const changerCorpus = (c, on) => { c.checked = on; on ? etat.corpus.add(c.dataset.corpus) : etat.corpus.delete(c.dataset.corpus); };
  document.querySelectorAll('[data-corpus]').forEach(c => c.onchange = () => { changerCorpus(c, c.checked); majGroupes(); filtrer(); });
  document.querySelectorAll('[data-groupe]').forEach(cg => {
    cg.onclick = e => e.stopPropagation();  // cocher le groupe sans le déplier
    cg.onchange = () => { cg.closest('details').querySelectorAll('[data-corpus]').forEach(c => changerCorpus(c, cg.checked)); majGroupes(); filtrer(); };
  });
  const tousCorpus = on => { document.querySelectorAll('[data-corpus]').forEach(c => changerCorpus(c, on)); majGroupes(); filtrer(); };
  $('#corpus-tous').onclick = e => { e.preventDefault(); tousCorpus(true); };
  $('#corpus-aucun').onclick = e => { e.preventDefault(); tousCorpus(false); };
  majGroupes();
  document.querySelectorAll('[data-theme]').forEach(c => c.onchange = () => { c.checked ? etat.themes.add(c.dataset.theme) : etat.themes.delete(c.dataset.theme); filtrer(); });
  document.querySelectorAll('[data-cert]').forEach(c => c.onchange = () => { c.checked ? etat.certitudes.add(c.dataset.cert) : etat.certitudes.delete(c.dataset.cert); filtrer(); });
  const tousThemes = on => { document.querySelectorAll('[data-theme]').forEach(c => { c.checked = on; on ? etat.themes.add(c.dataset.theme) : etat.themes.delete(c.dataset.theme); }); filtrer(); };
  $('#themes-tous').onclick = e => { e.preventDefault(); tousThemes(true); };
  $('#themes-aucun').onclick = e => { e.preventDefault(); tousThemes(false); };
  let minuterie;
  construireNations();
  $('#recherche').oninput = e => { clearTimeout(minuterie); minuterie = setTimeout(() => { etat.texte = norm(e.target.value.trim()); filtrer(); }, 150); };
  $('#recherche-pers').oninput = majListePers;
  majListePers();
}

// Filtre « Nations », regroupé par grande aire culturelle (les aires viennent de scripts/nations.py)
function construireNations() {
  const compte = new Map();
  TOUTES.forEach(f => (f.properties.nations || []).forEach(n => compte.set(n, (compte.get(n) || 0) + 1)));
  const parAire = new Map();
  [...compte.keys()].forEach(n => { const a = AIRES[n] || '—'; if (!parAire.has(a)) parAire.set(a, []); parAire.get(a).push(n); });
  const aires = [...parAire.keys()].sort((a, b) => (a === '—') - (b === '—') || a.localeCompare(b, 'fr'));
  $('#f-nations').innerHTML = aires.map(a => `<div class="groupe-nation"><p class="aire">${esc(a === '—' ? 'Sans nation précisée' : a)}</p>${parAire.get(a).sort((x, y) => x.localeCompare(y, 'fr')).map(n =>
    `<label data-nom="${esc(norm(n))}"><input type="checkbox" data-nation="${esc(n)}" checked> ${esc(n)} <span class="mini">(${compte.get(n)})</span></label>`).join('')}</div>`).join('');
  const maj = () => { const t = document.querySelectorAll('[data-nation]'), a = [...t].filter(c => c.checked).length; $('#nations-resume').textContent = a === t.length ? `(toutes, ${t.length})` : `(${a} sur ${t.length})`; };
  document.querySelectorAll('[data-nation]').forEach(c => c.onchange = () => { c.checked ? etat.nations.add(c.dataset.nation) : etat.nations.delete(c.dataset.nation); maj(); filtrer(); });
  const toutes = on => { document.querySelectorAll('[data-nation]').forEach(c => { c.checked = on; on ? etat.nations.add(c.dataset.nation) : etat.nations.delete(c.dataset.nation); }); maj(); filtrer(); };
  $('#nations-tous').onclick = e => { e.preventDefault(); toutes(true); };
  $('#nations-aucun').onclick = e => { e.preventDefault(); toutes(false); };
  $('#recherche-nation').oninput = e => { const q = norm(e.target.value.trim()); document.querySelectorAll('#f-nations label').forEach(l => l.style.display = !q || l.dataset.nom.includes(q) ? '' : 'none'); };
  maj();
}
// Ne garder qu'une nation : depuis une fiche
function choisirNation(n) {
  document.querySelectorAll('[data-nation]').forEach(c => { c.checked = c.dataset.nation === n; });
  etat.nations = new Set([n]); $('#nations-resume').textContent = `(1 sur ${document.querySelectorAll('[data-nation]').length})`;
  const vis = filtrer(); cadrer(vis); afficherListe(vis, `Fiches : ${n}`);
}

function majListePers() {
  const compte = new Map();
  TOUTES.forEach(f => (f.properties.personnages || []).forEach(n => compte.set(n, (compte.get(n) || 0) + 1)));
  const q = norm($('#recherche-pers').value.trim());
  const liste = [...compte.entries()].filter(([n]) => !q || norm(n).includes(q))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
  $('#nb-pers').textContent = `(${compte.size})`;
  $('#liste-pers').innerHTML = liste.map(([n, c]) => `<li data-n="${esc(n)}" class="${n === etat.personne ? 'actif' : ''}">${esc(n)} <span>${c}</span></li>`).join('');
  document.querySelectorAll('#liste-pers li').forEach(li => li.onclick = () => choisirPersonne(li.dataset.n));
}

function choisirPersonne(n) {
  etat.personne = n; etat.toutes = true; $('#t-tout').checked = true; majPeriode();
  const vis = filtrer(); majListePers();
  cadrer(vis);
  afficherListe(vis, `Fiches liées à ${n}`);
}

function cadrer(feats) {
  if (!feats.length) return;
  const b = new maplibregl.LngLatBounds();
  feats.forEach(f => b.extend(f.geometry.coordinates));
  carte.fitBounds(b, { padding: 60, maxZoom: 9, duration: 700 });
}

// ---------- Chronologie ----------
function construireChrono() {
  const g = $('#graduation');
  const pos = v => `${(v - T_MIN) / (T_MAX - T_MIN) * 100}%`;
  // histogramme des fiches par décennie
  const dec = {};
  TOUTES.forEach(f => { const d = Math.floor(Math.min(T_MAX - 1, Math.max(T_MIN, f.properties.debut)) / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  const max = Math.max(...Object.values(dec));
  Object.entries(dec).forEach(([d, n]) => {
    const h = document.createElement('i'); h.className = 'histo';
    h.style.left = pos(+d + 5); h.style.height = `${4 + 14 * n / max}px`; h.title = `${d}-${+d + 9} : ${n} fiches`;
    g.appendChild(h);
  });
  for (let a = T_MIN; a <= T_MAX; a += 10) {
    const s = document.createElement('span'); s.style.left = pos(a); s.textContent = a % 50 === 0 ? a : '';
    if (a % 50) s.className = 'mineur';
    g.appendChild(s);
  }
  const d = $('#t-debut'), f = $('#t-fin');
  const maj = src => {
    if (+d.value > +f.value) { src === d ? f.value = d.value : d.value = f.value; }
    etat.debut = +d.value; etat.fin = +f.value; etat.toutes = false; $('#t-tout').checked = false;
    majPeriode(); filtrer();
  };
  d.oninput = () => maj(d); f.oninput = () => maj(f);
  $('#t-tout').onchange = e => { etat.toutes = e.target.checked; majPeriode(); filtrer(); };
  let anim = null;
  $('#lecture').onclick = () => {
    if (anim) { clearInterval(anim); anim = null; $('#lecture').textContent = '▶'; return; }
    const largeur = Math.max(5, (+f.value - +d.value) || 10);
    let a = etat.toutes ? 1790 : +d.value;
    $('#lecture').textContent = '❚❚';
    anim = setInterval(() => {
      a += 1;
      if (a + largeur > T_MAX) { clearInterval(anim); anim = null; $('#lecture').textContent = '▶'; return; }
      d.value = a; f.value = a + largeur; maj(d);
    }, 220);
  };
  majPeriode();
}
function majPeriode() {
  $('#periode').textContent = etat.toutes ? 'Toutes dates' : (etat.debut === etat.fin ? `${etat.debut}` : `${etat.debut} – ${etat.fin}`);
}

// ---------- Fiches ----------
function trouver(id) { return TOUTES.find(f => f.properties.id === id); }

function datation(p) {
  const d = anneeTxt(p.debut), f = anneeTxt(p.fin);
  return p.date_edtf ? `${p.date_edtf}` + (d !== f ? ` <span class="mini">(période affichée : ${d}–${f})</span>` : '') : (d === f ? d : `${d}–${f}`);
}

function afficherFiche(id, depuisListe = null) {
  const f = trouver(id); if (!f) return;
  const p = f.properties;
  const coulTheme = COULEURS[p.theme];
  const imgs = (p.images || []).map(im => `<figure><img src="${esc(im.src)}" alt="${esc(im.legende || p.nom)}" loading="lazy"><figcaption>${esc(im.legende || '')}</figcaption></figure>`).join('');
  const pers = (p.personnages || []).map(n => `<button type="button" data-p="${esc(n)}">${esc(n)}</button>`).join('');
  const memeLieu = TOUTES.filter(g => g !== f && Math.abs(g.properties.lon0 - p.lon0) < 1e-4 && Math.abs(g.properties.lat0 - p.lat0) < 1e-4);
  $('#panneau').innerHTML = `
    ${depuisListe ? '<button class="retour" id="retour">← retour à la liste</button>' : ''}
    <h2>${esc(p.nom)}</h2>
    <div>
      <span class="badge ${p.corpus === 'Cragin' ? 'Cragin' : p.corpus === 'Recherches' ? 'Recherches' : p.corpus === 'Hafen' || p.corpus === 'Hafen MM' ? 'Hafen' : p.corpus === 'Atlas Aubry' || p.corpus === 'Atlas Iberville' || p.corpus === 'Atlas Jolliet' || p.corpus === 'Atlas Robidoux' ? 'Aubry' : 'Recherches'}">${esc(p.corpus)}</span>
      <span class="badge" style="background:${coulTheme};color:#fff">${esc(LIBELLES[p.theme] || p.theme)}</span>
      <span class="badge ${esc(p.certitude)}">localisation ${esc(CERTITUDES[p.certitude] || p.certitude)}</span>
    </div>
    <p class="meta">Date : ${datation(p)} · précision : ${esc(p.precision || '—')} · ${p.lat0.toFixed(4)}, ${p.lon0.toFixed(4)}</p>
    <div class="nations-fiche">${(p.nations || []).map(n => `<button type="button" data-nation-fiche="${esc(n)}" title="Ne montrer que cette nation">${esc(n)}</button>`).join('')}</div>
    ${pers ? `<p class="mini">Personnes autochtones nommées :</p><div class="pers">${pers}</div>` : ''}
    ${(p.francophones || []).length ? `<p class="mini">Francophones de la fiche d'origine : ${esc(p.francophones.join(', '))}</p>` : ''}
    <div class="filet" aria-hidden="true">✦</div>
    <p class="description">${esc(p.description)}</p>
    ${p.transcription ? `<details><summary>Transcription</summary><p class="mini">${esc(p.transcription)}</p></details>` : ''}
    ${imgs}
    ${p.note ? `<p class="note"><strong>Note critique.</strong> ${esc(p.note)}</p>` : ''}
    <p class="sources"><strong>Sources.</strong> ${esc(p.sources)}</p>
    ${(p.voir_aussi || []).map(v => `<p><a class="lien-salle-fiche" href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.texte)}</a></p>`).join('')}
    ${memeLieu.length > 8 ? `<p><a href="#" id="voir-lieu">Voir les ${memeLieu.length + 1} fiches de ce lieu (${esc(p.lieu)}) →</a></p>`
      : memeLieu.length ? `<p class="mini">Autres fiches au même lieu :</p><ul class="liste-fiches">${memeLieu.map(li).join('')}</ul>` : ''}
    <p class="mini">Identifiant : ${esc(p.id)}</p>`;
  $('#panneau').scrollTop = 0;
  document.querySelectorAll('#panneau .pers button').forEach(b => b.onclick = () => choisirPersonne(b.dataset.p));
  document.querySelectorAll('#panneau [data-nation-fiche]').forEach(b => b.onclick = () => choisirNation(b.dataset.nationFiche));
  document.querySelectorAll('#panneau figure img').forEach(im => im.onclick = () => zoomImage(im.src, im.alt));
  brancherListe();
  if (depuisListe) $('#retour').onclick = () => depuisListe.cle ? afficherLieu(depuisListe.cle, id) : afficherListe(depuisListe.feats, depuisListe.titre);
  $('#voir-lieu')?.addEventListener('click', e => { e.preventDefault(); afficherLieu(p.cle, id); });
  history.replaceState(null, '', '#' + p.id);
  carte.getSource('selection').setData({ type: 'FeatureCollection', features: [f] });
}

const li = f => `<li data-id="${esc(f.properties.id)}"><i class="puce" style="background:${COULEURS[f.properties.theme]}"></i>${esc(f.properties.nom)}<div class="d">${esc(f.properties.date_edtf || anneeTxt(f.properties.debut))} · ${esc(f.properties.corpus)}</div></li>`;

function afficherListe(feats, titre, cle = null) {
  if (cle) return afficherLieu(cle);
  const tri = [...feats].sort((a, b) => a.properties.debut - b.properties.debut);
  $('#panneau').innerHTML = `<h2>${esc(titre)}</h2><p class="meta">${tri.length} fiche${tri.length > 1 ? 's' : ''}, par ordre chronologique</p><ul class="liste-fiches">${tri.map(li).join('')}</ul>`;
  brancherListe({ feats: tri, titre });
  $('#panneau').scrollTop = 0;
}
function brancherListe(ctx) {
  document.querySelectorAll('#panneau .liste-fiches li').forEach(el => el.onclick = () => {
    const f = trouver(el.dataset.id);
    afficherFiche(el.dataset.id, ctx || null);
    if (f && !carte.getBounds().contains(f.geometry.coordinates)) carte.easeTo({ center: f.geometry.coordinates });
  });
}

function zoomImage(src, alt) {
  let d = $('#zoom-img');
  if (!d) { d = document.createElement('dialog'); d.id = 'zoom-img'; document.body.appendChild(d); d.onclick = () => d.close(); }
  d.innerHTML = `<img src="${esc(src)}" alt="${esc(alt)}">`;
  d.showModal();
}

// ---------- Carte ----------
async function demarrer() {
  await charger();
  carte = new maplibregl.Map({
    container: 'carte', style: 'https://tiles.openfreemap.org/styles/positron',
    center: [-95, 42], zoom: 3.4, attributionControl: { compact: true }
  });
  carte.addControl(new maplibregl.NavigationControl(), 'top-right');
  carte.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  carte.on('load', async () => {
    const base = carte.getStyle().layers.map(l => l.id);
    carte.addSource('satellite', {
      type: 'raster', tileSize: 256, maxzoom: 19,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      attribution: 'Imagerie © Esri, Maxar, Earthstar Geographics'
    });
    carte.addLayer({ id: 'satellite', type: 'raster', source: 'satellite', layout: { visibility: 'none' } });

    // Contexte : piste de Santa Fe (Atlas Aubry), masquée par défaut
    carte.addSource('piste', { type: 'geojson', data: 'data/piste.geojson' });
    carte.addLayer({ id: 'piste-ligne', type: 'line', source: 'piste', filter: ['==', ['geometry-type'], 'LineString'],
      layout: { visibility: 'none', 'line-cap': 'round' },
      paint: { 'line-color': '#a8946f', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.5, 9, 4], 'line-opacity': .6 } });

    carte.addSource('lieux', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    carte.addSource('selection', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    carte.addLayer({ id: 'selection-halo', type: 'circle', source: 'selection',
      paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 11, 10, 17], 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#e2a000', 'circle-stroke-width': 3 } });
    carte.addLayer({ id: 'lieux', type: 'circle', source: 'lieux',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'],
          3, ['min', 26, ['+', 4, ['*', 1.25, ['sqrt', ['get', 'n']]]]],
          7, ['min', 32, ['+', 6, ['*', 1.6, ['sqrt', ['get', 'n']]]]],
          11, ['min', 40, ['+', 9, ['*', 2, ['sqrt', ['get', 'n']]]]]],
        'circle-color': ['get', 'couleur'],
        'circle-opacity': ['match', ['get', 'certitude'], 'certaine', 0.9, 'approximative', 0.75, 0.35],
        'circle-stroke-color': ['case', ['==', ['get', 'certitude'], 'hypothetique'], '#7a6a55', ['get', 'trait']],
        'circle-stroke-width': ['case', ['==', ['get', 'certitude'], 'hypothetique'], 2.2, ['>', ['get', 'n'], 1], 1.4, ['==', ['get', 'corpus'], 'Atlas Aubry'], 1.8, 1.1]
      } });
    carte.addLayer({ id: 'lieux-compte', type: 'symbol', source: 'lieux', filter: ['>', ['get', 'n'], 1],
      layout: { 'text-field': ['to-string', ['get', 'n']], 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 10, 12], 'text-allow-overlap': true },
      paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,.45)', 'text-halo-width': 1 } });
    carte.addLayer({ id: 'lieux-noms', type: 'symbol', source: 'lieux', minzoom: 7.5,
      layout: { 'text-field': ['get', 'lieu'], 'text-size': 11, 'text-offset': [0, 1.4], 'text-anchor': 'top', 'text-max-width': 14, 'text-optional': true },
      paint: { 'text-color': '#3b3328', 'text-halo-color': '#ffffff', 'text-halo-width': 1.4 } });

    appliquerFond = installerFonds(carte, base, 'satellite');
    const fondInitial = document.querySelector('input[name=fond]:checked').value;
    await appliquerFond(fondInitial);
    document.querySelectorAll('input[name=fond]').forEach(r => r.onchange = () => appliquerFond(r.value));
    $('#c-piste').onchange = e => carte.setLayoutProperty('piste-ligne', 'visibility', e.target.checked ? 'visible' : 'none');

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 });
    carte.on('mousemove', 'lieux', e => {
      carte.getCanvas().style.cursor = 'pointer';
      const p = e.features[0].properties;
      popup.setLngLat(e.lngLat).setHTML(p.n > 1
        ? `<strong>${esc(p.lieu)}</strong><br><span class="mini">${p.n} fiches${p.certitude === 'hypothetique' ? ' · localisation approximative' : ''}</span>`
        : `<strong>${esc(p.nom)}</strong><br><span class="mini">${esc(p.date_edtf)} · ${esc(p.corpus)}</span>`).addTo(carte);
    });
    carte.on('mouseleave', 'lieux', () => { carte.getCanvas().style.cursor = ''; popup.remove(); });
    carte.on('click', e => {
      const r = 6, pt = e.point;
      const sous = carte.queryRenderedFeatures([[pt.x - r, pt.y - r], [pt.x + r, pt.y + r]], { layers: ['lieux'] });
      if (!sous.length) return;
      const cles = [...new Set(sous.map(s => s.properties.cle))];
      if (cles.length === 1) {
        const p = sous[0].properties;
        if (p.n === 1 && p.id) afficherFiche(p.id); else afficherLieu(p.cle);
      } else {
        const fs = cles.flatMap(c => LIEUX_VISIBLES.get(c) || []);
        afficherListe(fs, `${fs.length} fiches à cet endroit (${cles.length} lieux voisins)`);
      }
    });

    construireFiltres();
    construireChrono();
    const vis = filtrer();
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && trouver(id)) { afficherFiche(id); carte.jumpTo({ center: trouver(id).geometry.coordinates, zoom: 8 }); }
    else carte.fitBounds(VUE_ACCUEIL, { padding: 0, duration: 0 });
  });

  $('#btn-apropos').onclick = () => $('#apropos').showModal();
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const f = trouver(id);
    if (f) { afficherFiche(id); carte.easeTo({ center: f.geometry.coordinates }); }
  });
}

// ---------- Accueil du réseau « Atlas de l'Amérique française » ----------
// Les atlas du réseau sont décrits dans data/atlas.json ; ajouter un atlas = ajouter une entrée.
let ACCUEIL = null;
async function chargerReseau() {
  try {
    const reg = await fetch('data/atlas.json?v=' + VERSION).then(r => r.json());
    const carte1 = a => {
      const prep = a.statut !== 'en_ligne';
      const base = a.ici ? '' : a.url;
      const pages = (a.pages || []).map(p => `<a href="${esc(a.ici ? p.href : new URL(p.href, a.url).href)}">${esc(p.fr)}</a>`).join('');
      const etiq = a.ici ? '<span class="etiq">vous êtes ici</span>' : prep ? '<span class="etiq prep">en préparation</span>' : '';
      const lien = a.ici ? './' : a.url;
      return `<details class="atlas-carte${prep ? ' prep' : ''}" style="--c:${esc(a.couleur)}">
        <summary><span class="nom-atlas">${esc(a.titre.fr)}</span>${etiq} <span class="mini">· ${esc(a.periode || '')}</span></summary>
        <p class="sous">${esc(a.sous_titre.fr)}</p>
        <p>${esc(a.description.fr)}</p>
        ${pages ? `<p class="pages">${pages}</p>` : ''}
        ${a.ici ? '' : `<p><a class="ouvrir-atlas" href="${esc(lien)}">${prep ? 'Voir le dossier →' : "Ouvrir l'atlas →"}</a></p>`}</details>`;
    };
    const groupe = (type, titre) => { const as = reg.atlas.filter(a => a.type === type); return as.length ? `<p class="mini">${titre}</p>` + as.map(carte1).join('') : ''; };
    $('#atlas-reseau').innerHTML = groupe('thematique', 'Atlas thématique') + groupe('personnage', 'Atlas de personnages') + groupe('famille', 'Atlas de familles');
  } catch (e) { console.warn('Registre des atlas indisponible', e); }
  ACCUEIL = $('#panneau').innerHTML;
}
function afficherAccueil() {
  if (ACCUEIL) $('#panneau').innerHTML = ACCUEIL;
  $('#panneau').scrollTop = 0;
  history.replaceState(null, '', location.pathname);
  if (carte && carte.getSource && carte.getSource('selection')) carte.getSource('selection').setData({ type: 'FeatureCollection', features: [] });
  if (carte && carte.fitBounds) carte.fitBounds(VUE_ACCUEIL, { padding: 0, duration: 1200 });
}
chargerReseau();
document.getElementById('btn-atlas').onclick = afficherAccueil;

demarrer();
