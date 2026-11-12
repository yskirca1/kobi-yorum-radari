"""Yüz serumu: serum_tarayici.json (tarayıcıda hesaplanan özetler) -> data/yuz-serumu.json
Notlar yorumcuların yazdıklarını aktarır; site ürünlerin etkisi ya da sağlık hakkında kendi iddiasında bulunmaz."""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU

AD = {
    '157360249': 'Garnier Vitamin C+ Süper Parlaklık Yüz Serumu 30 ml (niasinamid, salisilik asit)',
    '150725523': 'Nivea Luminous630 Leke Karşıtı Cilt Serumu 30 ml',
    '906055076': 'The Ordinary Niacinamide %10 + Zinc %1 Serum 30 ml',
    '475277782': "L'Oréal Paris Revitalift Clinical %12 Saf C Vitamini Serum 30 ml",
    '754862327': 'Koreaco Leke Karşıtı Cilt Tonu Eşitleyen Aydınlatıcı Ampul (arbutin)',
    '754863810': 'Koreaco AHA %10 + BHA %2 Gözenek Sıkılaştırıcı Ampul',
    '44174819': 'The Purest Solutions Arbutin Aydınlatıcı Cilt Bakım Serumu 30 ml',
    '147528362': 'The Purest Solutions C Vit %10 Aydınlatıcı Bakım Serumu 30 ml (askorbik asit, ferulik asit)',
    '44292035': 'The Purest Solutions Niacinamide %5 + Zinc PCA %1 Serum 30 ml',
    '696216899': 'The Ceel Vitamin C Serum 30 ml (glutatyon, ferulik asit, askorbik asit)',
    '318277648': 'Cream Co. Peptit Serum (niacinamide, hyaluronik asit)',
    '449122769': 'eliamora Papaya Özlü Peeling Serumu',
    '241614313': 'Rimu Arbutin Leke Karşıtı Serum 30 ml',
}
DIKKAT = {
    '157360249': ['Olumsuz yorumların %20\'si etkisini görmediğini yazıyor; bazı yorumlar parlaklığın anlık olduğunu, kalıcı olmadığını söylüyor.',
                  'Olumsuz yorumların %5\'i övgülere ya da yorumlara güvenip aldığını ve beklentisinin karşılanmadığını yazıyor; 3 yorum yapışkan his bıraktığını söylüyor.',
                  '1-2 yıldızlı yorumların %59\'unda sözlükteki şikâyetlerden hiçbiri geçmiyor.'],
    '150725523': ['Olumsuz yorumların %38\'i lekelerde açılma ya da değişiklik görmediğini yazıyor; büyük markalar arasında en yüksek oran.',
                  'Şişenin az olduğu ve çabuk bittiği şikâyeti %5; kutunun açık ya da bantsız geldiği %4, orijinallik şüphesi %3.'],
    '906055076': ['1-2 yıldız oranı %13,8 ile büyük markalar arasında en yüksek.',
                  'Olumsuz yorumların %12\'si kuruluk, pul pul soyulma, yanma ya da kızarıklık yazıyor; %26\'sı etkisini görmediğini söylüyor.',
                  'Kutunun açık ya da kullanılmış gibi gelmesi %8, orijinallik şüphesi %6 (koruma bandı olmadığını yazanlar var), kargo gecikmesi %7.'],
    '475277782': ['Olumsuz yorumların %12\'si serumun kısa sürede bozulduğunu, renginin sarardığını ya da turuncuya döndüğünü yazıyor; biri buzdolabında sakladığı halde.',
                  'Soyulma ve yanma gibi tahriş şikâyeti %13; koku şikâyeti %10 (pas kokusu yazılıyor).',
                  'Kutunun açık ya da mühürsüz gelmesi %10.'],
    '754862327': ['1-2 yıldız oranı %19,5 ile kategorinin en yükseği; ama 1-2 yıldızlı yorumların %75\'inde sözlükteki hiçbir şikâyet geçmiyor. Okununca çoğunun övgü ya da "henüz kullanmadım" olduğu görülüyor (13 yorum henüz kullanmadığını yazıyor).',
                  'Şikâyet içeren yorumlarda etkisini görmeme %7, sivilce ya da komedon %5, şişenin yarım ya da küçük gelmesi %4.'],
    '754863810': ['1-2 yıldız oranı %18,1; 1-2 yıldızlı yorumların %82\'sinde şikâyet konusu yok, 17 yorum ürünü henüz kullanmadığını yazıyor.',
                  'Şikâyet içeren yorumlarda "sosyal medya şişirmesi" (%7) ve etkisizlik (%6) öne çıkıyor; 3 yorum gözeneklerinin daha da açıldığını yazıyor.'],
    '44174819': ['Olumsuz yorumların %15\'i lekelerde açılma görmediğini yazıyor; bazıları birkaç şişe bitirdiğini belirtiyor.',
                 'Ağır ya da ilaç gibi koku (%4) ve soyulma, pütürlenme (%4) şikâyeti var.',
                 'Aldıktan sonra fiyatın düştüğü ya da fiyatına değmediği şikâyeti %4.'],
    '147528362': ['Olumsuz yorumların %12\'si şişenin kapağı açık, akmış ya da kutuya dökülmüş geldiğinden.',
                  'Rengin sarardığı ya da bozulduğu şikâyeti %6; yanma, kuruluk gibi tahriş şikâyeti %6.',
                  '"Önerilen" ilk 100 yorumda 6 tane 1-2 yıldızlı yorum var (kategoride en fazla).'],
    '44292035': ['Olumsuz yorumların %32\'si etkisini görmediğini yazıyor (KOBİ ürünleri arasında ikinci en yüksek).',
                 'Sivilcelenme ya da komedon yazan yorumlar %6, cildini ya da cilt bariyerini kötüleştirdiğini yazanlar %4, kızarıklık ve yanma %3.',
                 '12 olumsuz yorum ürünü henüz kullanmadan yazılmış.'],
    '696216899': ['Rengin değiştiği ya da koyulaştığı şikâyeti %9; balık gibi ya da ağır koku %6.',
                  'Olumsuz yorumların %5\'i başkalarına gönderilen hediyenin kendisine gelmediğini yazıyor.',
                  '14 olumsuz yorum ürünü henüz kullanmadan yazılmış.'],
    '318277648': ['Olumsuz yorumların %14\'ü şişenin kırık ya da akmış gelmesinden; %6\'sı şişenin bir kısmının boş geldiğini yazıyor.',
                  'Etkisiz ya da "su gibi" bulma %13; komedon ve sivilcelenme yazan yorumlar %6.'],
    '449122769': ['1-2 yıldız oranı %15,8; 1-2 yıldızlı yorumların %70\'inde şikâyet konusu yok, bir kısmı ürünü öven ya da hediye aldığını yazan yorumlar.',
                  'Şikâyet içeren yorumlarda etkisizlik öne çıkıyor (%18): "ölü deri" diye görülen şeyin serumun kendisi olduğu yazılıyor.',
                  '2 yorum şişeden ürünü almanın zor olduğunu, 2 yorum marka hakkında çıkan haberler yüzünden bir daha almayacağını yazıyor.'],
    '241614313': ['1-2 yıldız oranı %6,2 ile kategorinin en düşüğü; ama olumsuz yorumların %45\'i etkisini görmediğini yazıyor (kategorinin en yükseği).',
                  'Kuruluk ve "silgi gibi" soyulma %11; rengin değişip bozulduğu %8.',
                  'Olumsuzların %9\'u övgülere ya da tavsiyeye güvenip beklentisinin karşılanmadığını yazıyor.'],
}
DERS = {
    '157360249': ['Önerilen yorumların %37\'si parlaklık ve canlılıktan, %40\'ı tekrar aldığından söz ediyor; olumsuzlar ise "anlık etki" ile "kalıcı sonuç" beklentisi arasındaki farktan doğuyor.'],
    '150725523': ['Önerilen yorumların %27\'si lekelerde açılma, %30\'u tekrar alım anlatıyor; leke serumunda vaat edilen süre ile kullanıcının beklediği süre arasındaki fark olumsuz yorumu belirliyor.'],
    '906055076': ['Mühürsüz ya da açık gelen kutu, ithal markada bile orijinallik şüphesine dönüyor; önerilen yorumların yalnızca %7\'si tekrar alımdan söz ediyor (kategorinin en düşüğü). Koruma bandı ve kutu mührü kozmetikte güvenin ilk adımı.'],
    '475277782': ['Hassas içerikte bozulma, renk ve koku değişimi etkisizlik kadar puan düşürüyor; önerilen yorumların %26\'sı parlaklıktan söz ediyor.'],
    '754862327': ['Kategorinin en çok yorum alan ürünü (39.208 yazılı yorum). Puan dağılımı memnuniyeti doğru göstermiyor: 1-2 yıldız veren pek çok kullanıcı ürünü övüyor. Rakibi değerlendirirken yıldıza değil yorum metnine bakmak gerekiyor.'],
    '754863810': ['Önerilen yorumların %22\'si sivilce, gözenek ve siyah noktada iyileşme gördüğünü yazıyor; yorumlarda serinin farklı renkteki şişelerini birlikte alanlar var.'],
    '44174819': ['Önerilen yorumların %37\'si tekrar aldığını yazıyor (Garnier\'den sonra en yüksek); büyüyen yerli marka sadakatle satıyor. Örneklenen yorumlarda 18 farklı satıcı adı geçiyor.'],
    '147528362': ['Önerilen yorumların %30\'u parlaklık, %32\'si tekrar alım yazıyor. Sıvı serumda kargodaki sızıntı en kolay önlenebilecek şikâyet.'],
    '44292035': ['Aynı içerikte yerli KOBİ markası büyük markayla yarışabiliyor: 1-2 yıldız oranı %7,6, The Ordinary niasinamid serumunda %13,8. Önerilen yorumların %19\'u sivilce ve gözenekte iyileşme yazıyor.'],
    '696216899': ['Önerilen yorumların %19\'u hediyeden söz ediyor; hediye alışkanlık yaratınca gelmeyen hediye 1-2 yıldıza dönüyor.'],
    '318277648': ['Önerilen yorumların %36\'sı nemlendirmeyi övüyor; olumsuzların en büyük kısmı ürünün kendisinden değil kargodaki sızıntıdan geliyor (%14).'],
    '449122769': ['Önerilen yorumların %18\'i hediyeden söz ediyor. "Gözle görülen etki" vaadi, kullanıcı etkinin kaynağını sorgulayınca güvensizliğe dönüyor.'],
    '241614313': ['Önerilen yorumların %13\'ü tavsiye ya da sosyal medya üzerine aldığını yazıyor (kategorinin en yükseği); tavsiyeyle gelen müşteri hızlı sonuç bekliyor, görmeyince "abartılmış" diyor.'],
}
ONERILER = [
    ('En büyük şikâyet etki beklentisi: kullanım süresini açık yaz',
     'Olumsuz yorumlarda etkisini görmeme oranı %{etkisiz} (büyük marka %{etkisiz_buyuk}, KOBİ %{etkisiz_kobi}). Birçok olumsuz yorum birkaç gün ya da birkaç hafta kullandıktan sonra yazılmış. Ürünün nasıl ve ne kadar süre kullanılacağını ilanda ve kutuda açıkça yazmak beklentiyi gerçekçi tutar. (Bu site ürünlerin etkisi hakkında değerlendirme yapmaz; oranlar yorumcuların yazdıklarıdır.)'),
    ('Cilt tepkisi yazan yorumlar: kullanım talimatı ve uyarılar görünür olsun',
     'Yorumcuların bir kısmı sivilce, komedon, yanma, kızarıklık ya da soyulma yazıyor (sivilce ve komedon %{sivilce}, tahriş %{tahris}; büyük markada tahriş %{tahris_buyuk}). İçerik oranlarını, hangi cilt tipi için olduğunu, üreticinin kullanım talimatını ve uyarılarını ilanda ve kutuda net göstermek bu yorumlarla karşılaşmayı azaltır.'),
    ('Sızdırmaz şişe, mühürlü kutu',
     'Kırık, akmış ya da kapağı açık gelen şişe şikâyetinin oranı %{hasarli} (KOBİ %{hasarli_kobi}); The Purest Solutions C Vit ve Cream Co. Peptit serumda %12-14. Büyük markalarda ise kutunun açık ya da bantsız gelmesi (%{bant_buyuk1}) ve orijinallik şüphesi (%{orijinal_buyuk1}) KOBİ\'deki oranların (%{bant_kobi1} ve %{orijinal_kobi1}) yaklaşık beş katı. Koruma bandı ve sızdırmaz paketleme hem hasarı hem güven sorusunu karşılar.'),
    ('Renk ve koku değişimi: saklama bilgisini ver',
     'Rengin değiştiği, sarardığı ya da kokunun bozulduğu şikâyetinin oranı %{bozuk}; C vitamini ve arbutin serumlarında daha sık (L\'Oréal C vitamini %12, The Ceel %9, Rimu %8). Işık geçirmeyen şişe, açıldıktan sonraki kullanım süresi ve saklama koşulunu ilanda ve etikette göstermek "bozuk geldi" şikâyetini azaltır.'),
    ('Yıldıza değil metne bak; hediye beklenti yaratıyor',
     '1-2 yıldızlı yorumların ortalama %{bos} kadarında sözlükteki hiçbir şikâyet geçmiyor; Koreaco ürünlerinde bu oran %75-82 ve okunan metinlerin çoğu övgü ya da "henüz kullanmadım". Rakibin puanı tek başına yanıltıcı. Ayrıca KOBİ önerilen yorumlarının %{hediye_olumlu_kobi} kadarı hediyeden söz ediyor (büyük marka %{hediye_olumlu_buyuk}); hediye gönderen markada hediyenin gelmemesi 1-2 yıldıza dönüyor (The Ceel %5).'),
]


def p(v): return f'{round(v * 100):d}'


def main(out):
    B = json.load(open('serum_tarayici.json'))
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
    v = {k: p(w(U, k)) for k in SIKAYET}
    for k in SIKAYET:
        v[k + '_kobi'] = p(w(kobi, k)); v[k + '_buyuk'] = p(w(big, k))
    for k in ('bant', 'orijinal'):
        v[k + '_kobi1'] = f'{w(kobi, k) * 100:.1f}'.replace('.', ','); v[k + '_buyuk1'] = f'{w(big, k) * 100:.1f}'.replace('.', ',')
    v['hediye_olumlu_kobi'] = p(wo(kobi, 'hediye')); v['hediye_olumlu_buyuk'] = p(wo(big, 'hediye'))
    v['bos'] = p(sum(B[u['id']]['_eslesmeyen'] for u in U) / sum(u['ornek_dusuk'] for u in U))
    print('öneri rakamları', {k: v[k] for k in v if k.split('_')[0] in ('etkisiz', 'sivilce', 'tahris', 'hasarli', 'bant', 'orijinal', 'bozuk', 'hediye', 'bos')}, file=sys.stderr)
    cat = {'id': 'yuz-serumu', 'ad': 'Yüz serumu', 'ust': 'Kozmetik', 'toplama': '12 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['yüz serumu', 'serum', 'cilt serumu', 'c vitamini serumu', 'niacinamide serum', 'hyaluronik asit serumu', 'leke serumu', 'ampul serum'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)


main(sys.argv[1])
