// Fonds de carte de l'atlas : Plan, A Arpenteur, B Western, C Relief, Satellite.
// Les fonds A, B et C recolorent la carte vectorielle OpenFreeMap (« Plan ») et retirent les éléments
// anachroniques (routes, villes, bâtiments). Le relief ombré provient des AWS Terrain Tiles (Mapzen).

const THEMES = {
  arpenteur: {
    fond: '#efe3c6', eau: '#cdd6d2', riviere: '#8ea2ac', vegetation: ['#e3d3ad', 0.5], frontiere: ['#8a6a44', 0.35],
    nomsEau: '#5a6f7c', relief: { ombre: '#6b4f2e', lumiere: '#fbf5e6', accent: '#8a6a44', exageration: 0.35 },
    texte: '#4a3320', halo: '#efe3c6'
  },
  western: {
    fond: '#e9c999', eau: '#9fbfb9', riviere: '#5f8a8b', vegetation: ['#d9a066', 0.35], frontiere: ['#7a3d1c', 0.3],
    nomsEau: '#3f6466', relief: { ombre: '#7a2f12', lumiere: '#f6dcae', accent: '#b8673d', exageration: 0.55 },
    texte: '#4a1a0c', halo: '#f0d4a6'
  },
  relief: {
    fond: '#e6dfcd', eau: '#bcd0d9', riviere: '#6f95a8', vegetation: ['#cfd3b0', 0.45], frontiere: ['#6b604f', 0.3],
    nomsEau: '#45697a', relief: { ombre: '#4f463a', lumiere: '#ffffff', accent: '#6b604f', exageration: 0.6 },
    texte: '#2b2620', halo: '#f4efe6'
  }
};
// Couches du fond « Plan » masquées dans les fonds d'époque (éléments modernes)
const MASQUEES = ['transportation', 'transportation_name', 'building', 'aeroway', 'aerodrome_label', 'poi', 'housenumber', 'place', 'mountain_peak', 'landuse'];

function installerFonds(carte, base, avant) {
  const originaux = new Map(); // valeurs d'origine, pour revenir au fond « Plan »

  const changer = (id, type, prop, valeur) => {
    const cle = `${id}|${type}|${prop}`;
    if (!originaux.has(cle)) {
      originaux.set(cle, type === 'layout' ? carte.getLayoutProperty(id, prop) : carte.getPaintProperty(id, prop));
    }
    type === 'layout' ? carte.setLayoutProperty(id, prop, valeur) : carte.setPaintProperty(id, prop, valeur);
  };
  const restaurer = () => {
    originaux.forEach((v, cle) => {
      const [id, type, prop] = cle.split('|');
      const val = v === undefined && prop === 'visibility' ? 'visible' : v;
      type === 'layout' ? carte.setLayoutProperty(id, prop, val) : carte.setPaintProperty(id, prop, val);
    });
  };

  // Relief ombré (masqué par défaut), sous l'imagerie satellite et les couches de l'atlas
  carte.addSource('relief-mnt', {
    type: 'raster-dem', encoding: 'terrarium', tileSize: 256, maxzoom: 12,
    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
    attribution: 'Relief : Mapzen, AWS Terrain Tiles'
  });
  // sous les étiquettes du fond (premier calque de texte), pour qu'elles restent nettes
  const premierTexte = base.find(id => carte.getLayer(id)?.type === 'symbol') || avant;
  carte.addLayer({ id: 'relief', type: 'hillshade', source: 'relief-mnt', layout: { visibility: 'none' } }, premierTexte);

  function etiquettesAtlas(texte, halo) {
    carte.setPaintProperty('lieux-noms', 'text-color', texte);
    carte.setPaintProperty('lieux-noms', 'text-halo-color', halo);
  }

  // Applique un fond ; renvoie un message à afficher (ou '')
  return async function appliquerFond(nom) {
    restaurer();
    ['relief', 'satellite'].forEach(id => carte.setLayoutProperty(id, 'visibility', 'none'));
    etiquettesAtlas('#3b3328', '#ffffff');

    if (nom === 'satellite') {
      carte.setLayoutProperty('satellite', 'visibility', 'visible');
      etiquettesAtlas('#ffffff', '#000000');
      return '';
    }
    const t = THEMES[nom];
    if (!t) return ''; // « plan » : fond d'origine

    for (const id of base) {
      const couche = carte.getLayer(id);
      if (!couche) continue;
      const src = couche.sourceLayer, type = couche.type;
      if (type === 'background') { changer(id, 'paint', 'background-color', t.fond); continue; }
      if (MASQUEES.includes(src)) { changer(id, 'layout', 'visibility', 'none'); continue; }
      if (src === 'water' && type === 'fill') changer(id, 'paint', 'fill-color', t.eau);
      else if (src === 'waterway' && type === 'line') changer(id, 'paint', 'line-color', t.riviere);
      else if ((src === 'landcover' || src === 'park') && type === 'fill') {
        changer(id, 'paint', 'fill-color', t.vegetation[0]);
        changer(id, 'paint', 'fill-opacity', t.vegetation[1]);
      } else if (src === 'boundary' && type === 'line') {
        changer(id, 'paint', 'line-color', t.frontiere[0]);
        changer(id, 'paint', 'line-opacity', t.frontiere[1]);
      } else if (src === 'water_name' && type === 'symbol') {
        changer(id, 'paint', 'text-color', t.nomsEau);
        changer(id, 'paint', 'text-halo-color', t.fond);
      } else if (type === 'symbol' || type === 'fill-extrusion') changer(id, 'layout', 'visibility', 'none');
    }
    carte.setPaintProperty('relief', 'hillshade-shadow-color', t.relief.ombre);
    carte.setPaintProperty('relief', 'hillshade-highlight-color', t.relief.lumiere);
    carte.setPaintProperty('relief', 'hillshade-accent-color', t.relief.accent);
    carte.setPaintProperty('relief', 'hillshade-exaggeration', t.relief.exageration);
    carte.setLayoutProperty('relief', 'visibility', 'visible');
    etiquettesAtlas(t.texte, t.halo);
    return '';
  };
}
