import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
import asyncio, subprocess, re, shutil
from playwright.async_api import async_playwright
B=BASE
SVG=b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e8eef3"/></svg>'
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(**launch_kwargs())
    ctx=await br.new_context(viewport={'width':1440,'height':900}, color_scheme='dark'); pg=await ctx.new_page()
    await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
    await pg.route('**/fonts.g*/**', lambda r: r.abort())
    await pg.goto(B); await pg.evaluate("localStorage.setItem('rr_theme','dark'); localStorage.setItem('kyr_cmp', JSON.stringify([{cat:'termos',id:'780345921'},{cat:'termos',id:'748758153'}]))")
    for cat in ['termos','kedi-tirmalama','sweatshirt']:
      await pg.goto(B+'#/kategori/'+cat); await pg.reload(); await pg.wait_for_timeout(700)
      await pg.emulate_media(media='print')
      info=await pg.evaluate("""(()=>{const vis=s=>[...document.querySelectorAll(s)].some(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden');
        return {bg:getComputedStyle(document.body).backgroundColor, ink:getComputedStyle(document.body).color, header:vis('.top'), cmpbar:vis('.cmpbar'), buttons:vis('button'), imgs:vis('img'), filters:vis('#filters'), pgrid:vis('#pgrid'),
          table:vis('.ptable'), rows:document.querySelectorAll('.ptable tbody tr').length, seg:vis('.seg-chart .legend'), recs:document.querySelectorAll('.recs li').length, foot:document.querySelector('.prt-foot').innerText}})()""")
      print(cat, info)
      f=outdir('print')+f'print-{cat}.pdf'
      await pg.pdf(path=f, format='A4', print_background=True, prefer_css_page_size=True)
      await pg.screenshot(path=outdir('print')+f'print-media-{cat}.png', full_page=True)
      await pg.emulate_media(media='screen')
      # Sayfa sayısı: PDF içindeki sayfa nesneleri (pdfinfo gerekmez)
      n=len(re.findall(rb'/Type\s*/Page[^s]', open(f,'rb').read()))
      print(' pages:', n, 'OK' if 2<=n<=4 else 'CHECK')
      if shutil.which('pdftoppm'): subprocess.run(['pdftoppm','-png','-r','80',f,outdir('print')+f'print-{cat}-p'])
    await br.close()
asyncio.run(main())
