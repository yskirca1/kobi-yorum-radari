"""Doğal sabun: sabun_tarayici.json (tarayıcıda hesaplanan özetler) -> data/dogal-sabun.json"""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU

AD = {
    '314594757': 'Rise and Shine Kabak Lifli Aloe Vera Sabunu 130 g',
    '435041174': 'Rise and Shine Kabak Lifli Pirinç Özlü Sabun',
    '343078393': 'El Yapımı Kabak Lifli Kojik Asitli Sabun, 2\'li set 110 g',
    '353751631': 'Agarta Doğal El Yapımı Cilt Beyazlatıcı Pirinç Sabunu 150 g',
    '323299693': 'Efsun Kabak Lifli Eşek Sütü Ballı ve Aloe Vera Sabunu, 2\'li set',
    '93489485': 'ASKA El Yapımı Çam Ardıç Katranı Kükürt Sabunu',
    '344172206': 'Tala Pirinç Sabunu, cilt aydınlatıcı 150 g',
    '344172164': 'Tala Keçi Sütlü Sabun 150 g',
    '38939260': 'Hacı Şakir Doğal Geleneksel Saf Beyaz Sabun 4x150 g, 3 paket',
    '138018415': 'Hacı Şakir Saf Doğal Sabun 4x150 g',
    '31077902': 'Dalan Antik Defneli Zeytinyağlı Sabun 6x150 g',
}
DIKKAT = {
    '314594757': ['Kabak lifinin sert gelip yüzü çizdiği ya da birkaç kullanımda döküldüğü yazılıyor (lif şikâyeti oranı %16).',
                  '"Eskisi ile arasında dünya kadar fark var": koku ve yapının değiştiğini söyleyen sadık müşteriler var (%13).',
                  'Logosuz ya da etiketsiz gelen sabun "orijinal mi?" şüphesi doğuruyor (%8); ürün 15 farklı satıcıdan satılıyor.'],
    '435041174': ['"Eskisi gibi değil" şikâyeti bu üründe en yüksek (%14): koku değişmiş, köpürmüyor.',
                  'Etkisini görmediğini yazanların oranı %13.',
                  'Paketinde marka adı olmayan ürün gönderimi orijinallik şüphesi yaratıyor (%7).'],
    '343078393': ['1-2 yıldız oranı %23,8 ile kategorinin en yükseği.',
                  'Çabuk erime, küçük ve ince gelme (%19) ile lifin az ya da sert olması (%19) başı çekiyor.',
                  'Ezik, erimiş ya da renkleri birbirine akmış gelen ürün şikâyeti var (paket %13).'],
    '353751631': ['"Beyazlatıcı" vaadine rağmen etkisini görmediğini yazanların oranı %22.',
                  'Hediye krem vaat edilip gönderilmemesi ve eksik ürün şikâyeti sık (%13).',
                  'Pirinç sabunu yerine başka sabun gönderildiği yazılıyor (%10).'],
    '323299693': ['Kokusunu kötü ya da ağır bulanların oranı %19, kategorinin en yükseği.',
                  'Sabunların küçük olduğu ve hemen eriyip bittiği yazılıyor (%10).',
                  'Yüzde sivilce yaptığını söyleyenler var.'],
    '93489485': ['En sık şikâyet paketleme (%18): sabun naylona ya da kartona sarılıp gönderiliyor, "hijyenik değil" deniyor.',
                 'Görseldeki koyu renkli sabun yerine farklı bir sabun geldiği yazılıyor (%11).',
                 'Kargonun ulaşmadığı ya da teslim edilmiş görünüp gelmediği şikâyeti var (%7).'],
    '344172206': ['Etkisini görmediğini yazanların oranı %24, cildini kuruttuğunu ya da yaktığını yazanların oranı %22.',
                  '"Bembeyaz olacağınızı sanmayın" gibi yorumlar beyazlatma vaadinin beklentiyi fazla yükselttiğini gösteriyor.',
                  'Hassas ciltte kızarıklık ve sivilce yaptığı yazılıyor.'],
    '344172164': ['Az olumsuz yorum (16) var; bunların içinde etkisizlik (%19) ve yanma, kızarma (%13) öne çıkıyor.',
                  'Kokusunu yetersiz bulanlar var: "koku falan bırakmıyor".'],
    '38939260': ['1-2 yıldız oranı yalnızca %4,8; şikâyetler ürüne değil satıcıya yönelik.',
                 'Eksik paket gönderimi (%11) ve "bambaşka ürün geldi" şikâyeti var.'],
    '138018415': ['Yalnızca 40 yazılı yorumu var ve hiçbiri 1-2 yıldız değil.',
                  'Hacı Şakir\'in bu paketi Trendyol\'da az satıyor; marka asıl satışı diğer paketlerden yapıyor.'],
    '31077902': ['Olumsuz yorum az (15), ama üçte biri yanlış ürün gönderiminden (zeytinyağlı yerine lavanta).',
                 'Paketin sabun tozuyla dolu ya da ezik geldiği yazılıyor (%27).'],
}
DERS = {
    '314594757': ['Kategorinin en çok yorum alan ürünü; önerilen yorumların %40\'ı "yıllardır kullanıyorum, stok yaptım" diyor. Bu sadık kitle formül değişikliğini hemen fark ediyor.'],
    '435041174': ['Sadık müşteri tabanı güçlü ama "eskisi gibi değil" şikâyeti büyüyor: başarılı bir formülü değiştirmek en riskli hamle.'],
    '343078393': ['En ucuz set en çok 1 yıldızı alıyor: küçük, ince ve az lifli sabun fiyat avantajını siliyor.'],
    '353751631': ['Hediye vaadi yerine getirilmezse olumlu bir jest şikâyete dönüşüyor.'],
    '323299693': ['Kokuyu sevenler (%30) de sevmeyenler de çok: güçlü koku ayrıştırıcı ama riskli; koku notası ilanda net yazılmalı.'],
    '93489485': ['Ürünü seven çok (uyuz ve egzamaya iyi geldiğini yazanlar var), ama hijyenik ambalaj olmayınca puan paketten gidiyor.'],
    '344172206': ['"Cilt beyazlatıcı" vaadi en çok tıklamayı getiriyor ama en çok "işe yaramadı" ve "yüzümü yaktı" yorumunu da getiriyor.'],
    '344172164': ['Aynı markanın pirinç sabununa göre daha az iddialı vaat, daha az şikâyet getiriyor.'],
    '38939260': ['Bilinen marka güveni yüksek: önerilen yorumların %32\'si "hep kullandığımız sabun" diyor, %31\'i fiyatı övüyor.'],
    '138018415': ['Az yorumla tam memnuniyet: büyük marka sabun şikâyet almıyor ama bu pazarda az satıyor.'],
    '31077902': ['Büyük marka ürünü sorun çıkarmıyor; puanı satıcının yanlış ve özensiz gönderimi düşürüyor.'],
}
ONERILER = [
    ('Vaadi abartma, ne beklenir açıkça yaz',
     'Etkisini görmediğini yazanların oranı %{etkisiz} ile en büyük şikâyet; "beyazlatıcı" diye satılan pirinç sabunlarında %22-24\'e çıkıyor. "Bembeyaz olacağınızı sanmayın" yorumu durumu özetliyor. Gerçekçi bir dil ve "kaç haftalık düzenli kullanımda ne beklenir" bilgisi hayal kırıklığını azaltır.'),
    ('Hassas cilt uyarısı koy',
     'Kurutma, yanma, kızarma ve sivilce şikâyeti tüm ürünlerde %{tahris}, Tala Pirinç\'te %22. Etikete "hassas ciltte önce küçük bir alanda deneyin, sonrasında nemlendirin" yazmak hem müşteriyi korur hem 1 yıldızı önler.'),
    ('Kabak lifini yumuşak ve bol yap',
     'Kabak lifli sabunlarda lif şikâyeti oranı %{lif_kabak}: lif sert gelip yüzü çiziyor, az konuyor ya da birkaç kullanımda dökülüyor. Lifi yumuşatmak ve sabuna sağlam gömmek bu ürün grubunda en net ayrışma noktası.'),
    ('Gramajı ve sertliği koru',
     'Çabuk erime, küçük ya da ince gelme şikâyeti %{erime}; en ucuz sette %19, aynı ürünün 1-2 yıldız oranı da %23,8 ile kategorinin en yükseği. Gramajı ilanda net yazmak ve sabunu iyi kürlemek ucuz görünmenin bedelini önler.'),
    ('Formülü değiştirirsen söyle',
     'Rise and Shine\'ın önerilen yorumlarının %40\'ı "yıllardır kullanıyorum" diyor; bu sadık kitle koku ve yapı değişince hemen fark ediyor ("eskisi gibi değil" oranı %13-14). Formül değiştiyse ilanda ve pakette duyurmak sadık müşteriyi kaybetmemenin yolu.'),
    ('Orijinallik ve paket güvencesi ver',
     'Çok satıcılı ürünlerde logosuz ya da etiketsiz gelen sabun "sahte mi?" şüphesi doğuruyor (Rise and Shine\'da %7-8). Naylona sarılı gönderim ise "hijyenik değil" yorumunu getiriyor (ASKA\'da paket şikâyeti %18). Logolu, kapalı ambalaj iki sorunu birden çözer.'),
    ('Büyük markalar ürünle değil gönderimle kaybediyor',
     'Hacı Şakir ve Dalan\'ın yazılı yorumlardaki payı yalnızca %{buyuk_pay}; pazar KOBİ\'lerin elinde. Büyük markaların az sayıdaki şikâyeti de ürüne değil, yanlış ürün ve özensiz paketlemeye (Dalan\'da yanlış ürün oranı %33). Doğru ürünü sağlam paketle göndermek bu pazarda kolay bir ayrışma.'),
]


def p(v): return f'{round(v * 100):d}'


def main(out):
    B = json.load(open('sabun_tarayici.json'))
    U = []
    for uid, (kisa, marka, seg) in DOSYALAR.items():
        b = B[uid]; y = b['yildiz']; yaz = sum(y)
        g = re.sub(r'^https://cdn\.dsmcdn\.com/', 'https://cdn.dsmcdn.com/mnresize/400/-/', b['gorsel'])
        U.append({'id': uid, 'kisa': kisa, 'marka': marka, 'ad': AD[uid], 'segment': seg, 'gorsel': g, 'link': b['url'],
                  'yazili': yaz, 'yildiz': y, 'ort': round(sum((i + 1) * v for i, v in enumerate(y)) / yaz, 2),
                  'onerilen_ort': b['onerilen_ort'], 'onerilen_dusuk': b['onerilen_dusuk'], 'onerilen_n': b['top'], 'ornek_dusuk': b['ornek_dusuk'],
                  'sikayet': {k: round(b['sikayet'].get(k, 0), 2) for k in SIKAYET}, 'olumlu': {k: round(b['olumlu'].get(k, 0), 2) for k in OLUMLU},
                  'dikkat': DIKKAT[uid], 'ders': DERS[uid], 'alinti': b['alinti']})
    big = [u for u in U if u['segment'] != 'KOBİ']
    kabak = [u for u in U if u['id'] in ('314594757', '435041174', '343078393', '323299693')]
    w = lambda L, k: sum(u['sikayet'][k] * u['ornek_dusuk'] for u in L) / max(1, sum(u['ornek_dusuk'] for u in L))
    v = {'etkisiz': p(w(U, 'etkisiz')), 'tahris': p(w(U, 'tahris')), 'erime': p(w(U, 'erime')), 'lif_kabak': p(w(kabak, 'lif')),
         'buyuk_pay': f"{100 * sum(u['yazili'] for u in big) / sum(u['yazili'] for u in U):.1f}".replace('.', ',')}
    print('öneri rakamları', v, file=sys.stderr)
    cat = {'id': 'dogal-sabun', 'ad': 'Doğal sabun', 'ust': 'Kozmetik', 'toplama': '2 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['doğal sabun', 'sabun', 'el yapımı sabun', 'kabak lifli sabun', 'pirinç sabunu', 'keçi sütü sabunu', 'zeytinyağlı sabun', 'katı sabun'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)


main(sys.argv[1])
