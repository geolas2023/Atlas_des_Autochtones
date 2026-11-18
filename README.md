# Atlas des Autochtones

Premières Nations, Métis et Inuits dans les sources de l'Amérique française : atlas géohistorique interactif du réseau [Atlas de l'Amérique française](https://geolas2023.github.io/Atlas-Les-Canadiens-Fran-ais-de-l-Ouest/).

**En ligne :** https://geolas2023.github.io/Atlas_des_Autochtones/

Olivier J. Caron, Département de géographie, UQAM.

## Contenu

L'atlas relit toutes les fiches de l'Atlas des Canadiens français de l'Ouest et des atlas Aubry, Iberville, Jolliet et Robidoux du point de vue des peuples autochtones. Il retient les fiches qui mentionnent une nation, un village ou une personne autochtone.

Chaque fiche garde :

- la date, le lieu, la certitude de la localisation ;
- la description de la fiche d'origine ;
- la source, avec le lien vers la page du livre, le numéro de la revue ou l'article ;
- un renvoi vers la fiche d'origine.

Chaque fiche ajoute :

- la ou les **nations** (nom actuel, avec les noms d'époque entre parenthèses) et leur aire culturelle ;
- les **personnes autochtones nommées** dans le texte (aucun nom n'est ajouté) ;
- un **thème** : villages, camps et territoires ; conflits, conseils et traités ; personnes autochtones nommées ; alliances, mariages et familles ; traite et échanges ; missions et religion ; guides, interprètes et expéditions ; rencontres et présence.

Les termes d'époque employés par les sources (« sauvages », « squaw », « half-breed »…) sont cités tels quels pour rester fidèle aux textes ; ils peuvent être blessants.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `js/atlas.js`, `js/fonds.js`, `css/style.css` | l'application (MapLibre), même gabarit que l'atlas des Canadiens français, couleurs de l'Atlas Aubry, plume d'aigle en emblème |
| `data/lieux.geojson` | les fiches (EPSG:4326) |
| `data/themes.json` | les thèmes |
| `data/atlas.json` | le registre des atlas du réseau |
| `scripts/nations.py` | le lexique des nations : formes rencontrées dans les sources → nom actuel, aire culturelle |
| `scripts/extraire.py` | le repérage ; régénère `data/lieux.geojson` |

## Régénérer les données

Les dépôts du réseau doivent être clonés côte à côte (`atlas-les-canadiens-fran-ais-de-l-ouest`, `atlas-aubry`, `atlas-iberville`, `atlas-jolliet`, `les-robidoux`) :

```
python3 scripts/extraire.py ../atlas-les-canadiens-fran-ais-de-l-ouest/data/lieux.geojson
```

Après une publication, changer le numéro `?v=` dans `index.html` pour vider les caches.
