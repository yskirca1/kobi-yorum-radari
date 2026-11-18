"""Ortak ayarlar: yollar depoya göre, adres ve tarayıcı ortam değişkeniyle değiştirilebilir.

RR_BASE    sitenin adresi (varsayılan http://localhost:8765/; depo kökünde `python -m http.server 8765`)
RR_CHROME  tarayıcı dosyasının yolu (verilmezse Windows'ta kurulu Edge, başka sistemde Playwright'ın Chromium'u)
Çıktılar (ekran görüntüleri, PDF, json) tests/out/ altına yazılır.
"""
import os, pathlib, sys

TESTS = pathlib.Path(__file__).resolve().parent
ROOT = TESTS.parent
DATA = ROOT / 'data'
BASE = os.environ.get('RR_BASE', 'http://localhost:8765/')
if not BASE.endswith('/'): BASE += '/'

try:
  sys.stdout.reconfigure(encoding='utf-8')
except Exception:
  pass


def outdir(sub=''):
  p = TESTS / 'out' / sub if sub else TESTS / 'out'
  p.mkdir(parents=True, exist_ok=True)
  return str(p) + os.sep


def launch_kwargs():
  exe = os.environ.get('RR_CHROME')
  if exe: return {'executable_path': exe}
  if os.name == 'nt': return {'channel': 'msedge'}
  return {}
