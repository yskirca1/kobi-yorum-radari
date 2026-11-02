"""Kedi tırmalama tahtası: kedi_tarayici.json (tarayıcıda hesaplanan özetler) -> data/kedi-tirmalama.json"""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU

AD = {
    '37656674': 'Kedi Tırmalama Tahtası, karışık renk',
    '376392025': 'Pugalo 82 cm İki Katlı Catnipli Tırmalama Tahtası, krem',
    '376388992': 'Pugalo 82 cm İki Katlı Catnipli Tırmalama Tahtası, gri',
    '133155220': 'PETiTOYS Gri Kedi Tırmalama Tahtası 42 cm',
    '113482045': 'Katlı Yavru Kedi Tırmalama Tahtası, karışık renk',
    '791934603': 'Rotipet Karton Kedi Tırmalama Koltuk, ceviz 59x30x25 cm',
    '181848325': 'Pugalo 90 cm Büyük Catnipli Tırmalama Tahtası, lacivert',
    '797262704': 'Nursoft Stepli Kedi Tırmalama Tahtası',
    '692136308': '42 cm Kedi Tırmalama Tahtası',
    '239272578': 'Lena Pet 82 cm Kedi Tırmalama Tahtası, ekru',
    '948343549': 'Pugalo Stepli Kedi Yüzlü Platform Tırmalama Tahtası',
    '897642650': 'Rotipet Karton Kedi Tırmalama, kedi desenli XSmall 43x7x21 cm',
}
DIKKAT = {
    '37656674': ['1-2 yıldız oranı %25,7: kategorinin en çok satan ama en çok şikâyet alan ürünlerinden.',
                 'İplerin birkaç kullanımda kopması ya da gevşemesi en sık şikâyet (%17).',
                 '"Karışık renk" gönderim yüzünden istediği rengi alamayanlar var (%10).'],
    '376392025': ['Olumsuz yorumların %41\'i devrilmeden: hafif taban yüzünden kedi atlayınca devriliyor.',
                  'Vida yerinin bol olması ve sallanma (%25), eksik vida ya da parça (%14) sık yazılıyor.',
                  'Kimyasal ya da yapıştırıcı kokusu şikâyeti var (%8).'],
    '376388992': ['Kurulum şikâyeti oranı %34, kategorinin en yükseği: vidalar boş dönüyor, ayaklar tablaya oturmuyor.',
                  'Devrilme oranı %32; tek taraflı tasarımda kedi en üstteyken devriliyor.',
                  'Eksik parça ya da vida %13.'],
    '133155220': ['1-2 yıldız oranı %28,7 ile en yüksek.',
                  'Çabuk yıpranma, ipin açılıp dökülmesi en sık şikâyet (%19).',
                  'Alt tablası basit ve hafif: kedi tırmalarken düşüyor (%10).'],
    '113482045': ['Göründüğünden küçük olduğu, yetişkin kediye yetmediği yazılıyor (%20).',
                  'Vida ve parça eksik gelme oranı %20, kurulum sorunu %19.',
                  'Fotoğraftaki top ve renklerin farklı geldiği yazılıyor (%15).'],
    '791934603': ['Olumsuz yorum az (35); bunların yarısı malzemeden: "tırmalama kısmı kartondan" (%49).',
                  'Kartonun kısa sürede parçalanıp evi kirlettiği yazılıyor (%26).'],
    '181848325': ['Uzun kullanımda kırılma ve ipin açılması (%24) ile kurulum ve sallanma (%22) öne çıkıyor.',
                  'Kokusu ağır bulunuyor (%8).'],
    '797262704': ['Hafif olduğu için kedi patisini uzatınca devrildiği yazılıyor (%15).',
                  'Görselden küçük geldiği ve farklı göründüğü şikâyeti var (%13).'],
    '692136308': ['Görseldeki top ya da renk farklı gelme şikâyeti en yüksek (%23).',
                  '1-2 yıldız oranı %24,3; kalitesiz malzeme (%16) ve devrilme (%16) sık.'],
    '239272578': ['Az olumsuz yorum (18) var; bunların %28\'i devrilmeden.',
                  'Kırık gelen ürün şikâyeti var.'],
    '948343549': ['Olumsuz yorum az (20); birkaç ayda sallanmaya başladığı ve altının koptuğu yazılıyor.',
                  'Birleştirme vidası eksik gönderimi ve görseldeki kedi yüzü yerine düz tabla gelmesi şikâyeti var.'],
    '897642650': ['Yalnızca 9 olumsuz yorum var; "kağıt gibi, iki tırmalamada dağıldı" diyenler var.',
                  'Küçük boyu çok kedili evlerde yetersiz kalıyor.'],
}
DERS = {
    '37656674': ['En ucuz ve en çok satan model: hacim fiyatla geliyor ama dayanıksız ip ve rastgele renk 1 yıldız oranını kategorinin en üstüne taşıyor.'],
    '376392025': ['Kategorinin en sevilen ürünü (önerilen yorumların %62\'si "kedim hemen sevdi"); daha ağır bir taban tek başına en büyük şikâyeti çözerdi.'],
    '376388992': ['Aynı ürünün farklı rengi, aynı şikâyetler: sorun renkte değil, tabanın ağırlığında ve vida kalitesinde.'],
    '133155220': ['Düşük fiyat beklentiyi düşürmüyor: kedi birkaç günde parçalıyorsa müşteri "ucuza kaçmışım" diye yazıyor.'],
    '113482045': ['"Yavru kedi için" bilgisi ilanda net değilse yetişkin kedi sahibi küçük bulup 1 yıldız veriyor.'],
    '791934603': ['Karton tırmalama 1-2 yıldız oranı en düşük ürün (%2,8): kedi seviyor, ama "karton olduğunu bilmiyordum" diyen müşteri için malzeme ilanda net yazılmalı.'],
    '181848325': ['Uzun model sağlamlığıyla övülüyor (%45) ve boyu seviliyor (%27); şikâyetler aylar sonra gelen yıpranmada.'],
    '797262704': ['Basamaklı tasarım görselde büyük duruyor; gerçek ölçüyü fotoğrafta bir referansla göstermek "ufacık geldi" yorumunu önler.'],
    '692136308': ['Aynı ürünü 18 satıcı satıyor; görseldeki top ve renk her satıcıda aynı gelmeyince şikâyet satıcıdan bağımsız ürüne yazılıyor.'],
    '239272578': ['Az şikâyet, yüksek puan; ama uzun modellerin ortak sorunu olan devrilme burada da başı çekiyor.'],
    '948343549': ['Kedi yüzlü üst tabla görselde satışı getiriyor; gönderilen ürün görselden farklıysa en çok tepkiyi o çekiyor.'],
    '897642650': ['Küçük karton tırmalama ucuz ve seviliyor; beklenti düşük olduğu için şikâyet de az.'],
}
ONERILER = [
    ('Tabanı ağırlaştır, devrilmesin',
     'Devrilme ve sallanma olumsuz yorumlarda %{devrilme} ile 1 numaralı sorun; 82-90 cm uzun modellerde %{devrilme_uzun}\'ye çıkıyor (en yüksek üründe %41). Kedi devrilen tahtadan korkup bir daha yanaşmıyor. Daha geniş ve ağır taban, ya da duvara sabitleme aparatı en net ayrışma.'),
    ('Vidayı ve kurulumu sağlama al',
     'Vidanın oturmaması, boş dönmesi ve kurulamama şikâyeti %{kurulum}, uzun modellerde %{kurulum_uzun}. Göndermeden önce bir adet kurup denemek, vida deliğine metal somun koymak ve resimli kurulum kâğıdı eklemek bu şikâyeti büyük ölçüde bitirir.'),
    ('Paketten eksik parça çıkmasın',
     'Vida ya da parça eksik gelme oranı %{eksik}; yavru kedi modelinde %20. Eksik vida yüzünden ürün kurulmadan kalıyor ve müşteri 1 yıldız veriyor. Paketleme sırasında parça kontrol listesi ve yedek vida koymak ucuz bir çözüm.'),
    ('İpi ve malzemeyi sağlam seç',
     'Çabuk dağılma ve ipin kopması %{dayaniksiz}, kalitesiz malzeme şikâyeti %{malzeme}. En ucuz modellerde 1-2 yıldız oranı %24-29\'a çıkıyor; "çamaşır ipi gibi" ve "kartondan yapılmış" yorumları sık. Sisal ip kalınlığını ve malzemeyi ilanda yazmak, kalitesizlik algısını önler.'),
    ('Görseldeki ürünü gönder, ölçüyü göster',
     'Renk ve görsel farkı %{gorsel}, küçük gelme %{kucuk}. "Karışık renk" gönderimi ve fotoğraftaki topun gelmemesi en sık örnekler. Ölçüyü bir kediyle birlikte fotoğraflamak ve rengi müşteriye seçtirmek bu şikâyetleri azaltır.'),
    ('Kedinin ilgisini çek',
     'Olumsuz yorumların %{ilgisiz}\'i "kedim kullanmadı". Kedi otu (catnip) ve oyuncak top ürünle birlikte geliyor ama yorumlarda neredeyse hiç anılmıyor; kullanım ipucu (kedi otunu sürün, kedinin dinlendiği yere koyun) eklemek bu hayal kırıklığını azaltır.'),
    ('Bu pazar tamamen KOBİ\'lerin',
     'Trendyol\'da en çok değerlendirilen tırmalama tahtalarının tamamı KOBİ ürünü; Trixie, Karlie gibi büyük markaların ürünlerinde neredeyse hiç yorum yok. Ağır tabanlı, eksiksiz ve sağlam bir ürünle kısa sürede öne çıkmak mümkün.'),
]


def p(v): return f'{round(v * 100):d}'


def main(out):
    B = json.load(open('kedi_tarayici.json'))
    U = []
    for uid, (kisa, marka, seg) in DOSYALAR.items():
        b = B[uid]; y = b['yildiz']; yaz = sum(y)
        g = re.sub(r'^https://cdn\.dsmcdn\.com/', 'https://cdn.dsmcdn.com/mnresize/400/-/', b['gorsel'])
        U.append({'id': uid, 'kisa': kisa, 'marka': marka, 'ad': AD[uid], 'segment': seg, 'gorsel': g, 'link': b['url'],
                  'yazili': yaz, 'yildiz': y, 'ort': round(sum((i + 1) * v for i, v in enumerate(y)) / yaz, 2),
                  'onerilen_ort': b['onerilen_ort'], 'onerilen_dusuk': b['onerilen_dusuk'], 'onerilen_n': b['top'], 'ornek_dusuk': b['ornek_dusuk'],
                  'sikayet': {k: round(b['sikayet'].get(k, 0), 2) for k in SIKAYET}, 'olumlu': {k: round(b['olumlu'].get(k, 0), 2) for k in OLUMLU},
                  'dikkat': DIKKAT[uid], 'ders': DERS[uid], 'alinti': b['alinti']})
    uzun = [u for u in U if u['id'] in ('376392025', '376388992', '181848325', '239272578')]
    w = lambda L, k: sum(u['sikayet'][k] * u['ornek_dusuk'] for u in L) / max(1, sum(u['ornek_dusuk'] for u in L))
    v = {k: p(w(U, k)) for k in SIKAYET}
    v.update(devrilme_uzun=p(w(uzun, 'devrilme')), kurulum_uzun=p(w(uzun, 'kurulum')))
    print('öneri rakamları', v, file=sys.stderr)
    cat = {'id': 'kedi-tirmalama', 'ad': 'Kedi tırmalama tahtası', 'ust': 'Evcil hayvan', 'toplama': '2 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['kedi tırmalama', 'tırmalama tahtası', 'kedi tırmalama tahtası', 'tırmalama', 'kedi', 'tırmalama ağacı', 'kedi oyuncağı', 'karton tırmalama'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)


main(sys.argv[1])
