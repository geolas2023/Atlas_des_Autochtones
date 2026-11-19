#!/usr/bin/env python3
"""Traduction anglaise par lots des fiches de data/lieux.geojson vers data/traductions-en.json.

La version anglaise du site (index-en.html) lit data/traductions-en.json : pour chaque identifiant de fiche,
les champs traduits (nom, description, note, transcription). Une fiche absente du fichier s'affiche en français.

Usage :
  python3 scripts/traduction_lot.py etat
      Avancement : fiches traduites / total, par corpus.
  python3 scripts/traduction_lot.py extraire 400 [--sortie lot-fr.json] [--corpus "Cragin"]
      Écrit les 400 prochaines fiches non traduites (champs français à traduire), dans l'ordre du fichier.
  python3 scripts/traduction_lot.py integrer lot-en.json
      Vérifie le lot traduit (mêmes identifiants, mêmes champs, textes non vides) et l'ajoute à data/traductions-en.json.

Règles de traduction (pour la personne ou l'agent qui traduit le lot) :
  - traduire nom, description, note et transcription en anglais clair, sans rien ajouter ni retrancher ;
  - garder tels quels les noms propres, les titres d'ouvrages, les citations entre guillemets dans leur langue d'origine
    (on peut ajouter la traduction entre parenthèses quand la citation est en français) et les cotes d'archives ;
  - « Canadiens » se rend par « Canadiens » ou « French Canadians » selon le contexte ; « Saint-Louis » (Missouri) par « St. Louis » ;
  - ne pas traduire les sources : le site traduit lui-même leurs mentions françaises (js/traduction-en.js).
"""
import json, sys, argparse, collections, os

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIEUX = os.path.join(RACINE, 'data', 'lieux.geojson')
TRAD = os.path.join(RACINE, 'data', 'traductions-en.json')
CHAMPS = ('nom', 'description', 'note', 'transcription')


def charger_fiches():
    return json.load(open(LIEUX, encoding='utf-8'))['features']


def charger_trad():
    if not os.path.exists(TRAD):
        return {}
    return json.load(open(TRAD, encoding='utf-8'))


def ecrire_trad(trad, ordre):
    # une fiche par ligne, dans l'ordre de lieux.geojson : des différences git lisibles
    rang = {i: k for k, i in enumerate(ordre)}
    cles = sorted(trad, key=lambda i: rang.get(i, 10 ** 9))
    with open(TRAD, 'w', encoding='utf-8') as o:
        o.write('{\n')
        o.write(',\n'.join(f'{json.dumps(k, ensure_ascii=False)}: {json.dumps(trad[k], ensure_ascii=False)}' for k in cles))
        o.write('\n}\n')


def a_traduire(p):
    return {k: p[k] for k in CHAMPS if isinstance(p.get(k), str) and p[k].strip()}


def etat(_):
    fiches, trad = charger_fiches(), charger_trad()
    tot, faites = collections.Counter(), collections.Counter()
    for f in fiches:
        c = f['properties'].get('corpus', '—')
        c = 'archive.org (livres)' if c.startswith('archive.org') else 'Lecture intégrale (livres)' if c.startswith('Lecture intégrale') else c
        tot[c] += 1
        faites[c] += f['properties']['id'] in trad
    n, t = sum(faites.values()), sum(tot.values())
    print(f'{n} / {t} fiches traduites ({100 * n / t:.1f} %)')
    for c, v in tot.most_common():
        print(f'  {faites[c]:>6} / {v:<6} {c}')


def extraire(a):
    fiches, trad = charger_fiches(), charger_trad()
    lot = {}
    for f in fiches:
        p = f['properties']
        if p['id'] in trad or (a.corpus and not p.get('corpus', '').startswith(a.corpus)):
            continue
        champs = a_traduire(p)
        if champs:
            lot[p['id']] = champs
        if len(lot) >= a.nombre:
            break
    json.dump(lot, open(a.sortie, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(lot)} fiches écrites dans {a.sortie}')


def integrer(a):
    fiches, trad = charger_fiches(), charger_trad()
    par_id = {f['properties']['id']: f['properties'] for f in fiches}
    lot = json.load(open(a.fichier, encoding='utf-8'))
    erreurs = []
    for i, t in lot.items():
        if i not in par_id:
            erreurs.append(f'{i} : identifiant inconnu'); continue
        attendu = set(a_traduire(par_id[i]))
        if set(t) != attendu:
            erreurs.append(f'{i} : champs {sorted(t)} au lieu de {sorted(attendu)}')
        for k, v in t.items():
            if not isinstance(v, str) or not v.strip():
                erreurs.append(f'{i}.{k} : texte vide')
            elif v.strip() == par_id[i].get(k, '').strip() and len(v) > 40:
                erreurs.append(f'{i}.{k} : identique au français (non traduit ?)')
    if erreurs:
        print('Lot refusé :', *erreurs[:50], sep='\n  ')
        sys.exit(1)
    trad.update(lot)
    ecrire_trad(trad, [f['properties']['id'] for f in fiches])
    print(f'{len(lot)} fiches ajoutées ; {len(trad)} / {len(fiches)} traduites')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    sp.add_parser('etat').set_defaults(f=etat)
    e = sp.add_parser('extraire'); e.add_argument('nombre', type=int); e.add_argument('--sortie', default='lot-fr.json')
    e.add_argument('--corpus'); e.set_defaults(f=extraire)
    i = sp.add_parser('integrer'); i.add_argument('fichier'); i.set_defaults(f=integrer)
    a = ap.parse_args(); a.f(a)


if __name__ == '__main__':
    main()
