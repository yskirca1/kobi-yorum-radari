import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
import asyncio
from playwright.async_api import async_playwright
B=BASE; O=outdir('shots3')
SVG=b'<svg xmlns="http://www.w3.org/2000/svg" width="4" height="6"/>'
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(**launch_kwargs())
    for name,(w,h),theme,custom in [('desktop-default',(1440,900),'light',0),('desktop-custom-expanded',(1440,900),'light',1),('mobile',(390,844),'light',0),('dark',(1440,900),'dark',0),('mobile-expanded',(390,844),'light',1)]:
      ctx=await br.new_context(viewport={'width':w,'height':h}); pg=await ctx.new_page()
      await pg.route('**/fonts.g*/**', lambda r: r.abort())
      await pg.goto(B); await pg.evaluate(f"localStorage.clear(); localStorage.setItem('rr_theme','{theme}')" + ("; localStorage.setItem('rr_firsat_w', JSON.stringify({p:'ozel',w:[5,0,2,0,1],c:true}))" if custom else ''))
      await pg.goto(B+'#/firsat'); await pg.reload(); await pg.wait_for_timeout(700)
      if custom: await pg.click('#ft-body tr[data-row]:nth-child(1) [data-exp]')
      await pg.evaluate("document.querySelector('.top').style.position='static'")
      await pg.screenshot(path=O+f'firsat-{name}.png', full_page=True)
      await ctx.close()
    await br.close()
asyncio.run(main())
