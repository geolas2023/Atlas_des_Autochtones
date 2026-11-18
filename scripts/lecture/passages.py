"""Repère, page par page, les phrases d'un livre (texte intégral) qui parlent de personnes, villages ou
événements autochtones, pour la lecture intégrale. Usage : passages.py livre.txt [mode]"""
import re, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from nations import NATIONS
NAT = re.compile(r"(?<![\w'’-])(?:" + "|".join(m for _, _, m, a in NATIONS if not a) + r")(?![\w'’-])", re.I)
FORT = re.compile(r"\b(chiefs?|chef|chefs|village|villages|lodges?|camp|band|squaw|wife|daughter|son of|married|council|conseil|treaty|traité|killed|massacre|attack|war party|scalp|prisoner|captive|named|called|known as|nommée?|appelée?|guerre|tué|épous|femme|fille|mission|baptiz|baptis)\b", re.I)
def pages(t):
    for bloc in t.split('\x0c'):
        tete = bloc.strip().split('\n', 1)[0]
        m = re.search(r"^\s*(\d{1,4})\b|\b(\d{1,4})\s*$", tete)
        yield (m.group(1) or m.group(2)) if m else '?', bloc
def phrases(bloc):
    bloc = re.sub(r"-\n(\w)", r"\1", bloc); bloc = re.sub(r"\s*\n\s*", " ", bloc)
    return re.split(r"(?<=[.!?;])\s+(?=[A-Z«“\"])", bloc)
if __name__ == '__main__':
    t = open(sys.argv[1], errors='ignore').read()
    n = 0
    for pg, bloc in pages(t):
        for ph in phrases(bloc):
            if NAT.search(ph) and FORT.search(ph) and len(ph) < 900:
                n += 1; print(f"[{pg}] {ph.strip()}")
    print('#', n, file=sys.stderr)
