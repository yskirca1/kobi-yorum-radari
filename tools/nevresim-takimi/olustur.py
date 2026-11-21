"""Nevresim takımı: nevresim_tarayici.json (tarayıcıda hesaplanan özetler) -> data/nevresim-takimi.json
Ham yorumlar bu klasörde yok; notlardaki her rakam nevresim_tarayici.json içindeki oranlardan, yıldız sayılarından,
satıcı sayılarından ve alıntılardan geliyor. Ürün adları Trendyol adreslerindeki ürün adından alındı.
Kullanım (bu klasörde): python olustur.py ../../data/nevresim-takimi.json"""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU

AD = {
    '764006134': 'Karaca Home Loretta %100 Pamuk Çift Kişilik Nevresim Takımı, sarı',
    '35128537': 'Karaca Home Neos %100 Pamuk Çift Kişilik Nevresim Takımı, mavi',
    '746220566': 'Özdilek Floraison Çift Kişilik Nevresim Takımı, somon',
    '934098058': 'Bella Maison Lauren Pamuklu Çift Kişilik Nevresim Seti, yeşil, 200x220 cm',
    '467443838': 'conzaliza Lastikli Çarşaflı Çift Kişilik Nevresim Takımı, antrasit siyah, pamuklu tam takım',
    '655477600': 'conzaliza Lastikli Çarşaflı Çift Kişilik Nevresim Takımı, mürdüm antrasit',
    '69768503': 'İQON Lastikli Çarşaflı Çift Kişilik Nevresim Takımı, gri-siyah',
    '271943142': 'İQON Lastikli Çarşaflı Çift Kişilik Nevresim Takımı, bordo-gri',
    '182714625': 'MyStory Home Lastikli Çarşaflı Çift Kişilik Nevresim Takımı, Viola',
    '635703472': 'Rimo Home Çift Kişilik Çift Taraflı Nevresim Takımı',
    '798612173': 'Sarah Anderson Malia Çift Kişilik Nevresim Takımı, multicolor',
    '38976172': 'Berolige Sunday %100 Pamuklu Çift Kişilik Yıkamalı İplik Boya Çizgili Nevresim Takımı, kahverengi',
}
DIKKAT = {
    '764006134': ['Olumsuz yorumların %51\'i kumaşın ince olduğunu yazıyor; kategorinin en yüksek oranı. Bir yorumda kumaşın "diğer taraf gözüküyor" denecek kadar ince olduğu söyleniyor.',
                  'Adında "%100 pamuk" geçmesine rağmen olumsuzların %10\'u kumaşın pamuklu olmadığını, sentetik olduğunu ya da terlettiğini yazıyor.',
                  'Defolu gelme %10, eksik parça %7. İlanı 14 satıcı satıyor.'],
    '35128537': ['Olumsuz yorumların %19\'u rengin görseldekinden farklı geldiğini yazıyor; mavi takım için "boz sarı göndermişler" diyen yorum var.',
                 'İnce kumaş %14, kalitesiz kumaş %12, defo %11; adında "%100 pamuk" geçmesine rağmen naylon ya da sentetik şikâyeti %10.',
                 'Markaya yakışmadığını yazanlar %8, eksik parça %8. İlanı 19 satıcı satıyor.'],
    '746220566': ['Olumsuz yorumların %30\'u markaya yakışmadığını ya da başka markayla geldiğini yazıyor (kategorinin en yüksek oranı); bir yorumda "Özdilek diye aldık Nev adıyla geldi" deniyor. İlanı 20 satıcı satıyor, kategoride en fazla.',
                  'Naylon ya da polyester şikâyeti %28; bir yorumcu kumaşın %60 pamuk %40 polyester çıktığını ve bunun özelliklerde yazmadığını söylüyor.',
                  'Yanlış ürün ya da beden %9 (kategoride en yüksek): çift kişilik yerine tek kişilik gönderildiği yazılıyor. Kalitesiz kumaş %17.'],
    '934098058': ['1-2 yıldız payı %19,5 ile büyük markalar arasında en yüksek; diğer üç büyük marka ürününde %7,3-10,0.',
                  'Olumsuz yorumların %33\'ü kumaşın pamuklu olmadığını, naylon gibi olduğunu yazıyor; ince kumaş %23, kalitesiz kumaş %19.',
                  'Eksik parça %10 ile kategorinin en yükseği: yastık kılıflarının gelmediği yazılıyor.'],
    '467443838': ['Kategorinin en çok yorum alan ürünü (5.918 yazılı yorum); 1-2 yıldız payı %20,7.',
                  'Olumsuzların %13\'ü kumaşın naylon olduğunu ya da terlettiğini (adında "pamuklu tam takım" geçiyor), %13\'ü inceliğini, %10\'u tüylenmeyi yazıyor.',
                  'Ölçü ve çarşafın oturması şikâyeti %10; aynı modelin mürdüm renginde %4.',
                  '1-2 yıldızlı yorumların %38\'inde sözlükteki hiçbir şikâyet geçmiyor (kategori ortalaması %24).'],
    '655477600': ['1-2 yıldız payı %33,0 ile kategorinin en yükseği; aynı modelin antrasit renginde %20,7.',
                  'Olumsuz yorumların %17\'si rengin farklı geldiğini yazıyor; antrasit renkte bu oran %2.',
                  'İnce kumaş %11, naylon %10, tüylenme %8. 1-2 yıldızlı yorumların %38\'inde sözlükteki hiçbir şikâyet geçmiyor.'],
    '69768503': ['Olumsuz yorumların %28\'i kumaşın naylon olduğunu ya da terlettiğini, %22\'si tüylendiğini yazıyor; tüylenme kategorinin en yüksek oranı.',
                 'Kötü koku şikâyeti %7 (kategoride en yüksek); kalitesiz kumaş %12, defo %10.',
                 'Alıntılanan bir yorum ürünü önce beğendiğini, iki yıkamada tüylenince yorumunu güncellediğini yazıyor.'],
    '271943142': ['Olumsuz yorumların %19\'u kumaş kalitesini düşük buluyor; naylon %18, tüylenme %17.',
                  'Renk şikâyeti %9 (aynı modelin gri-siyahında %3): bordonun kırmızı geldiği yazılıyor.',
                  'Kargo şikâyeti %5 ile kategorinin en yükseği.'],
    '182714625': ['Olumsuz yorumların %30\'u kumaşın ince olduğunu yazıyor (KOBİ ürünleri arasında en yüksek); tüylenme ya da pamuklanma %18, kalitesiz kumaş %15.',
                  'Naylon ya da polyester şikâyeti %10; solma %8 (Karaca Home Neos ile birlikte kategorinin en yükseği).',
                  'Bir yorum desenin görseldekinden fazla olduğunu ve çarşafın çabucak pamuklandığını yazıyor.'],
    '635703472': ['Olumsuz yorumların %18\'i ölçüden (kategoride en yüksek); battal istediği halde küçük boyut gönderildiğini yazan yorum var.',
                  'Naylon şikâyeti %15; bir yorum baskının iyi, kumaşın naylon olduğunu yazıyor.',
                  'Yanlış ürün ya da beden %6; düğme, fermuar ya da lastik sorunu %5.',
                  '"Önerilen" ilk 100 yorumun ortalaması 4,88 ile kategorinin en düşüğü.'],
    '798612173': ['Olumsuz yorumların %39\'u kumaşın naylon olduğunu yazıyor, %22\'si kumaş kalitesini düşük buluyor; ikisi de kategorinin en yüksek oranı.',
                  'Renk şikâyeti %12; rengin canlı olmadığı için iade ettiğini yazan yorum var.',
                  'Defo %11, eksik parça %8, markaya yakışmadığını yazanlar %8. İlanı 10 satıcı satıyor.'],
    '38976172': ['1-2 yıldız payı %3,8 ile kategorinin en düşüğü; ürünün toplam 52 adet 1-2 yıldızlı yorumu var ve hepsi okundu.',
                 'Bu yorumların %54\'ü kumaşın sert olduğunu yazıyor; %10\'u ürünün %100 pamuk olmadığını düşünüyor.',
                 'Olumsuzların %8\'i yorumlara güvenip aldığını yazıyor (kategoride en yüksek); defo %12.'],
}
DERS = {
    '764006134': ['Önerilen yorumların %47\'si rengi ve deseni, %40\'ı hediye ya da çeyiz için aldığını anlatıyor. Görüntüsüyle satan üründe olumsuzların yarısı kumaşın inceliğinden; kumaşın kalınlığını ilanda göstermek bu farkı kapatır.'],
    '35128537': ['1-2 yıldız payı %7,3 ile kategorinin en düşük ikinci oranı; önerilen yorumların %35\'i hediye ya da çeyizden, %23\'ü paketten ve kargodan söz ediyor. Çok satıcılı ilanda şikâyetin bir kısmı kumaştan çok gelen renge ve eksik parçaya gidiyor.'],
    '746220566': ['Önerilen yorumların %47\'si kumaş kalitesini, %37\'si paketi ve kargoyu övüyor; ikisi de kategorinin en yüksek oranı. Büyük marka adı beklentiyi yükseltiyor: marka etiketi ya da kumaş oranı tutmayınca şikâyet güvene dönüyor.'],
    '934098058': ['Adında "pamuklu" geçen sette olumsuzların üçte biri kumaşın pamuklu olmadığını yazıyor; 1-2 yıldız payı diğer üç büyük marka ürününün iki katından fazla. Kumaş içeriğini oranıyla yazmak büyük markada bile güven sorusunu kapatır.'],
    '467443838': ['Önerilen yorumların %28\'i fiyatı övüyor; "F/P ürünü fakat çok ince" yorumu ürünün konumunu özetliyor. Ucuz set alan müşteri de kumaşın kalınlığına ve pamuk oranına bakıyor.'],
    '655477600': ['Aynı model iki renkte ayrı sonuç veriyor: mürdümde renk şikâyeti antrasitin yaklaşık 8 katı, 1-2 yıldız payı 12 puan yüksek. Renk adıyla satılan üründe rengin fotoğrafta doğru görünmesi kumaştan önce gelen şikâyeti önler. Önerilen yorumların %34\'ü fiyatı övüyor.'],
    '69768503': ['Lastikli çarşaflı KOBİ setleri arasında 1-2 yıldız payı en düşük ürün (%10,6); önerilen yorumların %32\'si fiyatı, %18\'i lastiği ve ölçüyü anıyor. Tüylenme ancak yıkamadan sonra görülüyor; ilk izlenimi iyi olan ürün sonraki yıkamalarda puan kaybediyor.'],
    '271943142': ['Önerilen yorumların %48\'i rengi ve deseni övüyor (kategoride en yüksek); rengi için alan müşteri tonun farklı gelmesini düşük puanla karşılıyor. Aynı modelin gri-siyahına göre naylon (%18 ve %28) ve tüylenme (%17 ve %22) şikâyeti az, kumaş kalitesi şikâyeti fazla (%19 ve %12).'],
    '182714625': ['Önerilen yorumların %27\'si paketi ve kargoyu, %25\'i hediye ya da çeyizi, %17\'si fiyatı anıyor. Fiyatı uygun bulan müşteri bile kumaş ince çıkınca "aldığıma pişman oldum" yazıyor.'],
    '635703472': ['Önerilen yorumların %17\'si rengin ve desenin görseldeki gibi geldiğini (kategoride en yüksek), %34\'ü hediye ya da çeyiz için aldığını yazıyor. Çift taraflı baskı görüntüyle satıyor, şikâyet ölçüye ve kumaşa gidiyor; boyut seçeneklerini (çift kişilik, battal) ilanda ve pakette ayırmak ölçü şikâyetini azaltır.'],
    '798612173': ['Önerilen yorumların %39\'u rengi ve deseni, %33\'ü kumaş kalitesini övüyor; olumsuzlarda ise kumaş öne çıkıyor. "Göründüğü gibi hoş ama çok naylon" yorumu özetliyor: görsel satışı getiriyor, kumaş içeriği puanı belirliyor.'],
    '38976172': ['Önerilen yorumların %43\'ü hediye ya da çeyiz için aldığını yazıyor (kategoride en yüksek), %30\'u kaliteyi övüyor. Tek satıcılı bu sette sertlik tek belirgin şikâyet; kumaşın dokusunu ilanda dürüstçe anlatmak "yorumlara aldandım" tepkisini azaltır.'],
}
ONERILER = [
    ('Kumaş içeriğini oranıyla yaz',
     'En sık şikâyet kumaşın pamuklu olmaması, naylon çıkması ya da terletmesi; olumsuz yorumlardaki oranı %{naylon} (büyük marka %{naylon_buyuk}, KOBİ %{naylon_kobi}). Adında "%100 pamuk" ya da "pamuklu" geçen beş üründe de bu oran %10-33. Pamuk ve polyester oranını ilanda, etikette ve pakette açıkça yazmak, "pamuklu diye aldım" diye başlayan 1-2 yıldızın doğrudan karşılığı.'),
    ('Kumaşın kalınlığını göster',
     'İnce kumaş şikâyetinin oranı %{ince}; büyük markalarda %{ince_buyuk} (Karaca Home Loretta %51), KOBİ\'de %{ince_kobi} (MyStory Home %30). Kalitesiz kumaş şikâyeti iki grupta da %{kalitesiz}. Kumaşın dokusunu ve kalınlığını yakın çekim fotoğrafla, ışığa tutulmuş haliyle göstermek beklentiyi doğru kurar.'),
    ('Tüylenme ve ölçü: KOBİ setlerinin zayıf noktası',
     'Tüylenme ve pamuklanma şikâyeti KOBİ ürünlerinde %{tuylenme_kobi}, büyük markalarda %{tuylenme_buyuk} (İQON gri-siyah %22). Ölçü ve çarşafın oturmaması KOBİ\'de %{olcu_kobi}, büyük markada %{olcu_buyuk} (Rimo Home %18). KOBİ ürünlerinde 1-2 yıldız payı %{dusuk_kobi}, büyük markalarda %{dusuk_buyuk}; KOBİ\'yi büyük markadan en çok ayıran iki şikâyet bunlar. Lastikli çarşafın hangi yatak ölçüsüne uyduğunu ve parçaların ölçülerini ilanda yazmak, yıkamada tüylenmeyen kumaş seçmek bu farkı kapatmanın yolu.'),
    ('Her renk ayrı ilan, ayrı sınav',
     'Rengin ya da desenin görseldekinden farklı gelmesi şikâyetinin oranı %{renk}. Aynı modelde fark büyük: conzaliza mürdümde renk şikâyeti %17, antrasitte %2 (1-2 yıldız payı %33,0 ve %20,7); İQON bordo-gride %9, gri-siyahta %3. Rengi ve deseni öven önerilen yorumların oranı ortalama %{renk_olumlu}; renk satışı getiriyor, fotoğrafla tutmayınca puanı da götürüyor.'),
    ('Büyük marka ilanında doğru marka, eksiksiz takım',
     'Büyük marka ürünlerinde markaya yakışmadığını ya da başka marka geldiğini yazan yorumların oranı %{marka_buyuk} (KOBİ %{marka_kobi}); Özdilek Floraison\'da %30 ve ilanı 20 satıcı satıyor. Eksik parça büyük markada %{eksik_buyuk}, yanlış ürün ya da beden %{yanlis_buyuk}. Bayi olarak büyük marka satan KOBİ için paketi açıp markayı, parça sayısını ve ölçüyü kontrol etmek en ucuz önlem.'),
    ('Hediye ve çeyiz alıcısı, fiyat alıcısı',
     'Hediye ya da çeyiz için aldığını yazan önerilen yorumların oranı ortalama %{hediye_olumlu} (büyük marka %{hediye_olumlu_buyuk}, KOBİ %{hediye_olumlu_kobi}; Berolige %43). Fiyatı anan önerilen yorumlar KOBİ\'de %{fiyat_olumlu_kobi}, büyük markada %{fiyat_olumlu_buyuk}. Hediye alıcısı için kutulu ve özenli paket, fiyat alıcısı için kumaş bilgisi öne çıkarılmalı.'),
]


def p(v): return f'{round(v * 100):d}'


def p1(v): return f'{v * 100:.1f}'.replace('.', ',')


def main(out):
    B = json.load(open('nevresim_tarayici.json', encoding='utf-8'))
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
    wo = lambda L, k: sum(u['olumlu'][k] * u['onerilen_n'] for u in L) / max(1, sum(u['onerilen_n'] for u in L))
    low = lambda L: sum(u['yildiz'][0] + u['yildiz'][1] for u in L) / sum(u['yazili'] for u in L)
    v = {k: p(w(U, k)) for k in SIKAYET}
    for k in SIKAYET:
        v[k + '_kobi'] = p(w(kobi, k)); v[k + '_buyuk'] = p(w(big, k))
    for k in OLUMLU:
        v[k + '_olumlu'] = p(wo(U, k)); v[k + '_olumlu_kobi'] = p(wo(kobi, k)); v[k + '_olumlu_buyuk'] = p(wo(big, k))
    v['dusuk_kobi'] = p1(low(kobi)); v['dusuk_buyuk'] = p1(low(big))
    print('öneri rakamları', {k: v[k] for k in v if k.split('_')[0] in ('naylon', 'ince', 'kalitesiz', 'tuylenme', 'olcu', 'renk', 'marka', 'eksik', 'yanlis', 'hediye', 'fiyat', 'dusuk')}, file=sys.stderr)
    print('toplam', {'urun': len(U), 'yazili': sum(u['yazili'] for u in U), 'okunan': sum(u['onerilen_n'] + u['ornek_dusuk'] for u in U),
                     'dusuk': p1(low(U)), 'dusuk_buyuk': v['dusuk_buyuk'], 'dusuk_kobi': v['dusuk_kobi']}, file=sys.stderr)
    cat = {'id': 'nevresim-takimi', 'ad': 'Nevresim takımı', 'ust': 'Ev tekstili', 'toplama': '12 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['nevresim', 'nevresim takımı', 'çift kişilik nevresim', 'nevresim seti', 'yorgan kılıfı', 'lastikli çarşaf', 'lastikli çarşaflı nevresim', 'pamuklu nevresim'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


main(sys.argv[1])
