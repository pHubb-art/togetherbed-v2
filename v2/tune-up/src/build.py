# Builds tune-up.html from tune-up.src.html: embeds the rule table (Rules sheet) and the logo.
import json, re, openpyxl, pathlib
root = pathlib.Path('/mnt/project-files')
ws = openpyxl.load_workbook(root/'sleep-fit-rules/sleep-fit-rule-table.xlsx')['Rules']
rows = list(ws.iter_rows(values_only=True)); cols = rows[0]
rules = [dict(zip(cols, r)) for r in rows[1:] if r[0]]
for r in rules: r['team_weight'] = None; r['team_notes'] = None
logo = (root/'design-system/logo/lockup-together-bed.svg').read_text()
logo = re.sub(r'\s+xmlns:c2pa="[^"]*"', '', logo).replace('fill="#231f20"', 'fill="currentColor"')
logo = re.sub(r'<\?xml[^>]*\?>', '', logo).strip()
src = (root/'sleep-fit-game/tune-up.src.html').read_text()
src = src.replace('__HOW__', (root/'sleep-fit-game/how.html').read_text()).replace('__JS__', (root/'sleep-fit-game/game.js').read_text())
out = src.replace('__LOGO__', logo).replace('__RULES__', json.dumps(rules, ensure_ascii=False).replace('<', '\\u003c'))
(root/'sleep-fit-game/tune-up.html').write_text(out)
print(len(rules), 'rules', len(out), 'bytes')

# Standalone page for hosting outside Claude (GitHub Pages). Reads the database address from standalone-config.json if present.
cfg = root/'sleep-fit-game/standalone-config.json'
conf = json.loads(cfg.read_text()) if cfg.exists() else {'url': '', 'key': ''}
head = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="robots" content="noindex"><style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
        '<script>window.TB_CONFIG=' + json.dumps(conf) + '</script></head><body>')
(root/'sleep-fit-game/standalone').mkdir(exist_ok=True)
(root/'sleep-fit-game/standalone/index.html').write_text(head + out + '</body></html>')
print('standalone built, database', 'set' if conf.get('url') else 'NOT set')
