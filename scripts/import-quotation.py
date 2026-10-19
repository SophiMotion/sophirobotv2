"""Extract approved section totals and quantities; never import individual prices."""
import json
import sys
import re
from pathlib import Path
import openpyxl

source = Path(sys.argv[1])
sheet = openpyxl.load_workbook(source, data_only=True).active
sections = [
    ('Frame + mobile platform quotation', [(4, 30, 1)], [(31, 1)], '1 frame and mobile platform'),
    ('Head quotation', [(32, 41, 1)], [(42, 1)], '1 head'),
    ('Arm quotation', [(49, 64, 2), (43, 47, 2)], [(65, 2), (48, 2)], '2 arms + 2 hands'),
    ('Leg quotation', [(66, 72, 2)], [(73, 2)], '2 legs'),
    ('Control system quotation', [(74, 82, 1)], [(83, 1)], '1 control system'),
    ('Advanced intelligence system quotation', [(84, 84, 1)], [(85, 1)], '1 advanced intelligence system'),
]
result = {'source': source.name, 'currency': 'CNY', 'sections': []}
for name, ranges, totals, scope in sections:
    items = []
    for start, end, multiplier in ranges:
        for row in range(start, end + 1):
            note = str(sheet[f'K{row}'].value or '').strip()
            # Preserve purchasing units, without exposing item pricing or fabrication details.
            if 'per' in note.lower() and ('pieces' in note.lower() or 'meter' in note.lower()):
                count = re.search(r'\d+', note)
                note = 'Per meter' if 'meter' in note.lower() else f'Pack of {count.group()}' if count else ''
            else: note = ''
            items.append({'name': str(sheet[f'C{row}'].value).strip(), 'quantity': sheet[f'E{row}'].value * multiplier, 'note': note, 'sourceRow': row})
    amount = sum(round(sheet[f'I{row}'].value * 100) * multiplier for row, multiplier in totals)
    result['sections'].append({'name': name, 'scope': scope, 'totalFen': amount, 'totalCells': [f'I{r}' for r, _ in totals], 'items': items})
root = Path(__file__).resolve().parents[1]
(root / 'src/quotation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print([(s['name'], s['totalFen']/100, len(s['items'])) for s in result['sections']])
print('Grand total CNY', sum(s['totalFen'] for s in result['sections']) / 100)
