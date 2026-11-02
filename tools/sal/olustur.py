"""Şal: 8 ham dosya (rv_<id>.json) + tarayıcıda hesaplanan 4 ürün (sal_tarayici.json) -> data/sal.json"""
import json, re, sys
from analiz import DOSYALAR, TARAYICI, SIKAYET, OLUMLU, oran, tl

AD = {
    '327241909': 'Armine Medine İpeği Şal, siyah',
    '51132406': 'Armine Trend Şal 2206',
    '778137757': 'Aker Elegance Monogram Şal, füme',
    '950221597': 'Modakaşmir Aya Serisi Şal, kakao',
    '811110897': 'Modakaşmir Neo Pamuk Şal, siyah',
    '944739275': 'Mira İpek Gül Desen Pamuk Şal, pudra',
    '968548196': 'Mira İpek İlham Serisi Etnik Desenli Şal ps33',
    '973174379': 'Mira İpek Batik Desenli Pamuk Soft Şal ps24',
    '468684489': "Bambu Kraş Şal 3'lü Set, lacivert-mavi-gri",
    '763220958': "Organic Scarfs Bambu Kraş Şal 3'lü Set",
    '211986804': 'Afvente Paisley Desen Soft Pamuk Şal, kahverengi',
    '366531659': "Naciye Sultan Penye Şal 4'lü Set",
}
# Yorum sayfasında görseli bulunamayan ürün: ürün sayfasının og:image değeri
GORSEL_EK = {'366531659': 'https://cdn.dsmcdn.com/ty727/product/media/images/20230212/20/279886355/593916939/1/1_org_zoom.jpg'}
DIKKAT = {
    '327241909': ['Yorum sayısı az ve 1-2 yıldız payı düşük (%4); şikâyetler kumaşın sert ve kalın olmasında toplanıyor.',
                  'Ürünü markanın kendisi değil, birden çok bayi satıyor; yanlış renk ve kargo şikâyetleri bayilerden.',
                  '"Medine ipeği değil, yazın yakar" diyen alıcılar var.'],
    '51132406': ['Kumaş sert ve kağıt gibi bulunuyor; "naylon gibi, şekil almıyor" yorumu sık.',
                 '"Armine kalitesinde değil" diyenler markadan daha yüksek beklenti içinde.',
                 'Hediye paketi istenip düz poşetle gelen siparişler iadeye dönüyor.'],
    '778137757': ['1-2 yıldız payı çok düşük (%5); yalnızca 6 olumsuz yorum var.',
                  'Fotoğraftaki pamuklu görünümün polyester çıktığı ve önünün kaydığı yazılıyor.',
                  'Kutusuz gelen ya da ipi çekilmiş ürün şikâyeti var.'],
    '950221597': ['Defo kategorinin en yüksek oranında: olumsuzların %38\'i kenar dikişi sökük, ipi çekik ya da lekeli ürün.',
                  '"Başkasının iadesini göndermişler" yorumu var; ürün birçok bayiden satılıyor.',
                  'Kakao, acı kahve gibi tonlar fotoğraftakinden farklı geliyor; ölçünün yanlış geldiği de yazılıyor.'],
    '811110897': ['Defo ve dikiş açılması sık; ipi çekik gelen ürünler var.',
                  'Yıkamada solma, tiftiklenme ve boya bırakma şikâyeti kategorinin en yükseği (%18).',
                  'Satıcı bir bayi; "bu neo pamuk değil, başka ürün göndermişler" diyenler var.'],
    '944739275': ['Kumaş sert ve kalın; "pamuklu değil, polyester" yorumu sık.',
                  'Renk fotoğraftaki kadar canlı değil, soluk geliyor.',
                  'Şeklin tutmadığı, sürekli düzeltmek gerektiği yazılıyor.'],
    '968548196': ['Renk fotoğraftakinden soluk; bordoya kaçtığı söyleniyor.',
                  'Baskı dijital ve yapmacık duruyor; desen fotoğraftakinden büyük geliyor.',
                  'Kumaşın naylon gibi olduğu, yazın terlettiği yazılıyor.'],
    '973174379': ['Kahverengi siparişlerde bordo, pembe ya da gül kurusu gelen ürün şikâyeti sık.',
                  'Renk fotoğraftakinden daha koyu geliyor.',
                  'Önceki alımlara göre kumaşın kalınlaştığını söyleyenler var.'],
    '468684489': ['Olumsuzların %40\'ı yanlış renk gönderiminden: lacivert yerine siyah ya da yeşil, gri yerine bebe mavisi.',
                  'Setteki renkler fotoğrafla tutmuyor.',
                  'Kumaşın ince olduğu, iç gösterdiği yazılıyor.'],
    '763220958': ['Kategorinin en yüksek 1-2 yıldız payı (%27): seçilen renkler yerine başka renkler geliyor.',
                  'Olumsuzların %39\'u renk farkından, %31\'i yanlış gönderimden söz ediyor.',
                  'Renklerin solmuş ve kullanılmış gibi geldiği, süsün kırık geldiği yazılıyor.'],
    '211986804': ['Defo sık: ortasında çizgi baskı hatası, çekilmiş ya da deforme şallar.',
                  'Farklı model sipariş edilip aynısının geldiği yazılıyor.',
                  '"Pamuk yazıyor ama naylonumsu" diyenler var; kayan bir yapısı olduğu söyleniyor.'],
    '366531659': ['Penye kumaş çok ince; önünün şekil almadığı yazılıyor.',
                  'Renkler fotoğraftan farklı: karamel turuncu, kahve çikolata geliyor.',
                  'Setteki şallardan birinin kusurlu ya da yırtık geldiği söyleniyor.'],
}
DERS = {
    '327241909': ['Büyük marka ürünü bayiler satınca paketleme ve gönderim kalitesi bayiye kalıyor; marka puanı bundan etkileniyor.'],
    '51132406': ['Marka adı beklentiyi yükseltiyor: aynı kumaş bir KOBİ\'de idare eder sayılırken "Armine kalitesinde değil" diye 1 yıldız alıyor.'],
    '778137757': ['Az şikâyet var ama hepsi "pamuk gibi görünüp polyester çıkması". Kumaş içeriği fotoğraftaki dokuyla tutarlı olmalı.'],
    '950221597': ['Yüksek puanlı bir ürün (ortalama 4,3) bile defolu gönderimle 1 yıldız topluyor. Kenar dikişi kontrolü ve iade dönen ürünü yeniden satmamak şart.'],
    '811110897': ['Aynı serinin farklı renklerinde yıkama dayanımı farklı; renk haslığı testi her renk için ayrı yapılmalı.'],
    '944739275': ['Kategorinin en çok yorum alan ürünlerinden; 1-2 yıldız payı düşük (%5), şikâyetler kumaş tercihinde. Mevsime göre kumaş seçeneği bu müşteriyi tutar.'],
    '968548196': ['Desenli şalda baskı kalitesi fotoğrafla aynı olmalı; dijital baskı görüntüsü "yapmacık" diye geri dönüyor.'],
    '973174379': ['Tek renk sipariş edilen üründe bile yanlış renk gönderimi 1 yıldız sebebi; renk adı ve stok kodu eşleşmeli.'],
    '468684489': ['Çok renkli sette her renk ayrı bir sipariş gibi kontrol edilmeli; tek bir yanlış renk bütün seti iadeye çeviriyor.'],
    '763220958': ['Kumaş beğenilse de ("kumaşı güzel ama") yanlış renk puanı düşürüyor. Stokta olmayan renk satıştan kaldırılmalı.'],
    '211986804': ['Toplu siparişlerde (9 şalın 3\'ü defolu) her parça tek tek kontrol edilmeli; müşteri hatayı yorumda sayıyla yazıyor.'],
    '366531659': ['Ucuz set alıcısı bile "önü şekil almıyor" diye 1 yıldız veriyor; penye kalınlığı ve ölçüleri açıkça yazılmalı.'],
}
ALINTI = {  # yerel dosyalar için (konu, metnin başı); tarayıcı ürünlerinin alıntıları sal_tarayici.json'da
    '811110897': [('Defolu / lekeli / yırtık', 'ipi cekik geldi biraz duzelttim'), ('Yıkayınca soluyor, tüyleniyor, boya veriyor', 'Daha öncede aynı ürünün farklı renklerini'),
                  ('Yanlış ürün / renk gönderildi', 'Güzel ürün, ama siparişim başka'), ('Olumlu: kaymıyor, hafif', 'severek kullanıyorum daha önce lacivertini')],
    '944739275': [('Kumaş kötü: naylon, polyester', 'Pamuklu değil ürün sert'), ('Renk görseldekinden farklı', 'Rengi asla fotoğrafta görüldüğü gibi'),
                  ('Sert, kalın, terletiyor', 'polyester kumaşı kalın biraz'), ('Olumlu: iç göstermiyor', 'Desenleri çok güzel kalitesi de öyle')],
    '968548196': [('Baskı kalitesiz, desen farklı', 'Kumaşları güzel ama baskıları cok yapmacık'), ('Renk görseldekinden farklı', 'Rengi Fotoğraftaki gibi canlı değil'),
                  ('Kumaş kötü: naylon, polyester', 'kumaşı pamuklu değil naylonlu'), ('Olumlu: şekil alıyor', 'Kızlar hiç tereddüt etmeden alın')],
    '973174379': [('Yanlış ürün / renk gönderildi', 'Ben sizden pembe istemedim'), ('Yanlış ürün / renk gönderildi', 'Kahverengi istedim bordo gönderilmiş'),
                  ('Renk görseldekinden farklı', 'yapısı güzel lakin rengi göründüğünden'), ('Olumlu: tekrar alım', 'acayip iyi kac tane aldım')],
    '468684489': [('Yanlış ürün / renk gönderildi', 'Rengi modeli farklı geldi lacivert yerine'), ('Yanlış ürün / renk gönderildi', 'yanlis renk gonerilmis'),
                  ('İnce / iç gösteriyor', 'Gerçekten çok ince ve insanın boynum'), ('Olumlu: rahat', 'beklediğimden daha iyiler Hem rahat')],
    '763220958': [('Renk görseldekinden farklı', 'ürün çok güzel istediğim gibi fakat istediğim renkler'), ('Renk görseldekinden farklı', 'gorseldeki renkler gelmedi kumasi'),
                  ('Defolu / lekeli / yırtık', 'Renklerin hepsinin tonu farklı solmuş'), ('Olumlu: kaymıyor, terletmiyor', 'yumuşacık harika kaymayan terletmeyen')],
    '211986804': [('Defolu / lekeli / yırtık', 'Çok beğenerek aldım 9 tane sipariş'), ('Yanlış ürün / renk gönderildi', '2 tane farklı model sipariş ettim'),
                  ('Kumaş kötü: naylon, polyester', 'pamuk şal yazıyor ürünün altında'), ('Olumlu: şekil alıyor', 'benim favori şalim oldu')],
    '366531659': [('İnce / iç gösteriyor', 'renkleri güzel, kumaşı çok ince'), ('Renk görseldekinden farklı', 'karamel, karamel değil turuncu'),
                  ('Defolu / lekeli / yırtık', 'iki tane şalım da defo çıktı'), ('Olumlu: yazın rahat', 'Yaz sıcaklarında en iyisi penye')],
}
ONERILER = [
    ('Setlerde her rengi tek tek kontrol et',
     'Olumsuz yorumlarda yanlış renk ya da ürün gönderimi %{yanlis}, rengin fotoğraftan farklı gelmesi %{renk} oranında; en yüksek değerler 3\'lü ve 4\'lü setlerde. Organic Scarfs setinde renk farkı şikâyeti oranı %{os_renk}. Paketlemeden önce her rengi sipariş kodlarıyla eşleştir; stokta olmayan rengi satıştan kaldır.'),
    ('Rengi gün ışığında çek, tonu doğru adlandır',
     '"Kakao renk istedim, kahverenginin hiç sevmediğim tonu geldi", "karamel değil turuncu" yorumları tonun yanlış adlandırıldığını gösteriyor. Filtresiz gün ışığında fotoğraf, yakın çekim kumaş ve tonu tarif eden bir cümle (ör. "sütlü kahveye yakın") beklentiyi doğru kurar.'),
    ('Kenarları kontrol et, iade dönen ürünü yeniden satma',
     'Büyük markaların olumsuz yorumlarında defo oranı %{defo_b}, KOBİ\'lerde %{defo_k}. Büyük marka şallarını çoğunlukla bayiler satıyor ve şikâyetler "kenarları sökük", "başkasının iadesini göndermişler" şeklinde. Her şalı katlamadan önce kenar dikişini ve ipleri kontrol eden bir KOBİ, büyük markaya karşı burada öne geçer.'),
    ('Kumaşı fotoğraftaki gibi anlat',
     'Kumaşın sert ya da kalın olması (%{sert}), naylon ve polyester çıkması (%{sentetik}) ve çok ince olması (%{ince}) şikâyetleri birlikte önemli bir pay tutuyor. Kumaş içeriğini, kalınlığı ve mevsimini (yazlık mı, dört mevsim mi) açıkça yaz; "pamuk" yazıp karışım göndermek güveni bozuyor.'),
    ('Yıkama dayanımını test et',
     'Büyük markalarda yıkamada solma, tiftiklenme ve boya bırakma şikâyeti %{yikama_b} (KOBİ\'de %{yikama_k}); Modakaşmir Neo Pamuk\'ta %18. Her renk için renk haslığı testi yap, ürünle birlikte kısa bir yıkama talimatı gönder.'),
    ('Büyük markayla aynı ligdesin: farkı hizmette yarat',
     'Şalda 1-2 yıldız payı büyük markalarda %{dusuk_b}, KOBİ\'lerde %{dusuk_k}; ürün kalitesinde açık bir fark yok. Olumlu yorumlarda renk canlılığı (%{renk_ol}), kumaş kalitesi ve kaymaması öne çıkıyor. Hediye paketi ve not gibi küçük hizmetler fark yaratıyor; ama istenen paket gönderilmezse sipariş iadeye dönüyor.'),
]

def p(v): return f'{round(v * 100):d}'

def main(out):
    B = json.load(open('sal_tarayici.json'))
    urunler, P = [], []
    for uid, (kisa, marka, seg) in DOSYALAR.items():
        if uid in TARAYICI:
            b = B[uid]; y = b['yildiz']; g = b['meta']['gorsel']; link = b['meta']['url']
            S, O, od, oo, n, alinti = b['sikayet'], b['olumlu'], b['onerilen_dusuk'], b['onerilen_ort'], b['ornek_dusuk'], b['alinti']
        else:
            d = json.load(open(f'rv_{uid}.json')); m, top, neg = d['meta'], d['top'], d['neg']
            y = [d['dist'][str(i)] for i in range(1, 6)]; g = m.get('gorsel', '') or GORSEL_EK.get(uid, ''); link = m['url'].split('?')[0].replace('/yorumlar', '')
            S = {k: round(oran(neg, v[2]), 2) for k, v in SIKAYET.items()}; O = {k: round(oran(top, v[1]), 2) for k, v in OLUMLU.items()}
            od = sum(1 for r in top if r['stars'] <= 2); oo = round(sum(r['stars'] for r in top) / len(top), 2); n = len(neg)
            alinti = []
            for konu, bas in ALINTI[uid]:
                r = next((r for r in top + neg if r['text'].startswith(bas)), None)
                assert r, (uid, bas)
                alinti.append({'konu': konu, 'yildiz': r['stars'], 'metin': r['text']})
        g = re.sub(r'^https://cdn\.dsmcdn\.com/', 'https://cdn.dsmcdn.com/mnresize/400/-/', g) if g else ''
        yaz = sum(y)
        urunler.append({'id': uid, 'kisa': kisa, 'marka': marka, 'ad': AD[uid], 'segment': seg, 'gorsel': g, 'link': link,
                        'yazili': yaz, 'yildiz': y, 'ort': round(sum((i + 1) * v for i, v in enumerate(y)) / yaz, 2),
                        'onerilen_ort': oo, 'onerilen_dusuk': od, 'ornek_dusuk': n,
                        'sikayet': {k: round(S[k], 2) for k in SIKAYET}, 'olumlu': {k: round(O[k], 2) for k in OLUMLU},
                        'dikkat': DIKKAT[uid], 'ders': DERS[uid], 'alinti': alinti})
    U = urunler
    big = [u for u in U if u['segment'] != 'KOBİ']; kobi = [u for u in U if u['segment'] == 'KOBİ']
    w = lambda L, k: sum(u['sikayet'][k] * u['ornek_dusuk'] for u in L) / sum(u['ornek_dusuk'] for u in L)
    pool = lambda L: sum(u['yildiz'][0] + u['yildiz'][1] for u in L) / sum(u['yazili'] for u in L)
    os_ = next(u for u in U if u['id'] == '763220958')
    v = {'yanlis': p(w(U, 'yanlis')), 'renk': p(w(U, 'renk')), 'os_renk': p(os_['sikayet']['renk']),
         'defo_b': p(w(big, 'defo')), 'defo_k': p(w(kobi, 'defo')), 'sert': p(w(U, 'sert')), 'sentetik': p(w(U, 'sentetik')), 'ince': p(w(U, 'ince')),
         'yikama_b': p(w(big, 'yikama')), 'yikama_k': p(w(kobi, 'yikama')),
         'dusuk_b': f"{pool(big) * 100:.1f}".replace('.', ','), 'dusuk_k': f"{pool(kobi) * 100:.1f}".replace('.', ','),
         'renk_ol': p(sum(u['olumlu']['renk'] for u in U) / len(U))}
    print('öneri rakamları', v, file=sys.stderr)
    cat = {'id': 'sal', 'ad': 'Şal', 'ust': 'Giyim', 'toplama': '2 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['şal', 'sal', 'eşarp', 'tesettür şal', 'pamuk şal', 'bambu şal', 'başörtüsü', 'örtü'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)

main(sys.argv[1])
