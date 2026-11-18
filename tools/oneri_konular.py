# -*- coding: utf-8 -*-
"""Önerilere dayanak bağlantısı ekler: her önerinin `konular` alanı o öneri metninin dayandığı şikâyet temalarının
(`temalar` id'leri), `sevilenler` alanı ise dayandığı olumlu konuların (`olumlu_konular` id'leri) listesidir.
Bağlantılar öneri metinlerine bakılarak elle eşlendi (tools/oneri_konular.json); metinde açıkça geçmeyen konu bağlanmadı.
tools/<kategori>/olustur.py ile bir data/<kategori>.json yeniden üretilirse bu alanlar silinir: ardından bu betik yeniden çalıştırılmalı.
"""
import json
import os
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESLEME = os.path.join(KOK, 'tools', 'oneri_konular.json')


def hata(mesaj):
    sys.exit('HATA: ' + mesaj)


def bicim_algila(ham):
    """Dosyanın satır sonu, girinti, ensure_ascii ve sondaki satır sonu biçimini algılar."""
    crlf = '\r\n' in ham
    if crlf and ham.replace('\r\n', '').count('\n'):
        hata('satır sonları karışık')
    girinti = None
    for satir in ham.split('\r\n' if crlf else '\n'):
        govde = satir.lstrip(' ')
        if govde and len(govde) != len(satir):
            girinti = len(satir) - len(govde)
            break
    if girinti is None:
        hata('girinti algılanamadı')
    ascii_mi = not any(ord(c) > 127 for c in ham) and (chr(92) + 'u') in ham
    son = '\r\n' if ham.endswith('\r\n') else ('\n' if ham.endswith('\n') else '')
    return {'crlf': crlf, 'girinti': girinti, 'ensure_ascii': ascii_mi, 'son': son}


def serilestir(veri, b):
    metin = json.dumps(veri, indent=b['girinti'], ensure_ascii=b['ensure_ascii'])
    if b['crlf']:
        metin = metin.replace('\n', '\r\n')
    return metin + b['son']


def main():
    with open(ESLEME, encoding='utf-8') as f:
        esleme = json.load(f)
    isler = []
    for kat, satirlar in esleme.items():
        yol = os.path.join(KOK, 'data', kat + '.json')
        if not os.path.isfile(yol):
            hata('veri dosyası yok: ' + yol)
        with open(yol, encoding='utf-8', newline='') as f:
            ham = f.read()
        veri = json.loads(ham)
        b = bicim_algila(ham)
        if serilestir(veri, b) != ham:
            hata(kat + '.json biçimi birebir korunamıyor (girinti/anahtar sırası/sayı gösterimi); dosyaya dokunulmadı')
        oneriler = veri.get('oneriler', [])
        if len(oneriler) != len(satirlar):
            hata('%s: öneri sayısı uyuşmuyor (veri %d, eşleme %d)' % (kat, len(oneriler), len(satirlar)))
        temalar = {t['id'] for t in veri['temalar']}
        olumlu = {t['id'] for t in veri['olumlu_konular']}
        for i, (o, e) in enumerate(zip(oneriler, satirlar)):
            if o['baslik'] != e['baslik']:
                hata('%s #%d: başlık uyuşmuyor: %r != %r' % (kat, i, o['baslik'], e['baslik']))
            for alan, gecerli in (('konular', temalar), ('sevilenler', olumlu)):
                if len(e[alan]) > 4:
                    hata('%s #%d: %s en fazla 4 id olabilir' % (kat, i, alan))
                for k in e[alan]:
                    if k not in gecerli:
                        hata('%s #%d: bilinmeyen %s id: %s' % (kat, i, alan, k))
            o['konular'] = list(e['konular'])
            o['sevilenler'] = list(e['sevilenler'])
        isler.append((yol, ham, serilestir(veri, b)))
    degisen = 0
    for yol, eski, yeni in isler:  # tüm doğrulamalar geçtikten sonra yaz
        if yeni != eski:
            with open(yol, 'w', encoding='utf-8', newline='') as f:
                f.write(yeni)
            degisen += 1
    print('%d dosya güncellendi, %d dosya zaten güncel.' % (degisen, len(isler) - degisen))


if __name__ == '__main__':
    main()
