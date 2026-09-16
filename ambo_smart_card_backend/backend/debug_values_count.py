from pathlib import Path
import re
text = Path('routes/auth.js').read_text(encoding='utf-8')
start = text.index('const values = [')
end = text.index('];', start)
vals = text[start:end]
# Remove the declaration line
vals_body = vals.split('const values = [', 1)[1]
# Remove any line comments
vals_body = re.sub(r'//.*', '', vals_body)
# Remove brackets
vals_body = vals_body.replace('[', '').replace(']', '')
# split by comma
items = [item.strip() for item in re.split(r',\s*', vals_body) if item.strip()]
print('raw count', len(items))
for i, item in enumerate(items, 1):
    print(i, repr(item))
print('last item', items[-1])
print('line count', vals.count('\n'))
