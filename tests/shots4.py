import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
import asyncio, json, sys
from playwright.async_api import async_playwright
B=BASE; O=outdir('shots4')
SVG=b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#ffffff"/><rect x="120" y="100" width="160" height="400" rx="24" fill="#8a96a3"/></svg>'
TH=['acik','krem','adacayi','koyu','gece']
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(**launch_kwargs())
    ctx=await br.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page()
    await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
    await pg.route('**/fonts.g*/**', lambda r: r.abort())
    await pg.goto(B)
    for t in TH:
      await pg.evaluate(f"localStorage.setItem('rr_theme','{t}')")
      for name,h,full in [('home','#/',False),('firsat','#/firsat',False)]+([('kategori','#/kategori/termos',False)] if t in ('krem','gece') else []):
        await pg.goto(B+h); await pg.reload(); await pg.wait_for_timeout(700)
        await pg.screenshot(path=O+f'{name}-{t}.png', full_page=full)
    await pg.evaluate("localStorage.setItem('rr_theme','krem')"); await pg.goto(B+'#/'); await pg.reload(); await pg.wait_for_timeout(500)
    await pg.click('#theme'); await pg.wait_for_timeout(150)
    await pg.screenshot(path=O+'picker-open.png', clip={'x':900,'y':0,'width':540,'height':420})
    await br.close()
asyncio.run(main())
