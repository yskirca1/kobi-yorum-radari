"""Sweatshirt ham yorum dosyalarından data/sweatshirt.json üretir (termos.json ile aynı yapı)."""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU, oran, tl

AD = {
    '777723073': 'Tudors Relax Fit Yarım Fermuarlı Dik Yaka Sweatshirt, içi polarlı, siyah',
    '338581269': 'Madmext Bisiklet Yaka Basic Sweatshirt, füme',
    '343388614': 'Modagen Unisex Baskılı Oversize Kapüşonlu Sweatshirt, bebe mavisi',
    '466787620': 'Altamira Unisex Baskılı Oversize Kapüşonlu Sweatshirt, bej',
    '839417686': 'Grimelange Vaneltina Kadın İçi Polarlı Oversize Basic Sweatshirt',
    '856685071': 'Trendgar 3\'lü Dik Yaka Fermuarlı Oversize Sweatshirt Seti',
}
DIKKAT = {
    '777723073': [
        'Kalıp dar: olumsuz yorumların neredeyse dörtte biri bir, hatta iki beden büyük almayı öneriyor.',
        'İçteki polar ilk yıkamalarda tüy bırakıyor; altına giyilen açık renk tişörtü kirlettiği yazılıyor.',
        'Yanlış beden gönderimi sık: S istenip XL, XL istenip S gelen siparişler 1 yıldız getiriyor.',
    ],
    '338581269': [
        'Kalıp çok bol: "en küçük beden bile büyük" yorumu yaygın, bir beden küçük almak öneriliyor.',
        'Füme renk siparişlerinde açık gri gelen ürün şikâyeti sık; fotoğraftaki ton tutmuyor.',
        'Aynı ilanda başka satıcılar da var; etiketi farklı, başka markalı ürün geldiği yazılıyor.',
    ],
    '343388614': [
        'Fotoğrafta kalın ve pofuduk görünen ürünün ince geldiği şikâyeti en sık sorun.',
        'Kapüşon ipi eksik gelen ve fotoğraftan farklı dikilmiş ürün yorumları var.',
        'Beden tutarsız: S-M ve L-XL gibi çift beden etiketleri karışıklık yaratıyor.',
    ],
    '466787620': [
        'Tüylenme kategorideki en yüksek oranda: yorumların çoğu ilk yıkamadan sonra tiftiklendiğini söylüyor.',
        'Krem görünen renk sütlü kahve ya da daha koyu geliyor.',
        '"Oversize" yazmasına rağmen düz kalıp olduğu, bol durmadığı yazılıyor.',
    ],
    '839417686': [
        'Yıkamada çekme ve tüylenme birlikte geliyor; "ilk yıkamada mahvoldu" yorumu sık.',
        'Renkler arasında kumaş farkı var: siyahı kalın, beyazı ince ve farklı kalıpta bulunuyor.',
        'Beyaz renk sarı ya da krem tonda geliyor; beden karışıklığı ve gecikmeli kargo da şikâyet konusu.',
    ],
    '856685071': [
        '3\'lü sette parçaların bedeni ve kalıbı birbirinden farklı gelebiliyor.',
        'Yıkayınca belirgin çekiyor; çok sayıda yorum bir iki beden büyük almayı öneriyor.',
        'Setteki parçalardan birinin yırtık ya da defolu çıktığı sık yazılıyor.',
    ],
}
DERS = {
    '777723073': [
        'Olumlu yorumların yarısı hediye alımı. Yanlış beden gönderimi hediyeyi bozuyor; paketlemede beden kontrolü ve kolay değişim burada doğrudan puan demek.',
        'Lider üründe bile beden tablosu yetmiyor; müşteriler birbirine boy-kilo-beden yazarak yol gösteriyor.',
    ],
    '338581269': [
        'Olumsuz yorumların %40\'ı ilandaki başka satıcılardan; önerilen ilk 100 yorumda bu oran %1. Aynı ürünü birçok satıcı satınca kontrol kayboluyor ve markanın puanı düşüyor.',
        'Renk adı ile fotoğraf aynı tonu göstermeli; "füme" yazıp açık gri göndermek iade yerine sessiz 1 yıldız getiriyor.',
    ],
    '343388614': [
        'Düşük fiyat ince kumaşı affettirmiyor. Fotoğraf beklentiyi kalın gösterirse 1-2 yıldız payı kategorinin en yükseğine (%22) çıkıyor.',
        'Renk ve fiyat-performans seviliyor; kumaş kalınlığını (iplik, gramaj) açıkça yazmak beklentiyi doğru kurar.',
    ],
    '466787620': [
        'Yıkama sonrası performans, ürün vaadinin asıl sınavı. Tüylenmeye dayanıklı kumaş ve yıkama talimatı en büyük şikâyeti hedefler.',
        'Başlıktaki "oversize" kelimesi tutmazsa müşteri kendini yanıltılmış hissediyor.',
    ],
    '839417686': [
        'Aynı ürünün renkleri arasında kalite farkı güveni bozuyor; renkler ve üretim partileri arasında kumaş kontrolü şart.',
        'Kumaş içeriği değiştiyse açıklama da güncellenmeli: müşteri pamuk oranının düştüğünü etiketten fark edip yazıyor.',
    ],
    '856685071': [
        'Çoklu pakette tek defolu parça bütün siparişi 1 yıldıza çeviriyor; paketlemeden önce her parçayı kontrol et.',
        'Fiyat-performans için alan müşteri de setteki parçaların aynı beden ve kalıpta olmasını bekliyor.',
    ],
}
# Alıntılar: (konu, yorum metninin başı) — metin ham veriden aynen alınır
ALINTI = {
    '777723073': [('Kalıp dar / küçük', 'Kendi bedenizin en az 2 beden'), ('Tüylenme / tiftiklenme', 'Sweat içine beyaz bir şey giyince'),
                  ('Yanlış beden / ürün gönderildi', 'Hediye aldım M beden sipariş'), ('Olumlu: beden bilgisi', 'Ürünü oğlum için aldım...beden L')],
    '338581269': [('Renk görseldekinden farklı', 'hiç gözüktüğü gibi değil ne oversize'), ('Yanlış beden / ürün gönderildi', 'sözde madmext marka yollayacaklardı'),
                  ('Kalıp bol / büyük', 'en küçük bedeni bile aşırı bol'), ('Olumlu: salaş duruş', 'Mükemmel kendi bedenimi almama rağmen')],
    '343388614': [('İnce / kalitesiz kumaş', 'Fotoğraftan yola çıkarak böyle pofuduk'), ('Görseldeki gibi değil', 'Abi sweat güzel fln ama burda'),
                  ('Kalıp dar / küçük', 'kumaş kalitesi ama bedenler standartlara'), ('Olumlu: renk ve fiyat', 'Harika renk harika kumaş fiyatın')],
    '466787620': [('Tüylenme / tiftiklenme', 'Rejenere iplikten üretilmiş'), ('Renk görseldekinden farklı', 'Urun gayet guzel ama renginin'),
                  ('Oversize değil', 'oversize felan olduğu yok'), ('Olumlu: sıcak ve yumuşak', 'ürüne bayildim içi yumusacik')],
    '839417686': [('Tüylenme / tiftiklenme', 'Ürün ilk geldiğinde çok güzel diyorsunuz'), ('İnce / kalitesiz kumaş', 'Aynı ürünü daha önce de almıştım'),
                  ('Renk görseldekinden farklı', 'Rengi kesinlikle beyaz değil'), ('Olumlu: beden bilgisi', 'Çok güzel, yumaşacık bir sweet')],
    '856685071': [('Kalıp dar / küçük', '3 kazağında kalıbı farklı'), ('Defolu / lekeli / yırtık geldi', 'hediye gönderdim biri tiftiklenmiş'),
                  ('Yıkayınca çekiyor', 'eşim için aldım ( 1.80 - 83kg )'), ('Olumlu: fiyat performans', 'ürün kalitesi gerçekten çok iyi, bu fiyata')],
}
ONERILER = [
    ('Beden tablosunu boy ve kiloyla ver',
     'Olumsuz yorumlarda beden ve kalıp sorunu oranı %{beden}: dar, bol, "oversize değil", yıkayınca çekme ya da yanlış beden. Olumlu yorumlarda kendi boy-kilo-bedenini yazanların oranı %{boykilo}; müşteri bu bilgiyi arıyor. Ürün sayfasına "170 cm, 65 kg → M" tarzı bir tablo ve mankenin ölçülerini koy.'),
    ('Tüylenmeyi yıkamadan önce çöz',
     'Tek başına en sık şikâyet tüylenme (%{tuy}). Bu şikâyetlerin yaklaşık yarısı ilk yıkamalardan sonra yazılmış. Tüylenme testinden geçmiş kumaş seç; içi polarlıysa ürünle birlikte yıkama kartı gönder (ters çevir, 30°, kurutma makinesi yok).'),
    ('Kumaşı fotoğrafta abartma, kalınlığını yaz',
     'KOBİ ürünlerinde "ince, kalitesiz kumaş" şikâyeti büyük markaların yaklaşık üç katı (%{ince_k} ve %{ince_b}). Kalın görünen fotoğraf ince ürünle buluşunca 1 yıldız geliyor. İplik sayısını ya da gramajı yaz, yakın çekim kumaş fotoğrafı ekle.'),
    ('Doğru bedeni, doğru ürünü gönder',
     'Büyük markaların olumsuz yorumlarında yanlış beden ya da ürün gönderimi oranı %{yanlis_b}: S yerine XL, füme yerine bej, hatta başka marka. Paketlemede etiket kontrolü basit ama güçlü bir ayrışma noktası.'),
    ('Rengi gün ışığında çek',
     'Renk farkı şikâyeti kategoride %{renk}, ama bazı ürünlerde %13-14\'e çıkıyor: füme açık gri, krem sütlü kahve geliyor. Filtresiz, gün ışığında fotoğraf ve net renk adı iadeyi ve sessiz 1 yıldızı azaltır.'),
    ('Hediye alıcısını hedefle',
     'Önerilen yorumlarda eş, sevgili ya da çocuk için hediye alımı oranı %{hediye} (bir üründe %50). Hediye notu, kolay beden değişimi ve hediye paketi bu kitleyi kazanır; ama paket söz verildiyse mutlaka gönderilmeli.'),
]

def p(v): return f'{round(v * 100):d}'

def main(out):
    urunler, P = [], []
    for uid, (kisa, marka, seg) in DOSYALAR.items():
        d = json.load(open(f'rv_{uid}.json'))
        m, top, neg = d['meta'], d['top'], d['neg']
        y = [d['dist'][str(i)] for i in range(1, 6)]
        yaz = sum(y)
        # Yorum sayfasında görseli bulunamayan ürün: ürün sayfasının og:image değeri elle alındı
        g = m.get('gorsel', '') or {'343388614': 'https://cdn.dsmcdn.com/ty510/product/media/images/20220820/12/163121250/548323425/1/1_org_zoom.jpg'}.get(uid, '')
        g = re.sub(r'^https://cdn\.dsmcdn\.com/', 'https://cdn.dsmcdn.com/mnresize/400/-/', g) if g else ''
        alinti = []
        for konu, bas in ALINTI[uid]:
            r = next((r for r in top + neg if r['text'].startswith(bas)), None)
            assert r, (uid, bas)
            alinti.append({'konu': konu, 'yildiz': r['stars'], 'metin': r['text']})
        urunler.append({
            'id': uid, 'kisa': kisa, 'marka': marka, 'ad': AD[uid], 'segment': seg, 'gorsel': g,
            'link': m['url'].split('?')[0].replace('/yorumlar', ''), 'yazili': yaz, 'yildiz': y,
            'ort': round(sum((i + 1) * v for i, v in enumerate(y)) / yaz, 2),
            'onerilen_ort': round(sum(r['stars'] for r in top) / len(top), 2),
            'onerilen_dusuk': sum(1 for r in top if r['stars'] <= 2), 'ornek_dusuk': len(neg),
            'sikayet': {k: round(oran(neg, v[2]), 2) for k, v in SIKAYET.items()},
            'olumlu': {k: round(oran(top, v[1]), 2) for k, v in OLUMLU.items()},
            'dikkat': DIKKAT[uid], 'ders': DERS[uid], 'alinti': alinti,
        })
        P.append((seg, neg, top))
    allneg = [r for _, n, _ in P for r in n]
    big = [r for s, n, _ in P if s != 'KOBİ' for r in n]
    kobi = [r for s, n, _ in P if s == 'KOBİ' for r in n]
    union = lambda L, ks: sum(1 for r in L if any(re.search(SIKAYET[k][2], tl(r['text'])) for k in ks)) / len(L)
    ort_top = lambda k: sum(oran(t, OLUMLU[k][1]) for _, _, t in P) / len(P)
    v = {'beden': p(union(allneg, ['dar', 'bol', 'oversize', 'cekme', 'yanlis'])), 'boykilo': p(ort_top('boykilo')),
         'tuy': p(oran(allneg, SIKAYET['tuylenme'][2])), 'ince_k': p(oran(kobi, SIKAYET['ince'][2])), 'ince_b': p(oran(big, SIKAYET['ince'][2])),
         'yanlis_b': p(oran(big, SIKAYET['yanlis'][2])), 'renk': p(oran(allneg, SIKAYET['renk'][2])), 'hediye': p(ort_top('hediye'))}
    print('öneri rakamları', v, file=sys.stderr)
    cat = {
        'id': 'sweatshirt', 'ad': 'Sweatshirt', 'ust': 'Giyim',
        'esanlam': ['sweatshirt', 'sweat', 'svetşört', 'sweatşirt', 'kapüşonlu', 'hoodie', 'polar sweatshirt', 'oversize sweatshirt'],
        'toplama': '2 Kasım 2026', 'kaynak': 'Trendyol',
        'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
        'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
        'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER],
        'urunler': urunler,
    }
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)

main(sys.argv[1])
