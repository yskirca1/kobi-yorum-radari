"""Kamp sandalyesi: kamp_tarayici.json (tarayıcıda hesaplanan özetler) -> data/kamp-sandalyesi.json"""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU

AD = {
    '816485347': 'Decathlon Quechua Katlanır Kamp Sandalyesi, mavi, 110 kg',
    '816491110': 'Decathlon Quechua Katlanabilir Kamp Sandalyesi XL, bej, 150 kg',
    '1047715589': 'Koçtaş Deluks Kamp Sandalyesi, ekru',
    '1117395473': 'Koçtaş 2\'li Kamp Sandalyesi, bordo',
    '129882972': 'Moniev Natura 2 Adet Katlanır Kamp Sandalyesi, bardaklıklı, siyah',
    '208518948': 'Moniev Natura 2 Adet Katlanır Kamp Sandalyesi, bardaklıklı, gri',
    '655222185': 'Moniev Litus Katlanır Şezlong ve Kamp Sandalyesi, gri',
    '70777674': 'Goocamp XL Kalın Profil Kamp Sandalyesi, mavi',
    '121658522': 'Shadow Katlanabilir Kamp Sandalyesi, taşıma çantalı, lacivert',
    '43151156': 'Hastunç Katlanır Kamp ve Piknik Sandalyesi, siyah',
    '899676379': 'Eksiksepeti 2 Adet Katlanır Kamp Sandalyesi, taşıma çantalı, mavi',
    '836348315': 'Funky Chairs Tenteli Gölgelikli Kamp Sandalyesi, haki',
}
DIKKAT = {
    '816485347': ['1-2 yıldız oranı %4,4 ile kategorinin en düşüğü; 18 olumsuz yorumda kırılma şikâyeti yok.',
                  'Olumsuz yorumların %22\'si oturuştan: sırtın dik olduğu, arkaya yatmadığı, uzun oturuşta beli ağrıttığı yazılıyor.',
                  'Eksik adet ya da kolsuz model gönderimi (%17) ve geç teslimat (%17) şikâyeti var; ürünü 7 satıcı satıyor.'],
    '816491110': ['Az olumsuz yorum (8); ikisi sırt ve bel kısmının rahatsız olduğunu yazıyor.',
                  'Kolları sünmüş, lekeli ya da kullanılmış gibi gelen ürün şikâyetleri var.'],
    '1047715589': ['Olumsuz yorumların %23\'ü yanlış ürün ya da renkten: ekru yerine yeşil, sandalye yerine masa gönderilmiş.',
                   'Eksik adet ya da parça oranı %18: iki sandalyeden biri ya da yastık gelmemiş.',
                   'Kılıfın iskelete takılmasının zor olduğu ve ilk kullanımda kırıldığı yazılıyor.'],
    '1117395473': ['Olumsuz yorumların %26\'sı eksik adetten: dört sandalye sipariş edilip üç ya da iki tane gelmiş.',
                   'Kusurlu, yırtık ya da kılıfı sökük gelme oranı da %26.',
                   'Uzun boylu ve kilolu kullanıcılar küçük ve rahatsız buluyor (%11).'],
    '129882972': ['Kategorinin en çok yorum alan ürünü (2.423 yazılı yorum); 1-2 yıldız oranı %8,6.',
                  'Olumsuz yorumların %27\'si kısa sürede kırılma ve yamulmadan; 55-70 kg kullanıcıların sandalyesinin çöktüğü yazılıyor.',
                  'Kusurlu gelme oranı %25: ayağı eğri, kol vidası kırık, kumaşı yırtık.',
                  'Bardaklık ve kol plastiklerinin dandik olduğu yazılıyor (%14); market sandalyesiyle aynı kalitede bulunuyor.'],
    '208518948': ['Aynı modelin siyahına göre 1-2 yıldız oranı daha yüksek (%11,4; siyahta %8,6).',
                  'Kırılma ve yamulma oranı %32; kumaşın ya da dikişin ilk kullanımlarda yırtılması %20 (siyahta %4).',
                  'Paketleme şikâyeti %14: naylon poşet içinde, demiri yamuk gelen sandalyeler.'],
    '655222185': ['Kırılma oranı %38 ile kategorinin en yükseği: kol dayamaları birkaç kullanımda eğilip kırılıyor.',
                  'Oturur konumdayken aniden açılıp kullanıcıyı düşürdüğü yazılıyor (%15); yaşlılar için tehlikeli bulunuyor.',
                  'Oturup kalkmanın zor olduğu, demir bağlantıların bacağı kestiği yazılıyor.'],
    '70777674': ['Olumsuz yorumların %26\'sı görseldekinden farklı ürün gelmesinden: XL kalın profil yerine ince ya da normal boy sandalye.',
                 'Ürünü 17 farklı satıcı satıyor; bir yorumda aynı ürünün başka satıcıdan beğenilerek alındığı, bu satıcıdan farklı renk geldiği yazılıyor.',
                 'Kumaşın demirden ayrılması ve birkaç ayda dağılma (%15) şikâyeti var.'],
    '121658522': ['Olumsuz yorumların %34\'ü birkaç kullanımda yamulma ve kırılmadan; 56-72 kg kullanıcılar yazıyor.',
                  'Yırtık, kirli ya da kullanılmış gibi gelme oranı %28; kutuya konmadan gönderildiği yazılıyor.',
                  'Kumaşın kolay yırtılması %14.'],
    '43151156': ['Olumsuz yorumların %31\'i boyuttan: "çocuk sandalyesi gibi", yetişkine küçük ve rahatsız.',
                 'Boyası soyulmuş, ezik ya da defolu gelme oranı %25.',
                 'Bağlantı yerlerinden çatlama ve yamulma yazılıyor (%13).'],
    '899676379': ['1-2 yıldız oranı %23,0 ile kategorinin en yükseği.',
                  'Olumsuz yorumların %37\'si ilk kullanımlarda kırılmadan: plastik bağlantılar ve vidalar ayrılıyor.',
                  'Yanlış renk gelme oranı %30: mavi yerine lacivert ya da yeşil, sandalye ve kılıf farklı renk.'],
    '836348315': ['Az olumsuz yorum (12); yarısı kusurlu ürün gelmesinden: tentede delik, kopuk ip, kullanılmış gibi görünen ayaklar.',
                  'Tente kumaşının ve omuz bantlarının ince olduğu, kısa sürede koptuğu yazılıyor.',
                  'Ağır olduğu için her gün sahile taşımanın zor olduğu yazılıyor.'],
}
DERS = {
    '816485347': ['Büyük marka kamp sandalyesinde şikâyet ürünün dayanıklılığına değil teslimata ve oturma açısına gidiyor; önerilen yorumların %64\'ü sağlamlığı övüyor.'],
    '816491110': ['150 kg taşıyan XL modelde kırılma şikâyeti yok; önerilen yorumların %39\'u rahatlığı övüyor (kategorinin en yükseği).'],
    '1047715589': ['Büyük perakende markasında da 1-2 yıldızların önemli kısmı sipariş hazırlamadan (yanlış renk, eksik adet); ürünün kendisi önerilen yorumların %45\'inde sağlam bulunuyor.'],
    '1117395473': ['Çoklu adetle sipariş edilen sandalyede eksik adet olumsuzların %26\'sı; adet ve renk kontrolü bu şikâyetin doğrudan karşılığı.'],
    '129882972': ['Yan bardaklık ve sehpa satışı getiren detay (önerilen yorumların %11\'i övüyor); aynı plastik parça olumsuzlarda kırık ya da sallantılı diye anılıyor.'],
    '208518948': ['Aynı modelin renkleri ayrı ilanda ayrı sonuç veriyor; gri modelde kumaş ve dikiş şikâyeti siyahın 5 katı.'],
    '655222185': ['Sandalye ve şezlong bir arada ilgi çekiyor; mekanizma kilitlenmezse şikâyet konforu değil güvenliği konu alıyor.'],
    '70777674': ['Önerilen yorumların %37\'si rahatlığı övüyor; 1-2 yıldızlı yorumlarda ise en sık konu ilandakinden ucuz bir modelin gönderilmesi. Çok satıcılı ilanda gönderilen ürünün aynı olması puanı doğrudan etkiliyor.'],
    '121658522': ['Ucuz katlanır sandalyede alıcı ürünü market sandalyesiyle kıyaslıyor; önerilen yorumların %17\'si fiyatı övüyor, ama olumsuzların üçte biri birkaç kullanımda kırılmadan.'],
    '43151156': ['Küçük boyut hem övülüyor hem şikâyet ediliyor: dar mutfak, balkon ve namaz için alanlar seviyor (önerilen yorumların %10\'u cami, namaz ya da umreden söz ediyor), kamp sandalyesi bekleyenler küçük buluyor. Ölçüyü ilanda net yazmak beklentiyi doğru kurar.'],
    '899676379': ['Renk seçenekli çoklu sette yanlış renk olumsuzların yaklaşık üçte biri; "sax mavi" gibi tonların fotoğrafta da doğru görünmesi gerekiyor.'],
    '836348315': ['Tenteli, üst segment sandalyede 1-2 yıldız oranı %6,3 ile KOBİ\'ler arasında en düşük; şikâyet kalite kontrol ve kumaş inceliğinde toplanıyor.'],
}
ONERILER = [
    ('Dayanıklılığı kanıtla: taşıma kapasitesini yaz',
     'KOBİ ürünlerinde kısa sürede kırılma ve yamulma şikâyetinin oranı %{kirilma_kobi}, büyük markalarda %{kirilma_buyuk}. Kırılan sandalye yorumlarında kullanıcılar sık sık 55-90 kg olduğunu yazıyor. Decathlon\'un yaptığı gibi taşıma kapasitesini (110 kg, 150 kg), profil kalınlığını ve kumaş cinsini ilanda açıkça yazmak ve buna uygun malzeme kullanmak en büyük şikâyetin karşılığı.'),
    ('Kalite kontrol: kusurlu gönderme',
     'Kırık, yamuk, yırtık, lekeli ya da kullanılmış gibi gelen ürün şikâyetinin oranı %{hasarli} (KOBİ %{hasarli_kobi}, büyük marka %{hasarli_buyuk}). Naylon poşetle gönderilen sandalyeler kargoda eziliyor. Göndermeden önce açıp kontrol etmek ve kutuyla göndermek bu şikâyeti doğrudan azaltır.'),
    ('Plastik parçalar zayıf halka',
     'KOBİ sandalyelerinde bardaklık ve kol plastiklerinin kırıldığı şikâyetinin oranı %{bardaklik_kobi}, büyük markalarda %{bardaklik_buyuk}. Yan bardaklık müşterinin sevdiği bir detay (Moniev Natura\'nın önerilen yorumlarının %11\'i övüyor); bu parçanın sağlam olması ürünün tamamının sağlam algılanmasını sağlar.'),
    ('Siparişi doğru hazırla: renk ve adet',
     'Yanlış ürün ya da renk şikâyetinin oranı %{yanlis}, eksik adet ya da parça %{eksik}. Büyük markalarda eksik adet %{eksik_buyuk} (Koçtaş 2\'li %26), Eksiksepeti setinde yanlış renk %30. Çoklu adet ve renk seçenekli siparişlerde paketlemeden önce son kontrol, müşterinin "aynı renk gelmedi" şikâyetini önler.'),
    ('Market sandalyesiyle kıyaslanıyorsun',
     'Fiyatına değmediği ya da "markette daha ucuzu var" şikâyetinin oranı %{fiyat}. Alıcılar ürünü BİM, A101 ve Migros\'taki katlanır sandalyelerle karşılaştırıyor. Fiyat farkını haklı çıkaran özellik (kalın profil, taşıma kapasitesi, kilitli mekanizma, sağlam bardaklık) ilanda görünür olmalı.'),
]


def p(v): return f'{round(v * 100):d}'


def main(out):
    B = json.load(open('kamp_tarayici.json'))
    U = []
    for uid, (kisa, marka, seg) in DOSYALAR.items():
        b = B[uid]; y = b['yildiz']; yaz = sum(y)
        g = re.sub(r'^https://cdn\.dsmcdn\.com/', 'https://cdn.dsmcdn.com/mnresize/400/-/', b['gorsel'])
        U.append({'id': uid, 'kisa': kisa, 'marka': marka, 'ad': AD[uid], 'segment': seg, 'gorsel': g, 'link': b['url'],
                  'yazili': yaz, 'yildiz': y, 'ort': round(sum((i + 1) * v for i, v in enumerate(y)) / yaz, 2),
                  'onerilen_ort': b['onerilen_ort'], 'onerilen_dusuk': b['onerilen_dusuk'], 'onerilen_n': b['top'], 'ornek_dusuk': b['ornek_dusuk'],
                  'sikayet': {k: round(b['sikayet'].get(k, 0), 2) for k in SIKAYET}, 'olumlu': {k: round(b['olumlu'].get(k, 0), 2) for k in OLUMLU},
                  'dikkat': DIKKAT[uid], 'ders': DERS[uid], 'alinti': b['alinti']})
    big = [u for u in U if u['segment'] != 'KOBİ']; kobi = [u for u in U if u['segment'] == 'KOBİ']
    w = lambda L, k: sum(u['sikayet'][k] * u['ornek_dusuk'] for u in L) / max(1, sum(u['ornek_dusuk'] for u in L))
    v = {k: p(w(U, k)) for k in SIKAYET}
    for k in SIKAYET:
        v[k + '_kobi'] = p(w(kobi, k)); v[k + '_buyuk'] = p(w(big, k))
    print('öneri rakamları', {k: v[k] for k in v if k.split('_')[0] in ('kirilma', 'hasarli', 'bardaklik', 'yanlis', 'eksik', 'fiyat')}, file=sys.stderr)
    cat = {'id': 'kamp-sandalyesi', 'ad': 'Kamp sandalyesi', 'ust': 'Outdoor', 'toplama': '12 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['kamp sandalyesi', 'katlanır sandalye', 'kamp', 'piknik sandalyesi', 'plaj sandalyesi', 'kamp koltuğu', 'katlanır şezlong', 'rejisör sandalye'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)


main(sys.argv[1])
