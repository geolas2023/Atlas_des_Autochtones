"""Mise à jour partielle : refait les fiches tirées d'un ou de plusieurs atlas du réseau (ex. Robidoux, Chalifoux)
sans régénérer tout l'atlas (utile quand les autres dépôts ne sont pas clonés).
Usage : python3 scripts/maj_atlas.py "Atlas Robidoux" "Atlas Chalifoux"   (dépôts clonés à côté de celui-ci)"""
import json, os, sys, collections
ICI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ICI, 'scripts'))
import extraire as X

corpus_vises = sys.argv[1:]
racine = os.path.dirname(ICI)
fic = os.path.join(ICI, 'data', 'lieux.geojson')
d = json.load(open(fic, encoding='utf-8'))
for f in d['features']:
    nm = f['properties'].get('nom', '')
    X.LIEUX_CONNUS.add(nm.split(' : ')[0].split(' (')[0].strip())
garde = [f for f in d['features'] if f['properties'].get('corpus') not in corpus_vises]
neuf = []
for dossier, corpus, lien, texte in X.RESEAU:
    if corpus not in corpus_vises: continue
    chemin = os.path.join(racine, dossier, 'data', 'lieux.geojson')
    for f in json.load(open(chemin, encoding='utf-8'))['features']:
        if f['geometry']['type'] != 'Point' or f['properties'].get('reseau'): continue  # fiche reprise du réseau : déjà présente
        p = dict(f['properties']); p['corpus'] = corpus
        p['debut'] = float(p['debut']); p['fin'] = float(p.get('fin') or p['debut'])
        p['personnages'] = {'Atlas Robidoux': ['Robidoux'], 'Atlas Chalifoux': ['Jean-Baptiste Chalifoux']}.get(corpus, [corpus.replace('Atlas ', '')])
        for k in ('type', 'categorie', 'image', 'images', 'reseau'): p.pop(k, None)
        nom = p.get('nom', ''); lieu = nom.split(' : ')[0] if ' : ' in nom else nom
        t = X.nettoyer(str(p.get('description', '')), lieu)
        nats = []
        for c, _, _ in X.nations_dans(t):
            if c not in nats: nats.append(c)
        if not nats: continue
        if len(nats) > 1 and 'Autochtones (nation non précisée)' in nats: nats.remove('Autochtones (nation non précisée)')
        noms = X.noms_autochtones(t, p['personnages'])
        th = 'personnage' if noms else X.theme(t, lieu, noms, p.get('theme'))
        q = dict(p)
        q['id'] = 'A-' + corpus.split()[-1].upper() + '-' + p['id']
        titre = ', '.join(n.split(' (')[0] if not n.startswith('Autochtones') else 'Autochtones' for n in nats[:3]) + (' …' if len(nats) > 3 else '')
        q['nom'] = f"{lieu} : {titre}" + (f" — {', '.join(noms)}" if noms else '')
        q['theme'] = th; q['nations'] = nats; q['aires'] = [X.AIRE[n] for n in nats]
        q['personnages'] = noms; q['francophones'] = p['personnages']; q['passage'] = t
        q['voir_aussi'] = [{'url': lien.format(id=p['id']), 'texte': texte}]
        neuf.append({'type': 'Feature', 'geometry': f['geometry'], 'properties': q})
avant = collections.Counter(f['properties'].get('corpus') for f in d['features'])
d['features'] = garde + neuf
json.dump(d, open(fic, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
apres = collections.Counter(f['properties'].get('corpus') for f in d['features'])
for c in corpus_vises: print(c, avant[c], '->', apres[c])
print(len(d['features']), 'fiches')
