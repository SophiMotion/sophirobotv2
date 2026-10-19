from pathlib import Path
import json,shutil,zipfile
src=Path('public/fusion');dst=Path('public/fusion-old');shutil.copytree(src,dst,dirs_exist_ok=True)
schema=dst/'SophiRobotExport/schema.json';data=json.loads(schema.read_text());data['sourceSha256']=json.loads(Path('src/platforms.json').read_text())['old']['sha256'];schema.write_text(json.dumps(data,indent=2))
p=dst/'README.md';p.write_text(p.read_text().replace('Assembly_V2_website_new platform .step','Assembly_V2_website_old mobile platform.step')+'\nThis helper schema is for the Old mobile platform selection. Open the matching native Fusion design and verify its parameter definitions before applying the request.\n')
with zipfile.ZipFile(dst/'SophiRobot-Fusion-Export.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in (dst/'SophiRobotExport').iterdir():
  if p.is_file():z.write(p,p.relative_to(dst))
 z.write(dst/'README.md','README.md')
with zipfile.ZipFile(dst/'SophiRobot-Fusion-Export.zip') as z:assert z.testzip() is None
