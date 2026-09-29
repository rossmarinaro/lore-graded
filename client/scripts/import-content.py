"""Extract static source content into typed data; never execute legacy scripts."""
from html.parser import HTMLParser
from pathlib import Path
import json,re,sys,hashlib,shutil
source=Path(sys.argv[1]);root=Path(__file__).resolve().parent.parent
class Parser(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.root={'tag':'root','attributes':{},'children':[]};self.stack=[self.root]
 def handle_starttag(self,tag,attrs):
  node={'tag':tag,'attributes':dict(attrs),'children':[]};self.stack[-1]['children'].append(node)
  if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(node)
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i]['tag']==tag:self.stack=self.stack[:i];break
 def handle_data(self,data):
  if data.strip():self.stack[-1]['children'].append(data)
def walk(node):
 if isinstance(node,str):return
 yield node
 for child in node['children']:yield from walk(child)
def plain(node):return node if isinstance(node,str) else ' '.join(plain(c) for c in node['children'])
def simplify(node):
 if isinstance(node,str):return re.sub(r'\s+',' ',node)
 if node['tag'] in ['script','style','head','noscript','svg','canvas','template']:return None
 attrs={k:v for k,v in node['attributes'].items() if k in ['id','href','src','alt','poster','type','placeholder','value','name','title','width','height','controls','hidden','open','aria-label','data-screen','download']}
 children=[v for c in node['children'] if (v:=simplify(c)) is not None]
 return {'tag':node['tag'],'attributes':attrs,'children':children}
pages={};inventory=[]
for f in sorted(source.rglob('*.html')):
 route='/'+str(f.relative_to(source));parser=Parser();text=f.read_text(errors='replace');parser.feed(text);nodes=list(walk(parser.root));body=next((n for n in nodes if n['tag']=='body'),parser.root);title=next((plain(n) for n in nodes if n['tag']=='title'),route)
 scripts=[n['attributes'].get('src','inline script') for n in nodes if n['tag']=='script'];forms=sum(n['tag']=='form' for n in nodes)
 pages[route]={'path':route,'title':title,'content':simplify(body),'requiresBehaviorMigration':bool(scripts or forms),'sourceScripts':scripts}
 inventory.append({'path':route,'title':title,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'externalScripts':scripts,'forms':forms,'status':'content-converted; legacy behaviors require explicit React port' if scripts or forms else 'content-converted'})
(root/'src/data/pages.json').write_text(json.dumps(pages,ensure_ascii=False))
(root/'docs/route-inventory.json').write_text(json.dumps(inventory,indent=2))
script_inventory=[]
for f in sorted(source.rglob('*.js')):
 text=f.read_text(errors='replace');script_inventory.append({'path':str(f.relative_to(source)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'apiPaths':sorted(set(re.findall(r'[\"\'](/api/[^\"\']*)',text)))})
(root/'docs/script-inventory.json').write_text(json.dumps(script_inventory,indent=2));print(f'Extracted {len(pages)} routes; inventoried {len(script_inventory)} scripts')
