import re,json,os,html
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
IT=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'it.json')))
pages=['index.html','about.html','services.html','gallery.html','uniforms.html','contact.html','privacy.html']
DOMAIN='https://edesshirts.com/'
# Link previews (WhatsApp, LinkedIn...) must point at an address that serves this site.
# Until edesshirts.com is moved to Cloudflare it still shows the old Wix site, so use pages.dev.
# After the domain switch, set OG_DOMAIN = DOMAIN and rebuild.
OG_DOMAIN='https://edes-website.pages.dev/'
def switch(p,cur,prefix_en,prefix_it,label):
    en=f'<a href="{prefix_en}{p}" lang="en" hreflang="en"'+(' aria-current="true"' if cur=='en' else '')+'>EN</a>'
    it=f'<a href="{prefix_it}{p}" lang="it" hreflang="it"'+(' aria-current="true"' if cur=='it' else '')+'>IT</a>'
    return f'<span class="lang-switch" role="group" aria-label="{label}">{en}{it}</span>'

def url(p,lang,base=None):
    # Cloudflare Pages serves /about for about.html, so public URLs drop .html
    path='' if p=='index.html' else p[:-5]
    return (base or DOMAIN)+('it/' if lang=='it' else '')+path
def seo(p,lang,s):
    """Canonical, hreflang, icons and link-preview tags, between <!-- seo --> markers."""
    s=re.sub(r'<!-- seo -->.*?<!-- /seo -->\n','',s,flags=re.S)
    s=re.sub(r'<link rel="alternate" hreflang="[^"]+" href="[^"]+">\n','',s)
    title=html.unescape(re.search(r'<title>(.*?)</title>',s,re.S).group(1))
    desc=html.unescape(re.search(r'<meta name="description" content="([^"]*)"',s).group(1))
    e=lambda t: html.escape(t,quote=True)
    block=f"""<!-- seo -->
<link rel="canonical" href="{url(p,lang)}">
<link rel="alternate" hreflang="en" href="{url(p,'en')}">
<link rel="alternate" hreflang="it" href="{url(p,'it')}">
<link rel="alternate" hreflang="x-default" href="{url(p,'en')}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#000000">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EDES Shirts">
<meta property="og:locale" content="{'it_IT' if lang=='it' else 'en_GB'}">
<meta property="og:url" content="{url(p,lang,OG_DOMAIN)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{OG_DOMAIN}images/og-image.jpg">
<meta property="og:image:alt" content="EDES shirt factory in Tirana: CMT Shirt Manufacturing for Private Label">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<!-- /seo -->
"""
    return s.replace('</head>',block+'</head>',1)
# 1. English pages: add switch + hreflang (idempotent)
for p in pages:
    s=open(p).read()
    if 'class="lang-switch"' not in s:
        sw=switch(p,'en','','it/','Language')
        s=s.replace('    <div class="end">\n','    <div class="end">\n      '+sw+'\n',1)
        s=re.sub(r'(<nav class="panel"[^>]*>\n(?:.*\n)*?)(    </nav>)',lambda m:m.group(1)+'      '+sw+'\n'+m.group(2),s,count=1)
    open(p,'w').write(seo(p,'en',s))
# 2. Italian pages
TOK=re.compile(r'(<!--.*?-->|<script\b.*?</script>|<style\b.*?</style>|<[^>]+>)',re.S)
ATTR=re.compile(r'\b(alt|aria-label|placeholder|title|content)="([^"]*)"')
missing=set()
os.makedirs('it',exist_ok=True)
for p in pages:
    s=re.sub(r'<!-- seo -->.*?<!-- /seo -->\n','',open(p).read(),flags=re.S)
    out=[]
    for part in TOK.split(s):
        if not part: continue
        if part.startswith('<'):
            if not part.startswith(('<!--','<script','<style')):
                def ra(m):
                    k,v=m.group(1),m.group(2)
                    if k=='content' and not re.search(r'name="(description|og:|twitter:)|property="og:',part): return m.group(0)
                    t=v.strip()
                    if t and re.search('[A-Za-z]{2}',t):
                        if t in IT: return f'{k}="{v.replace(t,IT[t])}"'
                        missing.add(t)
                    return m.group(0)
                part=ATTR.sub(ra,part)
            out.append(part)
        else:
            t=part.strip()
            if t and re.search('[A-Za-z]{2}',t):
                if t in IT: part=part.replace(t,IT[t])
                else: missing.add(t)
            out.append(part)
    s=''.join(out)
    s=s.replace('<html lang="en"','<html lang="it"',1)
    # asset paths up one level
    s=re.sub(r'((?:href|src)=")(styles|js|icons|images|gallery)/',r'\1../\2/',s)
    # language switch: EN -> ../page, IT current
    s=re.sub(r'<span class="lang-switch".*?</span>',switch(p,'it','../','','Lingua'),s)
    open('it/'+p,'w').write(seo(p,'it',s))
# 3. Sitemap with both languages
sm=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for p in pages:
    for lang in ('en','it'):
        sm.append(f'  <url><loc>{url(p,lang)}</loc>'
                  f'<xhtml:link rel="alternate" hreflang="en" href="{url(p,"en")}"/>'
                  f'<xhtml:link rel="alternate" hreflang="it" href="{url(p,"it")}"/></url>')
sm.append('</urlset>')
open('sitemap.xml','w').write('\n'.join(sm)+'\n')
missing -= {'EN', 'IT', 'Language'}  # language switch labels, set by switch()
if missing:
    print('Missing Italian translations (add them to i18n/it.json):')
    for m in sorted(missing): print('  -', m)
else:
    print('Italian pages built: it/' + ', it/'.join(pages))
