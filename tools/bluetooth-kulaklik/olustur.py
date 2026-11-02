"""Bluetooth kulaklık ham yorum dosyalarından data/bluetooth-kulaklik.json üretir (termos.json ile aynı yapı)."""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU, oran, tl

AD = {
    '728117603': 'Xiaomi Redmi Buds 4 Lite Kablosuz Kulak İçi Kulaklık, siyah',
    '855229283': 'Xiaomi Redmi Buds 6 Play Kablosuz Kulak İçi Kulaklık, beyaz',
    '855229295': 'Xiaomi Redmi Buds 6 Play Kablosuz Kulak İçi Kulaklık, siyah',
    '761318970': 'Huawei FreeBuds SE 2 Kablosuz Kulak İçi Kulaklık, beyaz',
    '143889066': 'Favors Dots E6s Bluetooth Kulaklık',
    '314585747': 'Favors Pro Kablosuz Şarjlı Bluetooth Kulaklık, kılıf hediyeli',
    '233129679': 'Abbruch Pro 5 Dokunmatik Bluetooth Kulaklık',
    '661738189': 'Barbanti Air 2 Kablosuz Bluetooth Kulaklık, kılıf hediyeli',
    '672471753': 'Barbanti Pro Kablosuz Bluetooth Kulaklık, kılıf hediyeli',
    '218495477': 'Teknoloji Gelsin F9 Pro Powerbankli Bluetooth Kulaklık',
    '666158167': 'Trktech Pro 5 Plus Kablosuz Bluetooth Kulaklık',
    '819066262': 'Tarçın Air Pro 2 ANC Bluetooth Kulaklık',
}
# Yorum sayfasında görseli bulunamayan ürün: ürün sayfasının og:image değeri elle alındı
GORSEL_EK = {'728117603': 'https://cdn.dsmcdn.com/ty988/product/media/images/jpim-outputs/assets/product/media/images/20230824/17/407044668/957480542/2/2_org_zoom.jpg'}
DIKKAT = {
    '728117603': ['Ses seviyesi düşük bulunuyor; dış sesler rahatça duyuluyor ve müzik bastırılıyor.',
                  'Kulak içi parça büyük: küçük kulaktan düştüğü, oturmadığı yazılıyor.',
                  'Dokunmatiğin geç algıladığı ve görüşmede sesin karşıya iyi gitmediği söyleniyor.'],
    '855229283': ['Kutudan şarj kablosu çıkmadığını yazan çok yorum var; olumsuzların yaklaşık beşte biri bu.',
                  'Ses yükseğe açılınca dışarı veriyor; "gürültü engelleme hikâye" yorumu var.',
                  'Birkaç ay ile bir yıl içinde tek kulaklığın bozulduğu yazılıyor.'],
    '855229295': ['"Redmi diye aldım" diyenler ses seviyesini ve kalitesini zayıf buluyor; boğuk ses şikâyeti var.',
                  'Birkaç ay içinde bağlantı kopması ve tek tarafın susması sık.',
                  'Kutudan şarj kablosu çıkmadığı yazılıyor; görüşmede ses karşıya boğuk gidiyor.'],
    '761318970': ['Telefon görüşmesinde karşı tarafın duymadığı, dış sesleri ilettiği yazılıyor.',
                  'Kulağı acıttığı, uyuşturduğu ve kulaktan düştüğü söyleniyor.',
                  'Arızada garanti ve iade başvurusunun reddedildiğini yazanlar var.'],
    '143889066': ['En sık şikâyet şarj, kategorideki en yüksek oranla: kutu kendi kendine boşalıyor, gösterge yanlış yüzde gösteriyor.',
                  'Bir iki ay içinde bozulma yaygın; aynı ürünü tekrar alıp yine bozuk çıkan var.',
                  'Görüşmede ses kötü ve cızırtı yapıyor; şarj kutusu dandik bulunuyor.'],
    '314585747': ['Bir kısmı 10 dakika sonra bağlantının kendiliğinden kesildiğini yazıyor.',
                  'Tekrar alanlar ikinci aldıklarının sesinin daha kötü, boğuk olduğunu söylüyor.',
                  'Birkaç ay içinde bozulma ve tek taraftan ses gelmemesi sık.'],
    '233129679': ['Mağaza Favors; ilk günlerde şarj almayan ya da hiç bağlanmayan ürün gelebiliyor.',
                  'Tek kulaklığın çalışmadığı, ışığın yanmadığı yazılıyor.',
                  '1-2 yıldızlı yorumların yaklaşık üçte birinin metni aslında olumlu; puan ile yorum uyuşmuyor.'],
    '661738189': ['Kısa sürede bozulma kategorinin en yüksek oranında: olumsuzların %43\'ü bundan.',
                  'Telefon biraz uzaklaşınca ya da hareket edince bağlantı kopuyor.',
                  'Şarj kutusu şarj olmuyor; tek kulaklığın sustuğu yazılıyor.'],
    '672471753': ['Olumsuzların yaklaşık %40\'ı kısa sürede bozulmadan söz ediyor; "1 ay kullandım çöp oldu" yorumu sık.',
                  'Şarj almayan ve tek tarafı çalışmayan ürün; kutuda kulaklığın biri eksik gelen sipariş var.',
                  'Yıllardır alanlar bu partinin öncekilerden kötü olduğunu yazıyor.'],
    '218495477': ['Üç ile altı ay arasında bozulduğunu yazanlar var.',
                  'Şarj bir iki saatte bitiyor; şarj göstergesinin doğru çalışmadığı söyleniyor.',
                  'İlanda yazan yedek uçlar ve kılavuz kutudan çıkmayabiliyor; video izlerken gecikme var.'],
    '666158167': ['Bir ile beş ay arasında tek taraftan ses azalıyor ya da tamamen kesiliyor.',
                  'Hafif bir düşüşte kırıldığı yazılıyor.',
                  'İade talebinin kabul edilmediğini ve paranın geri yatmadığını söyleyenler var.'],
    '819066262': ['Şarj bir saat bile dayanmıyor; bağlantı sürekli kopuyor.',
                  'Olumsuz yorumların %10\'u satıcının hediye karşılığı güzel yorum yazdırdığını söylüyor.',
                  'Dokunmatik kendi kendine durduruyor; ANC özelliğinin düzgün çalışmadığı yazılıyor.'],
}
DERS = {
    '728117603': ['Marka güveni ses beklentisini yükseltiyor; "Xiaomi diye aldım" diyen alıcı düşük sesi affetmiyor.'],
    '855229283': ['Kutudan beklenen bir parça çıkmayınca ürün iyi olsa da 1 yıldız geliyor. Kablo yoksa ilanda açıkça yazılmalı.'],
    '855229295': ['Aynı modelin iki rengi benzer şikâyet alıyor: sorun renkte değil, ses ve bağlantı tasarımında.'],
    '761318970': ['Kategorinin en düşük 1-2 yıldız payı (%7). Şikâyetler arızadan çok konfor ve görüşme kalitesinde: sağlamlık kazanılmış, ergonomi kaybediliyor.'],
    '143889066': ['Bu fiyat bandında en zayıf halka şarj kutusu ve göstergesi; burada güvenilir bir ürün hemen ayrışır.'],
    '314585747': ['Önerilen yorumların üçte biri kılıf hediyesine teşekkür ediyor. Tekrar alan müşteri ise kaliteyi önceki partiyle kıyaslıyor; ses düşerse sadık müşteri 1 yıldıza dönüyor.'],
    '233129679': ['Puan tek başına yanıltıcı: 1-2 yıldızlı yorumların önemli kısmı "güzel ürün" diyor. Metni okumadan karar verilmemeli.'],
    '661738189': ['Önerilen yorumların yarısından fazlası hediyeye teşekkür ediyor, olumsuzların %43\'ü kısa sürede bozulmadan. Hediye ilk izlenimi kurtarıyor, ürün ömrünü kurtarmıyor.'],
    '672471753': ['Kategorinin en çok yorum alan ürünü (25 bin). Sadık müşteri "bu sefer hemen bozuldu" diyor; parti kalitesindeki düşüş birikmiş güveni hızla eritiyor.'],
    '218495477': ['İlanda yazan aksesuar kutudan çıkmayınca müşteri ürünün geri kalanına da güvenmiyor.'],
    '666158167': ['"Önerilen" ilk 100 yorumda 7 tane 1-2 yıldız var, kategorinin en yüksek değeri: arıza şikâyetleri öne çıkan sıralamaya bile sızıyor.'],
    '819066262': ['KOBİ\'ler içinde en düşük 1-2 yıldız payı (%12). Ama olumsuzların %10\'u yorumların hediyeyle yönlendirildiğini söylüyor; düşük oranın bir kısmı buradan geliyor olabilir.'],
}
ALINTI = {
    '728117603': [('Ses az, boğuk, cızırtılı', 'sesi çok kısık dışardaki'), ('Kulağa oturmuyor, acıtıyor', 'şarkı dinlerken kulaklarımı'),
                  ('Kulağa oturmuyor, acıtıyor', 'Ses kalitesi iyi ama aşırı büyük'), ('Olumlu: görüşme', 'ürün çok güzel ses kalitesi aşırı iyi aramalarda')],
    '855229283': [('Eksik parça / kablo yok', 'Şarj aleti koymamak nasıl'), ('Ses az, boğuk, cızırtılı', "ses %50'den sonra dışarı"),
                  ('Kısa sürede bozuldu', 'max 1 ay sonra 1 kulaklık'), ('Olumlu: uyumluluk', 'İPhone 11 imde kullanıyorum')],
    '855229295': [('Ses az, boğuk, cızırtılı', 'ürün redmi marka olduğu için aldım'), ('Bağlantı kopuyor', 'Alalı 1 ay oldu ses kesiliyor'),
                  ('Yönlendirilmiş yorum şüphesi', 'Sırf yorumum üst sıralar'), ('Olumlu: şarj', 'FP bir ürün tavsiye ederim')],
    '761318970': [('Mikrofon / telefon görüşmesi', 'Ürünü benim gibi ortalama bir konuşma'), ('Kulağa oturmuyor, acıtıyor', 'Kulağı acıtıyor ve ses kalitesi'),
                  ('İade ve garanti sorunu', 'kutudan çıktığı anda dokunmatiği bozuk'), ('Olumlu: hediye', 'Kız kardeşime hediye aldım')],
    '143889066': [('Şarj çabuk bitiyor', 'doğru düzgün şarj olmuyor saatlerce'), ('Kısa sürede bozuldu', 'gerçekten berbat bir ürün 1 ay bile'),
                  ('Ses az, boğuk, cızırtılı', 'Şarjı hemen bitiyo. Ses kalitesi okey'), ('Olumlu: ses', 'Cok beğendim teşekkür ederim sesinde')],
    '314585747': [('Yönlendirilmiş yorum şüphesi', 'yorumum üste gözüksün diye beş yıldız'), ('Ses az, boğuk, cızırtılı', 'ses kalitesi berrbatt geçen sene'),
                  ('Bağlantı kopuyor', 'içki kotu gerçekten verdıgım'), ('Olumlu: orijinaline benzetme', 'Tek kelime bayıldım bu zamana kadar')],
    '233129679': [('Şarj olmuyor / şarj almıyor', 'bir hafta kulanmadım bile şarj almıyor'), ('Şarj olmuyor / şarj almıyor', 'Çok minik ve çok güzel fakat bana'),
                  ('Şarj çabuk bitiyor', 'ses kalitesi çok düşük ve şarjı çok çabuk'), ('Olumlu: uzun kullanım', 'kendime daha önceden almıştım hâlâ')],
    '661738189': [('Kısa sürede bozuldu', 'Mayıs ayında aldım çok az'), ('Bağlantı kopuyor', 'müzik dinlerken bi anda bağlantı koptu'),
                  ('Şarj olmuyor / şarj almıyor', 'Kutusu şarj olmuyor.'), ('Olumlu: satıcının hediyesi', 'Bir tane almıştım çok memnunum bir tane')],
    '672471753': [('Kısa sürede bozuldu', 'ürün elimize geldi 1 ay kullandım'), ('Tek taraf çalışmıyor', 'Bana gönderilen üründe airpodsun teki'),
                  ('Şarj olmuyor / şarj almıyor', 'kesinlikle çok kötü şarj olmuyor'), ('Olumlu: satıcının hediyesi', 'Satıcıdan da üründen de çok memnun')],
    '218495477': [('Kısa sürede bozuldu', 'ürünü ilk kullanmaya başladığımda hiçbir'), ('Şarj çabuk bitiyor', 'Fiyat performans ürünü ama şarjı 1 2'),
                  ('Eksik parça / kablo yok', 'üründen 2 tane almıştık.Bahsedilen yedek'), ('Olumlu: hediye', 'Eşime hediye olarak aldım çok beğendi çok kullanışlı')],
    '666158167': [('Tek taraf çalışmıyor', 'Üç ay olmadı ses azalmaya başladı'), ('Kısa sürede bozuldu', 'Daha alalı bir ay oldu sağ taraf'),
                  ('Kısa sürede bozuldu', 'Güncelliyorum bir defa yere hafifce'), ('Olumlu: fiyat-kalite', 'sorunusuz elime ulaştı paketlenmesi')],
    '819066262': [('Yönlendirilmiş yorum şüphesi', 'Satıcı size hediye verecem ve kurulumunu'), ('Şarj çabuk bitiyor', 'çok kötü almayın şarjı 10 dk'),
                  ('Bağlantı kopuyor', 'Durmadan bağlantı sorunu yaşıyorum'), ('Olumlu: ses', 'Çok beğenerek aldığım ürün ses kalitesi')],
}
ONERILER = [
    ('Dayanıklılığı kanıtla, değişim garantisi ver',
     'KOBİ ürünlerinde arıza (kısa sürede bozulma, tek tarafın susması, şarj almama) olumsuz yorumlarda %{ariza_k} oranında; büyük markalarda %{ariza_b}. En sık cümle "1 ay bile olmadı bozuldu". Göndermeden önce her kulaklığı test et, 6-12 aylık değişim sözü ver: büyük markaya karşı en güçlü koz bu.'),
    ('Şarj iddiasını gerçekçi yaz',
     'Şarj sorunları (çabuk bitme, şarj almama) KOBİ\'lerde %{sarj_k}, büyük markalarda %{sarj_b}. Kutulu ve kutusuz gerçek kullanım süresini test edip yaz; şarj göstergesi doğru yüzdeyi göstermiyorsa müşteri bunu hemen fark ediyor.'),
    ('Büyük markanın açığından gir: ses ve oturma',
     'Xiaomi ve Huawei\'nin olumsuz yorumlarında "ses az, boğuk, dışarı veriyor" oranı %{ses_b} (KOBİ\'de %{ses_k}), "kulağa oturmuyor, acıtıyor" %{kulak_b} (KOBİ\'de %{kulak_k}). Yüksek ses seviyesi, farklı boy silikon uçlar ve görüşmede net mikrofonu öne çıkaran bir KOBİ ürünü burada rakipsiz kalır.'),
    ('Kutuyu eksiksiz gönder',
     'Büyük markaların olumsuz yorumlarında "kutudan kablo ya da parça çıkmadı" oranı %{eksik_b}. İlanda yazan her aksesuar (kablo, yedek uç, kılavuz) kutuda olmalı; yoksa ilanda açıkça yazılmalı.'),
    ('Puanı hediyeyle değil, ürünle topla',
     'KOBİ\'lerin önerilen yorumlarında satıcının hediyesine (kılıf, kahve) teşekkür oranı %{hediye_k}, bir üründe %{hediye_max}; büyük markalarda yok denecek kadar az. Bazı olumsuz yorumlar "hediye için güzel yorum yazdırıyorlar" diyor. Hediye ilk puanı yükseltiyor ama arıza gelince 1 yıldıza dönüyor ve güveni zedeliyor.'),
    ('Bağlantıyı test et, uyumluluğu net yaz',
     'Bağlantı kopması iki grupta da olumsuz yorumlarda yaklaşık %{baglanti} oranında geçiyor. iPhone, Android ve bilgisayarla eşleştirmeyi kısa bir videoyla göster; menzili ve desteklenen cihazları açıkça yaz.'),
]

def p(v): return f'{round(v * 100):d}'

def main(out):
    urunler, P = [], []
    for uid, (kisa, marka, seg) in DOSYALAR.items():
        d = json.load(open(f'rv_{uid}.json'))
        m, top, neg = d['meta'], d['top'], d['neg']
        y = [d['dist'][str(i)] for i in range(1, 6)]
        yaz = sum(y)
        g = m.get('gorsel', '') or GORSEL_EK.get(uid, '')
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
    big = [x for x in P if x[0] != 'KOBİ']; kobi = [x for x in P if x[0] == 'KOBİ']
    negs = lambda G: [r for _, n, _ in G for r in n]
    union = lambda L, ks: sum(1 for r in L if any(re.search(SIKAYET[k][2], tl(r['text'])) for k in ks)) / len(L)
    top_ort = lambda G, k: sum(oran(t, OLUMLU[k][1]) for _, _, t in G) / len(G)
    v = {'ariza_k': p(union(negs(kobi), ['bozulma', 'tek', 'sarj'])), 'ariza_b': p(union(negs(big), ['bozulma', 'tek', 'sarj'])),
         'sarj_k': p(union(negs(kobi), ['pil', 'sarj'])), 'sarj_b': p(union(negs(big), ['pil', 'sarj'])),
         'ses_b': p(oran(negs(big), SIKAYET['ses'][2])), 'ses_k': p(oran(negs(kobi), SIKAYET['ses'][2])),
         'kulak_b': p(oran(negs(big), SIKAYET['kulak'][2])), 'kulak_k': p(oran(negs(kobi), SIKAYET['kulak'][2])),
         'eksik_b': p(oran(negs(big), SIKAYET['eksik'][2])),
         'hediye_k': p(top_ort(kobi, 'satici_hediye')), 'hediye_max': p(max(oran(t, OLUMLU['satici_hediye'][1]) for _, _, t in kobi)),
         'baglanti': p(oran(negs(P), SIKAYET['baglanti'][2]))}
    print('öneri rakamları', v, file=sys.stderr)
    cat = {
        'id': 'bluetooth-kulaklik', 'ad': 'Bluetooth kulaklık', 'ust': 'Elektronik aksesuar',
        'esanlam': ['bluetooth kulaklık', 'kablosuz kulaklık', 'kulaklık', 'tws', 'kulak içi kulaklık', 'airpods', 'earbuds', 'bluetooth'],
        'toplama': '2 Kasım 2026', 'kaynak': 'Trendyol',
        'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
        'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
        'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER],
        'urunler': urunler,
    }
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)

main(sys.argv[1])
