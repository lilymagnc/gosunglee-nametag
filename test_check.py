import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('members.json', encoding='utf-8') as f:
    members = json.load(f)

targets = ['이동광', '이병직', '이동찬', '이운배', '이귀영', '이기석', '이승건', '이익환']
print(f"Total members: {len(members)}")
for m in members:
    if m['name'] in targets:
        print(f"[{m['branch']}] {m['generation']}세 {m['name']} | 직업: {m['job']} | 연락처: {m['mobile']}")
