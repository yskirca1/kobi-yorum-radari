import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import BASE, DATA, outdir, launch_kwargs
import asyncio, json, sys
from playwright.async_api import async_playwright
B=BASE
SVG=b'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e8eef3"/><rect x="100" y="80" width="200" height="440" rx="30" fill="#557"/></svg>'
async def main():
  async with async_playwright() as p:
    br=await p.chromium.launch(**launch_kwargs())
    ctx=await br.new_context(viewport={'width':1440,'height':900}); pg=await ctx.new_page()
    await pg.route('**/cdn.dsmcdn.com/**', lambda r: r.fulfill(status=200, content_type='image/svg+xml', body=SVG))
    await pg.route('**/fonts.g*/**', lambda r: r.abort())
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type in ('error','warning') else None)
    for hs in sys.argv[1:]:
      errs.clear(); await pg.goto(B+hs); await pg.wait_for_timeout(600)
      print(hs, await pg.title(), '|', (await pg.inner_text('#app'))[:int(__import__("os").environ.get("N","150"))].replace('\n',' | '), errs)
    await br.close()
asyncio.run(main())
