"""Telefon kılıfı: kilif_tarayici.json (tarayıcıda hesaplanan özetler) -> data/telefon-kilifi.json"""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU

AD = {
    '169079728': 'Spigen Liquid Air iPhone 14/13 Kılıf, mat siyah',
    '861271764': 'Apple iPhone 16 Pro MagSafe Silikon Kılıf',
    '858914651': 'Apple iPhone 16 Pro Şeffaf MagSafe Kılıf',
    '332480005': 'Fibaks iPhone 13/14/15 Şeffaf MagSafe Kılıf',
    '796612275': 'Fibaks iPhone 13/14/15 Mat Kamera Korumalı Kılıf',
    '893485171': 'Go Aksesuar iPhone 13/14/15 Şeffaf Fiyonklu Kılıf',
    '672690858': 'Go Aksesuar iPhone 11 Kelebek Baskılı Şeffaf Kılıf',
    '320197150': 'Go Aksesuar iPhone 11 Ayıcıklı Silikon Kılıf',
    '662652817': 'Powerfox iPhone 11 MagSafe Sert Şeffaf Kılıf',
    '760659948': 'KVK Privacy iPhone 13/14/15 Lansman Kılıf, içi kadife',
    '1041951856': 'KVK Privacy iPhone 13/14/15 Leopar Desenli Silikon Kılıf',
    '312620775': 'Go Aksesuar iPhone 13/14 Şeffaf Kartlıklı Kılıf',
}
DIKKAT = {
    '169079728': ['Trendyol\'da yalnızca 26 yazılı yorumu var ve hiçbiri 1-2 yıldız değil.', 'Büyük marka kılıfı bu pazarda çok az satılıyor; yorumların çoğu kaliteden memnun.'],
    '861271764': ['19 yorumun 5\'i 1 yıldız: "Apple logosu yok, çakma gibi", farklı renk ve kirli tuş şikâyeti.', 'Ürün birden fazla satıcıdan satılıyor; orijinallik şüphesi satıcıya göre değişiyor.'],
    '858914651': ['Yalnızca 14 yazılı yorumu var, hepsi 5 yıldız.', 'Fiyatı KOBİ kılıflarının birkaç katı; alıcı kitlesi küçük.'],
    '332480005': ['Jelatin altında bile çizikli gelen ürün şikâyeti sık (%26).', 'Şeffaf kılıf birkaç hafta içinde sararıyor; MagSafe mıknatısının yerinden çıktığı da yazılıyor.', '"13/14/15 uyumlu" olduğu için iPhone 13\'te kamera kısmı büyük ve dengesiz kalıyor.'],
    '796612275': ['Olumsuzların %37\'si telefona oturmamaktan: iPhone 13\'te kamera boşluğu, ekran koruyucuyu kaldırma, eksik tuş.', 'Kenarların birkaç günde soyulduğu yazılıyor.', 'Yanlış model (13 yerine 15) gönderimi var.'],
    '893485171': ['Fiyonk ve inci süslemeler birkaç günde kararıyor, soyuluyor (%35 sararma, %20 soyulma).', 'Tuşların tam oturmadığı ve iPhone 15\'e uymadığı yazılıyor.', 'Gümüş istenip gold gelen süsleme şikâyeti var.'],
    '672690858': ['Kelebek baskısı birkaç günde siliniyor; kılıf sararıyor ve kararıyor.', '"Fotoğraftaki kadar şık durmuyor, basit" diyenler var.', '12 istenip 11 gelen yanlış model gönderimi var.'],
    '320197150': ['Kılıf iki gün ile birkaç hafta arasında kararıyor.', 'Tuşların basmadığı ya da kendi kendine bastığı yazılıyor.', 'Lekeli ya da kusurlu gelen ürün var.'],
    '662652817': ['Sert şeffaf kılıf da zamanla sararıyor (%30).', 'Çizikli gelen ürün şikâyeti sık (%23).', 'Büyük gelip telefonun içinde oynadığı yazılıyor.'],
    '760659948': ['Olumsuzların %37\'si oturmamaktan: iPhone 13\'te kamera ve ekran kenarları tam olmuyor, 14\'e küçük geliyor.', 'Bir ayda kaplamanın soyulduğu yazılıyor.', 'Yanlış renk gönderimi var.'],
    '1041951856': ['Pembe kılıf birkaç kullanımda kararıyor (%39).', 'iPhone 15 yerine 11 kılıfı gönderilmesi gibi yanlış model şikâyeti var (%11).', '13\'e büyük geldiği yazılıyor.'],
    '312620775': ['Şeffaf kılıf bir haftada sararıyor, soluyor.', 'Kartlık kısmına konan kart telefonun arkasını çiziyor.', 'Yan tuşun basmadığı yazılıyor.'],
}
DERS = {
    '169079728': ['Büyük marka kılıfı neredeyse hiç şikâyet almıyor ama çok az satıyor; pazar KOBİ\'lerin elinde.'],
    '861271764': ['Orijinal ürünün bile "logosu yok, çakma gibi" diye 1 yıldız alması, bu kategoride orijinallik güvencesinin aranan bir şey olduğunu gösteriyor.'],
    '858914651': ['Az yorumla 5 yıldız: büyük marka kılıfı memnun ediyor ama fiyat yüzünden kitlesi küçük kalıyor.'],
    '332480005': ['Önerilen yorumların yarısı satıcının hediyesine teşekkür ediyor; ama "hediye falan da yoktu, bot yorumları var" diyen de var.'],
    '796612275': ['Üç modele tek kalıp, üç modelde de "tam olmuyor" şikâyeti getiriyor. Kalıp hangi modele göre yapıldıysa açıkça yazılmalı.'],
    '893485171': ['Süsleme ilk günkü görüntüsünü korumuyorsa müşteri bunu fotoğrafla yorumuna ekliyor; dayanıksız süs ürünün kendisinden çok puan kaybettiriyor.'],
    '672690858': ['Önceki partide soyulmayan baskının yeni partide soyulması, sadık müşteriyi kaybettiriyor ("iki sene önce aldığımda soyulma olmamıştı").'],
    '320197150': ['Az olumsuz yorum (32) ve yüksek puan: tasarım seviliyor, şikâyetler kararma ve tuş uyumunda toplanıyor.'],
    '662652817': ['"Sert şeffaf kılıf sararmaz" beklentisi var; sararırsa müşteri bunu ürünün vaadine aykırı buluyor.'],
    '760659948': ['Lansman (Apple tarzı) kılıfta müşteri birebir oturma bekliyor; 13/14/15 ortak kalıp bu beklentiyi karşılamıyor.'],
    '1041951856': ['Desenli ve renkli silikonda kararma, şeffaf kılıftaki sararma kadar sık; malzeme seçimi rengin ömrünü belirliyor.'],
    '312620775': ['Ek özellik (kartlık) yeni bir şikâyet doğurabiliyor: kart telefonu çiziyorsa iç yüzey korumalı olmalı.'],
}
ONERILER = [
    ('Sararmayan malzeme kullan, dürüst yaz',
     'Sararma ve kararma olumsuz yorumlarda %{sararma} oranla 1 numaralı sorun; şeffaf ve renkli silikon kılıflar birkaç gün ile bir ay içinde rengini kaybediyor. Sararmaya dayanıklı malzeme kullan ve bunu açıkça yaz; kullanmıyorsan "zamanla sararabilir" demek 1 yıldızı önler.'),
    ('Hangi modele tam oturduğunu açıkça yaz',
     'Telefona oturmama şikâyeti %{uyum}; "13/14/15 uyumlu" diye satılan iki kılıfta %37. iPhone 13\'te kamera boşluğu, ekran koruyucuyu kaldırma ve basmayan tuş en sık örnekler. Her model için ayrı kalıp üret ya da hangi modelde boşluk kalacağını ilanda yaz.'),
    ('Göndermeden önce çizik kontrolü yap',
     'Çizik, leke ya da kusurlu gelme şikâyeti %{cizik}; şeffaf kılıflarda %23-26\'ya çıkıyor ve "jelatin altında bile çizik" yorumu sık. Paketlemeden önce ışığa tutup kontrol etmek ucuz ama etkili bir ayrışma.'),
    ('Süslemeyi ve baskıyı dayanıklı yap',
     'Baskı, taş ve kaplamanın soyulması tüm ürünlerde %{soyulma}, ama desenli ve süslemeli kılıflarda %18-20. Fiyonk, inci ve kelebek baskının birkaç günde silinmesi en çok fotoğraflı 1 yıldız getiren şikâyet.'),
    ('Bu pazar KOBİ\'lerin: güveni sen ver',
     '26 bin yazılı yorumda büyük markaların (Spigen, Apple) payı yalnızca %{buyuk_pay}. Apple\'ın kendi kılıfında bile "logo yok, çakma gibi" şikâyeti var. Malzemesini, uyumunu ve garantisini net anlatan bir KOBİ markası rakipsiz kalır.'),
    ('Hediye kapıyı açar, kaliteyi kapatmaz',
     'KOBİ\'lerin önerilen yorumlarında satıcının hediyesine (kablo koruyucu, şarj koruyucu) teşekkür oranı %{hediye_k}, bir üründe %{hediye_max}. Hediye ilk izlenimi güçlendiriyor; ama sararma ve uyum sorunu varsa 1 yıldız yine geliyor ve "bot yorum" şüphesi doğuyor.'),
]

def p(v): return f'{round(v * 100):d}'

def main(out):
    B = json.load(open('kilif_tarayici.json'))
    U = []
    for uid, (kisa, marka, seg) in DOSYALAR.items():
        b = B[uid]; y = b['yildiz']; yaz = sum(y)
        g = re.sub(r'^https://cdn\.dsmcdn\.com/', 'https://cdn.dsmcdn.com/mnresize/400/-/', b['gorsel'])
        U.append({'id': uid, 'kisa': kisa, 'marka': marka, 'ad': AD[uid], 'segment': seg, 'gorsel': g, 'link': b['url'],
                  'yazili': yaz, 'yildiz': y, 'ort': round(sum((i + 1) * v for i, v in enumerate(y)) / yaz, 2),
                  'onerilen_ort': b['onerilen_ort'], 'onerilen_dusuk': b['onerilen_dusuk'], 'onerilen_n': min(100, yaz), 'ornek_dusuk': b['ornek_dusuk'],
                  'sikayet': {k: round(b['sikayet'].get(k, 0), 2) for k in SIKAYET}, 'olumlu': {k: round(b['olumlu'].get(k, 0), 2) for k in OLUMLU},
                  'dikkat': DIKKAT[uid], 'ders': DERS[uid], 'alinti': b['alinti']})
    big = [u for u in U if u['segment'] != 'KOBİ']; kobi = [u for u in U if u['segment'] == 'KOBİ']
    w = lambda L, k: sum(u['sikayet'][k] * u['ornek_dusuk'] for u in L) / max(1, sum(u['ornek_dusuk'] for u in L))
    v = {'sararma': p(w(U, 'sararma')), 'uyum': p(w(U, 'uyum')), 'cizik': p(w(U, 'cizik')), 'soyulma': p(w(U, 'soyulma')),
         'buyuk_pay': f"{100 * sum(u['yazili'] for u in big) / sum(u['yazili'] for u in U):.1f}".replace('.', ','),
         'hediye_k': p(sum(u['olumlu']['satici_hediye'] for u in kobi) / len(kobi)), 'hediye_max': p(max(u['olumlu']['satici_hediye'] for u in kobi))}
    print('öneri rakamları', v, file=sys.stderr)
    cat = {'id': 'telefon-kilifi', 'ad': 'Telefon kılıfı', 'ust': 'Elektronik aksesuar', 'toplama': '2 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['telefon kılıfı', 'kılıf', 'iphone kılıf', 'kapak', 'telefon kapağı', 'magsafe kılıf', 'şeffaf kılıf', 'silikon kılıf'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)

main(sys.argv[1])
