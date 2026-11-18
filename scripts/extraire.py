"""Atlas des Autochtones : repérage des Premières Nations, Métis et Inuits dans les fiches de l'Atlas de
l'Amérique française (Les Canadiens français de l'Ouest), avec la même source et le même lien.

Usage : python3 scripts/extraire.py ../atlas-les-canadiens-fran-ais-de-l-ouest/data/lieux.geojson
Écrit data/lieux.geojson. Les fiches gardent la date, les coordonnées, la source et le lien de la fiche
d'origine ; la description d'origine est reprise telle quelle (aucun nom n'est ajouté)."""
import json, re, sys, os, collections
sys.path.insert(0, os.path.dirname(__file__))
from nations import NATIONS

ICI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL_FR = 'https://geolas2023.github.io/Atlas-Les-Canadiens-Fran-ais-de-l-Ouest/index.html#'

# ---------- repérage des nations ----------
LIEU_AVANT = re.compile(r"(?:\b(?:fort|forts|rivière|rivières|river|lac|lake|comté|county|mont|monts|mount|col|vallée|valley|baie|île|chutes|falls|pass|passe|crique|ruisseau|bayou|prairie|plaine|pointe|cap|portage|sentier|piste|trail|route|city|ville|station|gare|agence|agency|réserve|mission|little|big|grand|grande|petit|petite|north|south|upper|lower|township)\s+(?:de la |des |du |de l'|de |d'|aux |à la )?)$", re.I)
LIEU_APRES = re.compile(r"^(?:\s+(?:river|county|city|creek|falls|lake|valley|pass|rapids|crossing|agency|springs|mountains?|hills?|buttes?|bend|landing|prairie|plains|point|trail|street|avenue|reservation|indian reservation)\b|\s*\((?:washington|oregon|idaho|kansas|missouri|iowa|nebraska|dakota|montana|wyoming|colorado|utah|illinois|indiana|ohio|michigan|wisconsin|minnesota|oklahoma|texas|mississippi|louisiane|alabama|arkansas|californie|nevada|arizona|nouveau-mexique|ontario|québec|manitoba|saskatchewan|alberta|colombie))", re.I)
CTX_AVANT = re.compile(r"(?:\b(?:indiens?|indiennes?|sauvages?|sauvagesses?|tribus?|nations?|bandes?|chefs?|guerriers?|femmes?|filles?|fils|villages?|camps?|campements?|loges?|wigwams?|tentes|peuple|chez les|parmi les|contre les|avec les|par les|aux mains des|guerre (?:des|aux|contre les|avec les)|agent des|interprète des|interprète chez les|captifs? des|captive des|traite (?:avec|chez) les|mission (?:des|chez les|auprès des)|missionnaire des|missionnaire chez les|massacre des|attaque des|attaqués? par les|tués? par les|tuée par les|conseil des|conseil avec les|paix avec les|traité avec les|langue des|pays des|une|un|jeune|vieux|vieille|deux|trois|quelques|plusieurs|cent|mille))\s+(?:[\w'’-]+\s+){0,1}$", re.I)
CTX_APRES = re.compile(r"^\s+(?:indiens|indians|guerriers|warriors|sauvages|chiefs?)\b", re.I)
EXCL_ILLINOIS = re.compile(r"\b(?:aux|pays des|colonie des|poste des|commandant des|commandant aux|gouverneur des|curé des|établissements? des|villages? français des|missions? des)\s+$", re.I)

FORMES = []
for canon, aire, motif, ambigu in NATIONS:
    FORMES.append((canon, aire, re.compile(r"(?<![\w'’-])(?:" + motif + r")(?![\w'’-])", re.I), ambigu))

def nations_dans(texte):
    """Liste ordonnée des (nation, début, fin) repérées dans un texte."""
    trouve = []
    pris = []
    for canon, aire, rx, ambigu in FORMES:
        for m in rx.finditer(texte):
            a, b = m.start(), m.end()
            if any(a < y and b > x for x, y in pris): continue
            avant, apres = texte[max(0, a - 45):a], texte[b:b + 40]
            mot = m.group(0)
            # « fort Chicacha » (lieu) mais « fort chicacha », « mission osage » (adjectif : la nation)
            if (mot[0].isupper() or canon.startswith(('Autochtones', 'Métis'))) and (LIEU_AVANT.search(avant) or LIEU_APRES.match(apres)): continue
            if mot[0].islower() and mot.lower() in ('cris', 'crie', 'cries', 'creeks', 'tejas', 'texas', 'cenis', 'esclaves', 'castors', 'porteurs', 'carriers', 'lièvres', 'loups', 'serpents', 'snakes', 'corbeaux', 'renards', 'puants', 'rees', 'ris', 'oumas', 'tomés', 'yumas', 'keres', 'arkansas', 'kansas', 'illinois', 'delawares', 'miamis'):
                if not re.search(r"\b(?:femme|fille|épouse|mère|veuve|jeune|une|squaw|langue|nation|tribu|indiens?|indienne)\s+$", avant, re.I): continue
            if ambigu:
                if not (CTX_AVANT.search(avant) or CTX_APRES.match(apres)): continue
                if canon.startswith('Illinois') and EXCL_ILLINOIS.search(avant): continue
                if canon.startswith('Autochtones') and mot.lower() == 'sauvage' and not re.search(r"\b(?:un|une|le|la|du|jeune|vieux|vieille|chef)\s+$", avant, re.I): continue
                if canon.startswith('Autochtones') and re.match(r"^\s+(?:chevaux|chevaux|bêtes|animaux|cerises|riz|pays|vie|état|contrée)", apres, re.I): continue
            pris.append((a, b))
            trouve.append((canon, a, b))
    trouve.sort(key=lambda t: t[1])
    return trouve

AIRE = {c: a for c, a, _, _ in NATIONS}

# ---------- noms de personnes autochtones (motifs serrés, rien n'est inventé) ----------
NOMPROPRE = r"[A-ZÀ-Ý][\w'’-]+(?:\s(?:[A-ZÀ-Ý][\w'’-]+|de|du|des|la|le|of|the)){0,3}(?<!\sde)(?<!\sdu)(?<!\sdes)(?<!\sla)(?<!\sle)(?<!\sof)(?<!\sthe)"
MOTS_NON = set("""Le La Les Un Une Des Du De Il Elle Ils Sa Son Ses Saint Sainte Fort Rivière Lac Mission Père Pères Mgr Monseigneur Dieu
Il Après Avant Selon Vers En Au Aux Dans Sur Sous Avec Chez Par Pour Plus Puis Mais Quand Ce Cette Ces Leur Leurs On Où
Indiens Indien Indienne Sauvages Sauvage Américains Américain Canadiens Canadien Français Française Anglais Espagnols Espagnol
Mexicains Mexicain Blancs Compagnie CBH Nord-Ouest Hudson American Fur Company D'après Sa Biographie Autres Lieux""".split())

NAT_BRUT = [rx for _, _, rx, _ in FORMES]
LIEUX_CONNUS = set()

def est_nation(n):
    return any(rx.fullmatch(n) or rx.fullmatch(n.rstrip('s')) for rx in NAT_BRUT) or (len(n.split()) == 1 and any(rx.search(n) for rx in NAT_BRUT[:-1]))

def noms_autochtones(texte, francophones):
    noms = []
    def ajoute(n, strict=False):
        n = n.strip(" ,.;:\"'’").strip()
        q = n.strip('« »')
        if not q or q.split()[0] in MOTS_NON or q.split()[-1] in MOTS_NON: return
        if n.startswith('«') and (not q[0].isupper() or re.search(r"\b(?:a|the|of|an|le|la|les|un|une|du|des)\b", q.split(' ', 1)[0] + ' ' + q) and len(q.split()) > 3): return
        if strict and q in LIEUX_CONNUS: return
        if est_nation(q) or re.search(r"\b(?:Fort|River|Creek|County|Saint|Lac|Rivière|Trace|Company|Compagnie)\b", q): return
        bas = q.lower()
        for f in francophones:
            fl = f.lower()
            if bas in fl or fl in bas or any(len(t) > 3 and t in fl.split() for t in bas.split()): return
        if q not in noms: noms.append(q)
    NOM = r"(« ?[^»]{2,40}? ?»|" + NOMPROPRE + r")"
    # « le chef Nom », « le chef sioux Nom », « chef de guerre Nom »
    for m in re.finditer(r"\bchefs? (?:de guerre |du village |de la bande )?(?:([a-zé'-]+) )?(?:nommé |appelé |dit )?" + NOM, texte):
        if m.group(1) and not nations_dans(m.group(1)) and m.group(1) not in ('nommé', 'appelé', 'dit'): continue
        ajoute(m.group(2))
    # « Nom, chef des Arapahos », « Nom, (jeune) femme crie », « Nom (Marie), fille de Nom des Brûlés »
    for m in re.finditer(r"(?:^|[\s(;])" + NOM + r"(?: \([^)]{1,30}\))?,\s+(?:un |une |le |la |sa |son |jeune |vieux |vieille |grand |grande )*(chef|femme|fille|guerrier|épouse|veuve|squaw|sauvagesse|Indienne|Indien|métisse)\b", texte):
        if re.search(r"\b(?:du|de|des|au|aux|à|la|le|en|sur|d'|l')\s*$", texte[max(0, m.start(1) - 6):m.start(1)]): continue
        if nations_dans(texte[m.end():m.end() + 45]) or m.group(2) in ('squaw', 'sauvagesse', 'Indienne', 'Indien', 'métisse'): ajoute(m.group(1), True)
    # « les chefs oglalas A, B, C et D »
    for m in re.finditer(r"\bchefs (?:[a-zé'-]+ )?((?:" + NOMPROPRE + r", )*" + NOMPROPRE + r" et " + NOMPROPRE + r")", texte):
        for n in re.split(r", | et ", m.group(1)): ajoute(n)
    for m in re.finditer(r"\bchefs (?:[a-zé'-]+ )?((?:" + NOMPROPRE + r", )+" + NOMPROPRE + r")(?=[);.])", texte):
        for n in m.group(1).split(', '): ajoute(n)
    for m in re.finditer(r"\b(?:fille|fils|sœur|frère|veuve|femme) de " + NOM + r" des? ", texte):
        if nations_dans(texte[m.end() - 4:m.end() + 30]): ajoute(m.group(1))
    for m in re.finditer(r"\b(?:épousa|épouse|marié à|mariée à|puis à) " + NOM + r"(?=[ ,])", texte):
        if re.search(r"\b(?:femme|fille|épouse|veuve)\b", texte[m.end():m.end() + 40]) and nations_dans(texte[m.end():m.end() + 80]): ajoute(m.group(1), True)
    for m in re.finditer(r"\b(?:fille|fils|sœur|frère|veuve|femme) du chef (?:[a-zé'-]+ )?" + NOM, texte):
        if nations_dans(texte[m.end():m.end() + 30]): ajoute(m.group(1))
    # « épouse/femme (indienne…) nommée Nom »
    for m in re.finditer(r"\b(?:sa femme|son épouse|épouse|femme|veuve|fille|mère|Indien|Indienne)(?: [\w'-]+){0,3}? (?:nommée?|appelée?|dite?) " + NOM, texte):
        ajoute(m.group(1))
    # « sa femme shoshone Sacajawea », « une jeune Crie, Marguerite », « épouse Huntkalutawin (Marie), fille… »
    for c, a, b in nations_dans(texte):
        if not re.search(r"\b(?:femme|épouse|fille|fils|chef|guerrier|veuve|mère|squaw|sauvagesse|jeune|une|un|esclave|captive?|interprète|guide)\s+(?:[\w'’-]+\s+)?$", texte[max(0, a - 30):a], re.I): continue
        m = re.match(r"^,?\s+(?:nommée?\s+|appelée?\s+|dite?\s+)?" + NOM, texte[b:])
        if m: ajoute(m.group(1))
    for m in re.finditer(r"\b(?:épouse|marié à|mariée à) " + NOM + r" \(", texte):
        if nations_dans(texte[m.end():m.end() + 80]): ajoute(m.group(1))
    return noms

# ---------- thèmes ----------
THEMES = {
    'village': 'Villages, camps et territoires',
    'evenement': 'Conflits, conseils et traités',
    'personnage': 'Personnes autochtones nommées',
    'famille': 'Alliances, mariages et familles',
    'commerce': 'Traite et échanges',
    'religion': 'Missions et religion',
    'exploration': 'Guides, interprètes et expéditions',
    'rencontre': 'Rencontres et présence',
}
def theme(texte, lieu, noms, ancien):
    t = texte.lower()
    if re.search(r"\b(?:village|villages|pueblo|bourgade|réserve|reserve|campement|camp|loges|wigwams|agence)\b", lieu.lower()): return 'village'
    if re.search(r"\b(?:tué|tués|tuée|massacre|massacré|massacrés|attaqu|bataille|combat|guerre|scalp|chevelure|captif|captive|captifs|prisonnier|raid|vol de chevaux|volent|meurtre|assassin|conseil|traité|paix|soulèvement|révolte|insurrection|pendu|exécuté)", t): return 'evenement'
    if re.search(r"\b(?:épous|femme|mari\b|mariage|marié|mariée|fille|fils|enfants|veuve|veuf|squaw|métisse|mère|père de|famille|beau-père|belle-mère|gendre)", t): return 'famille'
    if re.search(r"\b(?:mission|missionnaire|baptis|baptême|église|chapelle|jésuite|oblat|catéchis|évangélis|sépulture|inhumé)", t): return 'religion'
    if re.search(r"\b(?:guide|interprète|expédition|explor|pilote|éclaireur)", t): return 'exploration'
    if re.search(r"\b(?:traite|traiteur|commerce|échange|fourrures?|peaux|robes|poste|marchand|troque|vend|achète)", t): return 'commerce'
    if noms: return 'personnage'
    if re.search(r"\b(?:village|villages|pueblo|camp|campement|loges|réserve|agence|territoire|terres)\b", t): return 'village'
    return 'rencontre'

def nettoyer(desc, lieu):
    t = desc
    t = re.split(r"\s+D'après\s", t)[0]
    t = re.split(r"\s+Autres lieux de l'entrée\s*:", t)[0]
    if 'Sa biographie mentionne' in t:
        t = t.split('Sa biographie mentionne', 1)[1]
        t = re.sub(r"^\s*[^,.:]*?\ben\s+\d{4}(?:\s*\([^)]*\))?\s*:?", '', t)
    elif lieu and t.startswith(lieu):
        t = t[len(lieu):]
    return t.strip(' ,.')


# ---------- lecture intégrale des livres (scripts/lecture/*.txt) ----------
def lecture_integrale(G_fr):
    import glob, importlib.util
    spec = importlib.util.spec_from_file_location('la', os.path.join(ICI, 'scripts', 'lecture', 'lieux_autochtones.py'))
    la = importlib.util.module_from_spec(spec); spec.loader.exec_module(la)
    canons = [c for c, _, _, _ in NATIONS]
    def nation(x):
        x = x.strip()
        for c in canons:
            if c == x or c.split(' (')[0] == x or c.startswith(x): return c
        raise ValueError('nation inconnue : ' + x)
    sortie = []
    for chemin in sorted(glob.glob(os.path.join(ICI, 'scripts', 'lecture', '*.txt'))):
        meta = {}; vus = collections.Counter()
        for ligne in open(chemin, encoding='utf-8'):
            ligne = ligne.rstrip('\n')
            if ligne.startswith('#'):
                m = re.match(r"#\s*(corpus|ref|lien|recherche):\s*(.*)", ligne)
                if m: meta[m.group(1)] = m.group(2).strip()
                continue
            if not ligne.strip(): continue
            qui, nats, lieu, date, page, desc = [c.strip() for c in ligne.split(' | ', 5)]
            nats = [nation(x) for x in nats.split(';')]
            if lieu in la.L: lon, lat, cert, libelle = la.L[lieu]
            elif lieu in G_fr: lon, lat, cert = G_fr[lieu][:3]; libelle = G_fr[lieu][3] if len(G_fr[lieu]) > 3 else lieu
            else: raise ValueError(f'lieu inconnu : {lieu} ({chemin})')
            m = re.match(r"(\d{3})(\d|X)(?:-(\d\d))?", date)
            if m.group(2) == 'X': debut, fin = int(m.group(1) + '0'), int(m.group(1) + '9')
            else: debut = fin = int(m.group(1) + m.group(2))
            if m.group(3) and m.group(2) != 'X': debut = fin = debut + (int(m.group(3)) - 0.5) / 12
            mp = re.match(r"\d+", page)
            p1 = mp.group(0) if mp else None
            groupe = qui.startswith('=')
            qui = qui.lstrip('= ')
            noms = [] if groupe else [n.strip() for n in qui.split(',') if n.strip() and not est_nation(n.strip()) and not re.match(r"^(?:[A-ZÉ][a-zé]+s|Indiens|Osages|Chefs?|Bande|Gendres)\b", n.strip())]
            base = slug(libelle.split(' (')[0] + '-' + str(int(debut)))
            vus[base] += 1
            ident = 'L-' + slug(os.path.basename(chemin)[:-4])[:10] + '-' + base + (f'-{vus[base]}' if vus[base] > 1 else '')
            th = 'personnage' if noms else theme(desc, libelle, [], None)
            sortie.append({'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': [lon, lat]}, 'properties': {
                'id': ident, 'nom': f"{libelle.split(' (')[0]} : {qui}", 'corpus': meta['corpus'], 'theme': th,
                'debut': float(debut), 'fin': float(fin) + (0.999 if m.group(2) == 'X' else 0), 'date_edtf': date, 'precision': 'mois' if m.group(3) else ('decennie' if m.group(2) == 'X' else 'annee'),
                'certitude': {'c': 'certaine', 'a': 'approximative', 'h': 'hypothetique'}.get(cert, 'approximative'),
                'personnages': noms, 'nations': nats, 'aires': [AIRE[n] for n in nats], 'francophones': [],
                'description': desc, 'passage': desc,
                'sources': f"{meta['ref']}, " + (f"p. {page}." if p1 else 's. p.'),
                'note': "Lecture intégrale du livre pour l'Atlas des Autochtones ; description paraphrasée, à vérifier dans le livre.",
                'voir_aussi': [] if not meta.get('lien') else [{'url': meta['lien'].format(page=p1), 'texte': f"Lire la page {p1} →"} if p1 else
                               {'url': meta['recherche'].format(q=re.sub(r'\s+', '+', (noms or [qui.split(',')[0]])[0].split(' (')[0])), 'texte': "Chercher dans le livre →"}]}})
    return sortie

def slug(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:40]

RESEAU = [  # atlas du réseau : fiches complètes (remplacent les renvois courts de l'atlas des Canadiens français)
    ('atlas-aubry', 'Atlas Aubry', 'https://geolas2023.github.io/Atlas-Aubry/index.html#lieu={id}', "Fiche d'origine dans l'Atlas Aubry →"),
    ('atlas-iberville', 'Atlas Iberville', 'https://geolas2023.github.io/Atlas-Iberville/index.html#lieu={id}', "Fiche d'origine dans l'Atlas Iberville →"),
    ('atlas-jolliet', 'Atlas Jolliet', 'https://geolas2023.github.io/Atlas-Jolliett/index.html#lieu={id}', "Fiche d'origine dans l'Atlas Jolliet →"),
    ('les-robidoux', 'Atlas Robidoux', 'https://geolas2023.github.io/Les-Robidoux/index.html#lieu={id}', "Fiche d'origine dans l'Atlas Robidoux →"),
]

def fiches_sources(src):
    """(propriétés, géométrie, lien d'origine, texte du lien, préfixe d'identifiant) pour toutes les sources."""
    d = json.load(open(src))
    for f in d['features']:
        p = f['properties']
        if p.get('corpus') in [r[1] for r in RESEAU]: continue
        yield p, f['geometry'], URL_FR + p['id'], "Fiche d'origine dans l'Atlas des Canadiens français de l'Ouest →", 'A-'
    racine = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(src))))
    for dossier, corpus, lien, texte in RESEAU:
        chemin = os.path.join(racine, dossier, 'data', 'lieux.geojson')
        if not os.path.exists(chemin): print('absent :', chemin); continue
        for f in json.load(open(chemin))['features']:
            if f['geometry']['type'] != 'Point': continue
            p = dict(f['properties'])
            p['corpus'] = corpus
            for k in ('debut', 'fin'):
                try: p[k] = float(p[k])
                except (TypeError, ValueError, KeyError): p[k] = None
            if p['debut'] is None: continue
            if p['fin'] is None: p['fin'] = p['debut']
            p['personnages'] = [corpus.replace('Atlas ', '')] if corpus != 'Atlas Robidoux' else ['Robidoux']
            for k in ('type', 'categorie', 'image', 'images'): p.pop(k, None)
            p.setdefault('certitude', 'approximative')
            yield p, f['geometry'], lien.format(id=p['id']), texte, 'A-' + corpus.split()[-1].upper() + '-'

def main(src):
    sources = list(fiches_sources(src))
    for p, *_ in sources:
        nm = p.get('nom', '')
        LIEUX_CONNUS.add((nm.split(' : ')[0] if ' : ' in nm else nm).split(' (')[0].strip())
    out = []; stats = collections.Counter(); par_nation = collections.Counter()
    for p, geom, lien, lien_txt, pref in sources:
        nom = p.get('nom', ''); desc = str(p.get('description', ''))
        lieu = nom.split(' : ')[0] if ' : ' in nom else nom
        texte = nettoyer(desc, lieu)
        trouves = nations_dans(texte)
        lieu_nat = []
        if re.search(r"\b(?:village|villages|pueblo|réserve|reserve|agence|campement|camp|bourgade|nation|tribu|bande|chez les)\b", lieu, re.I):
            lieu_nat = [c for c, _, _ in nations_dans(re.sub(r"\(.*?\)", '', lieu)) if not c.startswith('Autochtones')]
        nats = []
        for c, _, _ in trouves:
            if c not in nats: nats.append(c)
        for c in lieu_nat:
            if c not in nats: nats.append(c)
        if not nats: continue
        if len(nats) > 1 and 'Autochtones (nation non précisée)' in nats: nats.remove('Autochtones (nation non précisée)')
        noms = noms_autochtones(texte, p.get('personnages') or [])
        th = 'personnage' if noms else theme(texte, lieu, noms, p.get('theme'))
        if lieu_nat and th == 'rencontre': th = 'village'
        titre_nat = ', '.join(n.split(' (')[0] if not n.startswith('Autochtones') else 'Autochtones' for n in nats[:3]) + (' …' if len(nats) > 3 else '')
        q = dict(p)
        q.pop('salle', None)
        q['id'] = pref + p['id']
        q['nom'] = f"{lieu} : {titre_nat}" + (f" — {', '.join(noms)}" if noms else '')
        q['theme'] = th
        q['nations'] = nats
        q['aires'] = [AIRE[n] for n in nats]  # même ordre que nations
        q['personnages'] = noms
        q['francophones'] = p.get('personnages') or []
        q['passage'] = texte
        q['voir_aussi'] = [v for v in (p.get('voir_aussi') or []) if 'geolas2023.github.io' not in v.get('url', '')] + [{'url': lien, 'texte': lien_txt}]
        out.append({'type': 'Feature', 'geometry': geom, 'properties': q})
        stats[th] += 1
        for n in nats: par_nation[n] += 1
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(src)), '..', 'scripts', 'sources_archive'))
    from lieux_ouest import G as G_fr
    lus = lecture_integrale(G_fr)
    for f in lus:
        stats['lecture:' + f['properties']['corpus']] += 1
        for n in f['properties']['nations']: par_nation[n] += 1
    out += lus
    os.makedirs(os.path.join(ICI, 'data'), exist_ok=True)
    json.dump({'type': 'FeatureCollection', 'features': out}, open(os.path.join(ICI, 'data', 'lieux.geojson'), 'w'), ensure_ascii=False, separators=(',', ':'))
    json.dump(THEMES, open(os.path.join(ICI, 'data', 'themes.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(out), 'fiches'); print(stats.most_common()); print(par_nation.most_common())
    print(sum(1 for f in out if f['properties']['personnages']), 'fiches avec un nom autochtone')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, '..', 'atlas-les-canadiens-fran-ais-de-l-ouest', 'data', 'lieux.geojson'))
