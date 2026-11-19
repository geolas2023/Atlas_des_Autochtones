// Version anglaise (index-en.html) : vocabulaire de l'interface et règles de traduction des mentions françaises
// dans les sources et les liens. Chargé seulement par les pages -en, avant js/atlas.js.
// Les fiches elles-mêmes sont traduites dans data/traductions-en.json (rempli par lots, voir scripts/traduction_lot.py) ;
// une fiche pas encore traduite s'affiche en français, avec une mention.
window.TRAD_EN = (() => {
  const NATIONS = {
    'Abénakis': 'Abenaki', 'Algonquins (Anishinaabeg)': 'Algonquin (Anishinaabeg)', 'Andastes (Susquehannocks)': 'Susquehannock (Andaste)',
    'Anishinaabés (Ojibwés, Saulteux)': 'Anishinaabe (Ojibwe, Saulteaux)', 'Apaches': 'Apache', 'Arapahos': 'Arapaho', 'Arikaras': 'Arikara',
    'Assiniboines (Nakodas)': 'Assiniboine (Nakoda)', 'Atakapas': 'Atakapa', 'Autochtones (nation non précisée)': 'Indigenous (nation not specified)',
    'Avoyelles': 'Avoyel', 'Bannocks': 'Bannock', 'Bayogoulas et Mougoulachas': 'Bayogoula and Mugulasha', 'Biloxis et Pascagoulas': 'Biloxi and Pascagoula',
    'Caddos et Hasinais': 'Caddo and Hasinai', 'Cayuses': 'Cayuse', 'Cherokees': 'Cherokee', 'Cheyennes': 'Cheyenne', 'Chickasaws (Chicachas)': 'Chickasaw',
    'Chinooks': 'Chinook', 'Chitimachas': 'Chitimacha', 'Choctaws (Chactas)': 'Choctaw', 'Clatsops': 'Clatsop',
    'Coahuiltèques et peuples du Texas': 'Coahuiltecan and Texas peoples', 'Colapissas': 'Acolapissa', 'Colvilles (Lacs, Sanpoils)': 'Colville (Lakes, Sanpoil)',
    'Comanches': 'Comanche', 'Cris': 'Cree', 'Crows (Apsáalooke)': 'Crow (Apsáalooke)', 'Dénés (Porteurs, Sékanis, Chipewyans)': 'Dene (Carrier, Sekani, Chipewyan)',
    'Gros-Ventres (Aaniiih)': 'Gros Ventre (Aaniiih)', 'Haudenosaunee (Iroquois)': 'Haudenosaunee (Iroquois)', 'Ho-Chunks (Winnebagos)': 'Ho-Chunk (Winnebago)',
    'Houmas': 'Houma', 'Illinois (Inoka)': 'Illinois (Inoka)', 'Innus (Montagnais)': 'Innu (Montagnais)', 'Inuits': 'Inuit', 'Iowas': 'Ioway',
    'Iroquoiens du Saint-Laurent': 'St. Lawrence Iroquoians', 'Kalapuyas': 'Kalapuya', 'Kansas (Kaws)': 'Kansa (Kaw)', 'Kickapous': 'Kickapoo', 'Kiowas': 'Kiowa',
    'Klallams': 'Klallam', 'Klickitats': 'Klickitat', 'Kootenais (Ktunaxa)': 'Kootenai (Ktunaxa)', "Kwakwaka'wakw (Kwakiutl)": "Kwakwaka'wakw (Kwakiutl)",
    'Lenapes (Delawares, Loups)': 'Lenape (Delaware)', 'Mandans': 'Mandan', 'Mascoutens': 'Mascouten', 'Menominees (Folles-Avoines)': 'Menominee',
    'Mesquakies (Renards)': 'Meskwaki (Fox)', "Mi'kmaq": "Mi'kmaq", 'Miamis': 'Miami', 'Mobiliens et Tohomés': 'Mobila and Tohome',
    'Mohicans (Mahingans)': 'Mohican', 'Mojaves': 'Mojave', 'Muscogees (Creeks)': 'Muscogee (Creek)', 'Métis': 'Métis', 'Natchez': 'Natchez',
    'Natchitoches': 'Natchitoches', 'Navajos (Diné)': 'Navajo (Diné)', 'Nimíipuu (Nez-Percés)': 'Nimíipuu (Nez Perce)', 'Nisquallys': 'Nisqually',
    'Odawas (Outaouais)': 'Odawa (Ottawa)', 'Okanagans': 'Okanagan', 'Omahas': 'Omaha', 'Osages': 'Osage', 'Otoes-Missourias': 'Otoe-Missouria',
    'Paiutes': 'Paiute', 'Palouses': 'Palouse', 'Pawnees': 'Pawnee', "Pend d'Oreilles et Kalispels": "Pend d'Oreille and Kalispel",
    'Pieds-Noirs (Niitsitapis)': 'Blackfoot (Niitsitapi)', "Pimas et Tohono O'odham": "Pima and Tohono O'odham", 'Poncas': 'Ponca',
    'Potawatomis': 'Potawatomi', 'Pueblos': 'Pueblo peoples', 'Quapaws (Arkansas)': 'Quapaw (Arkansas)', 'Quinipissas': 'Quinipissa',
    'Salish (Têtes-Plates)': 'Salish (Flathead)', 'Sauks': 'Sauk', "Schitsu'umsh (Cœurs d'Alène)": "Schitsu'umsh (Coeur d'Alene)", 'Shawnees': 'Shawnee',
    'Shoshones': 'Shoshone', 'Sioux (Dakotas, Lakotas, Nakotas)': 'Sioux (Dakota, Lakota, Nakota)', 'Snoqualmies et Snohomishs': 'Snoqualmie and Snohomish',
    'Spokanes': 'Spokane', 'Séminoles': 'Seminole', 'Taensas': 'Taensa', 'Timucuas': 'Timucua', 'Tunicas': 'Tunica', 'Umatillas': 'Umatilla', 'Utes': 'Ute',
    'Walla Wallas': 'Walla Walla', 'Weas et Piankashaws': 'Wea and Piankashaw', 'Wichitas et Taovayas': 'Wichita and Taovaya',
    'Wyandots (Hurons-Wendat)': 'Wyandot (Huron-Wendat)', 'Yakamas': 'Yakama', 'Yazous et Koroas': 'Yazoo and Koroa'
  };
  const AIRES = {
    'Arctique': 'Arctic', 'Bas-Mississippi': 'Lower Mississippi', 'Côte du Nord-Ouest': 'Northwest Coast', 'Est': 'East', 'Grand Bassin': 'Great Basin',
    'Grands Lacs': 'Great Lakes', 'Haut-Missouri': 'Upper Missouri', 'Métis': 'Métis', 'Ohio': 'Ohio', 'Pays des Illinois': 'Illinois Country',
    'Plaines': 'Plains', 'Plaines du Sud': 'Southern Plains', 'Plateau': 'Plateau', 'Subarctique': 'Subarctic', 'Sud-Est': 'Southeast',
    'Sud-Ouest': 'Southwest', 'Texas': 'Texas'
  };
  const PRECISION = { annee: 'year', mois: 'month', jour: 'day', circa: 'circa', decennie: 'decade', siecle: 'century' };
  const CORPUS = {
    'Cragin': "F. W. Cragin's notebooks", 'Atlas Aubry': 'Aubry Atlas (cross-references)', 'Recherches': 'Research (web, literature)',
    'Hafen': "Hafen's biographies (Mountain Men)", 'Hafen MM': 'Hafen, Mountain Men, vols. 2, 4-9 (survey)',
    'Tassé': 'Tassé, Les Canadiens de l\'Ouest (1878)', 'Illinois français': 'French Illinois and the Midwest',
    'Atlas historique du Québec': 'La francophonie nord-américaine (Atlas historique du Québec, 2012)', 'Franco-Amérique': 'Franco-Amérique (Louder and Waddell, 2008)',
    'Nouvelle-France': 'New France: explorations (Margry, Johnson, Marchand)', 'Nouvelle-Angleterre': 'New England: textile mills (Vermette, MacDonald, Belisle)',
    "Piste de l'Oregon": 'The Oregon Trail (Bergeron)', 'Atlas Iberville': 'Iberville Atlas (cross-references)', 'Atlas Jolliet': 'Jolliet Atlas (cross-references)',
    'Atlas Robidoux': 'Robidoux Atlas (cross-references)', 'Atlas Chalifoux': 'Chalifoux Atlas (cross-references)'
  };
  const GROUPES = {
    'Témoignages et recherches': 'Testimonies and research', 'Hafen et les montagnards': 'Hafen and the mountain men', 'Ouvrages de synthèse': 'General works',
    'Régions': 'Regions', 'Atlas du réseau (renvois)': 'Network atlases (cross-references)', 'Lecture intégrale des livres': 'Full reading of books',
    'Bibliothèque archive.org': 'archive.org library', 'Autres sources': 'Other sources'
  };
  const MOIS = { janvier: 'January', février: 'February', mars: 'March', avril: 'April', mai: 'May', juin: 'June', juillet: 'July', août: 'August',
    septembre: 'September', octobre: 'October', novembre: 'November', décembre: 'December' };
  const REGLES = [
    [/(copie|coupure|epub|document|PDF|fichier) du Drive de l'auteur/g, (m, a) => ({ copie: 'copy', coupure: 'clipping', fichier: 'file' }[a] || a) + " in the author's Drive"],
    [/Drive de l'auteur/g, "author's Drive"], [/\bconsulté(?:e)? (?:le |en )?/g, 'accessed '], [/transcription dactylographiée/g, 'typed transcription'],
    [/\(dir\.\)/g, '(ed.)'], [/\(éd\.\)/g, '(ed.)'], [/\bt\. (\d)/g, 'vol. $1'], [/\bchap\. /g, 'ch. '], [/\bcoll\. /g, 'series '], [/n° /g, 'no. '],
    [/\bd'après\b/g, 'according to'], [/\bdans\b/g, 'in'], [/\bvoir\b/g, 'see'], [/\bfiches\b/g, 'entries'], [/\bfiche\b/g, 'entry'],
    [/\bcarnet\b/g, 'notebook'], [/\bcarnets\b/g, 'notebooks'], [/\bsans date\b/g, 'undated'], [/\b1er\b/g, '1'], [/(\d) et (\d)/g, '$1 and $2'],
    [/\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/g, (m) => MOIS[m]], [/ ;/g, ';'], [/ :/g, ':'],
    [/« /g, '“'], [/ »/g, '”']
  ];
  const sources = s => REGLES.reduce((t, [a, b]) => t.replace(a, b), String(s ?? ''));
  const voir = t => String(t ?? '')
    .replace("Fiche d'origine dans l'Atlas des Canadiens français de l'Ouest →", 'Original entry in the French Canadians of the West atlas →')
    .replace(/^Lire la page (\S+) →/, 'Read page $1 →').replace('Chercher dans le livre →', 'Search the book →')
    .replace(/ sur archive\.org/, ' on archive.org').replace('(emprunt)', '(borrow)').replace(/^Lire /, 'Read ')
    .replace(/^Ouvrir /, 'Open ').replace(/ \(octobre /, ' (October ');
  const url = u => String(u ?? '').replace(/(Atlas-Les-Canadiens-Fran-ais-de-l-Ouest\/)(index\.html)?#/i, '$1index-en.html#');
  return { NATIONS, AIRES, PRECISION, CORPUS, GROUPES, sources, voir, url };
})();
