# Nevresim takımı (çift kişilik) konu sözlüğü. Ürünlerin tamamı Claude uygulama tarayıcısında toplandı (12 Kasım 2026);
# oranlar bu sözlükle tarayıcıda hesaplandı (JS'de \w yerine [\p{L}\d_] ve 'u' bayrağı). Özetler: nevresim_tarayici.json
# `python3 analiz.py` sözlüğü tarayıcıya gönderilecek JSON olarak yazar.
import json, sys

DOSYALAR = {  # urunId: (kisa, marka, segment)
    '764006134': ('Loretta %100 pamuk, sarı', 'Karaca Home', 'Büyük marka'),
    '35128537': ('Neos %100 pamuk, mavi', 'Karaca Home', 'Büyük marka'),
    '746220566': ('Floraison, somon', 'Özdilek', 'Büyük marka'),
    '934098058': ('Lauren pamuklu set, yeşil', 'Bella Maison', 'Büyük marka'),
    '467443838': ('Lastikli çarşaflı, antrasit siyah', 'conzaliza', 'KOBİ'),
    '655477600': ('Lastikli çarşaflı, mürdüm antrasit', 'conzaliza', 'KOBİ'),
    '69768503': ('Lastikli çarşaflı, gri-siyah', 'İQON', 'KOBİ'),
    '271943142': ('Lastikli çarşaflı, bordo-gri', 'İQON', 'KOBİ'),
    '182714625': ('Lastikli çarşaflı, Viola', 'MyStory Home', 'KOBİ'),
    '635703472': ('Çift taraflı takım', 'Rimo Home', 'KOBİ'),
    '798612173': ('Malia, multicolor', 'Sarah Anderson', 'Büyük marka'),
    '38976172': ('Sunday %100 pamuk çizgili, kahve', 'Berolige', 'KOBİ'),
}
SIKAYET = {
    'naylon': ('Pamuklu değil, naylon/polyester, terletiyor', 'Pamuklu değil, naylon çıkıyor!',
               r'naylon(?! poşet)|naylın|laylon|polyester|polyster|sentetik|pamuk\w* (değil|degil|deyil)|pamuk oranı|pamuk yazıyor|%100 pamuk değil|yüzde yüz pamuk değil|pamuk(lu)? olduğunu düşünmüyorum|pamuklu yazıyor|terlet(iyor|ir|ti|ici)|terletme yapıyor|ter(le)?tiyor|terleyerek|pişirir|plastik gibi|karışım'),
    'ince': ('Kumaşı ince, seyrek', 'Kumaşı ince geliyor!',
             r'(?<![\p{L}])ince(?!le)|incecik|tül gibi|elek gibi|kağıt gibi|kâğıt gibi|yaprak gibi|seyrek|şeffaf|içi görün|yırtılacak gibi|sık dokuma beklerdim'),
    'sert': ('Kumaşı sert, rahatsız', 'Kumaşı sert!',
             r'sert|batıyor|kaşındır|yumuşa\w* (değil|olmadı|olmuyor)|yumuşacık değil|rahatsız edici|canını acıt|zımpara|hışır'),
    'tuylenme': ('Tüylenme, tiftiklenme, çabuk yıpranma', 'Kısa sürede tüyleniyor!',
                 r'tüylen|tülen|tiftik|tivtik|tükendi|kullanılmaz hale|yıprandı|eskidi|pamuklan|pamuklandı|top top|topak|topaklan|pütür|pötür|boncuk|bitlen|kedi tüyü|tüy (topluyor|yapıyor|bırakıyor)'),
    'solma': ('Rengi soldu, boya attı', 'Yıkamada rengi soluyor!',
              r'sol(du|ma|uyor|muş|dı)|soluk|renk\w* (attı|veriyor|verdi|akıttı|çıktı|kaçtı)|boya\w* (attı|verdi|akıt|çıktı)|boyası|rengi gitti|rengi açıldı|renk dök|renk atı|renkleri birbirine'),
    'renk': ('Rengi ya da deseni görseldekinden farklı', 'Rengi görseldeki gibi gelmiyor!',
             r'farklı renk|farkli renk|renk\w* (farklı|farkli|alakasız|alakası yok|aynı değil|tutmuyor|uyumsuz|cansız|silik|kötü)|rengi .{0,25}(geldi|gelmiş)|ren[kg]\w* .{0,15}(değil|degil)|reng geldi|renk gelmiş|ton farkı|görsel\w* .{0,25}(değil|farklı|alakası|göründüğü gibi değil)|resimde\w* gibi değil|fotoğraf\w* .{0,25}(değil|farklı|gibi değil)|göründüğü gibi değil|gorundugu gibi degil|desen\w* .{0,20}(farklı|değil|silik|kaymış)|istememiştim|istemiştim|(çarşaf|carsaf|çarçaf)\w* .{0,25}(renk|reng|sarı|sari|krem)|alakası yok|alakasız|ile alakasını'),
    'olcu': ('Ölçü küçük, çarşaf yatağa olmuyor, yıkayınca çekti', 'Çarşafı yatağa küçük geliyor!',
             r'küçük|küçücük|kucuk|ölçü|olcu|ebat|boyut|\d{3} ?[x×*] ?\d{3}|yatağ\w* .{0,25}(olmadı|olmuyor|geçmiyor|oturmuyor|kısa|dar|yetmiyor)|kısa geldi|dar geldi|çekti|çekme yaptı|daraldı|küçüldü|lastiğ\w* .{0,20}(gevşek|olmuyor|tutmuyor|kısa|zayıf)|yetmiyor'),
    'defo': ('Defolu, yırtık, lekeli, dikiş hatalı geldi', 'Defolu ve lekeli geliyor!',
             r'defo|yırtık|yirtik|yırtıl|delik|lekeli|leke\w* (vardı|var|çıktı|oluş|olul)|sarı leke|kahve lekesi|ip kalma|ipi çekil|kaçık|sökük|söküldü|sokuldu|dikiş\w* .{0,25}(kötü|hatalı|sökül|kaymış|yamuk|özen|düzgün değil|açıl)|baskı hatası|dokuma hata|kusurlu|izler oluş|kirli geldi|hasarlı|yanık|şerit iz|noktalar var|çamur|kalite kontrol|gelişigüzel dikil'),
    'eksik': ('Eksik parça (yastık kılıfı, çarşaf) geldi', 'Takım eksik geliyor!',
              r'eksik|yastık kılıf\w* .{0,25}(bir tane|1 tane|tek|çıkmadı|yok|gelmedi)|bir adet yastık|1 adet yastık|(bir|1) tane yastık|çarşaf\w* .{0,15}(yok|gelmedi|çıkmadı)|içinden .{0,30}çıkmadı|gelmedi|diğeri nerde|takımı yok'),
    'yanlis': ('Yanlış ürün ya da beden (tek kişilik, lastiksiz) geldi', 'Yanlış ürün gönderiliyor!',
               r'yanlış|yanlis|tek kişilik (gönder|geldi|çarşaf|gelmiş)|tek kişilik\w* .{0,20}(gönder|geldi)|lastikli (diye|olarak) .{0,30}(düz|lastiksiz)|lastiksiz geldi|düz geldi|farklı (bir )?ürün|başka (bir )?ürün|başka (bir )?model|sipariş ettiğim\w* .{0,20}(değil|gelmedi)'),
    'marka': ('Markaya yakışmıyor, başka marka/kutu geldi', 'Marka kalitesine yakışmıyor!',
              r'yakışma|yakisma|yakışmadı|yarawmadı|kalitesi (değil|yok)|kalitesi asla|kalitesini beklemeyin|olarak beklemeyin|(karaca|özdilek|ozdilek|özdileğ|bella|marka)\w* (diye|olarak|kalitesi)|kutusu başka|başka (bir )?kutu|\bnev\b|nev marka|marka\w* .{0,15}(yanlış|farklı|değil)|ürünü değil|orijinal değil|orjinal değil|(orijinal|orjinal) \w+ (asla )?değil|(karaca|özdilek|bella)\w*( home\w*)? .{0,4}alakası yok|sahte|çakma|taklit|markalı al'),
    'kalitesiz': ('Kumaş kalitesi düşük, vasat', 'Kumaş kalitesi düşük!',
                  r'kalitesiz|kalıtesız|kalite\w* .{0,20}(yok|düşük|kötü|vasat|değil)|kaliteli (değil|degil|bi(r)? ?şey değil|bişe degil)|kumaş\w* .{0,25}(kaliteli değil|iyi değil|degil|kötü|beğenme|sevme|vasat|berbat|kalitesiz)|vasat|dandik|pazar malı|pazar malları'),
    'koku': ('Kötü koku', 'Kötü kokuyor!', r'koku|kokuyor|kokusu'),
    'paket': ('Kutusuz, poşette ya da özensiz paketlenmiş', 'Kutusuz, poşette geliyor!',
              r'poşet|poset|kutusuz|kutulu (gelme|yazıyor|beklen|değil)|kutusu (yok|yoktu|gelmedi)|kutu\w* .{0,15}(yok|ezik|yırtık|parçalan)|paketle\w* .{0,25}(kötü|özensiz|yetersiz|rezalet|berbat|hariç)|jelatin|naylon poşet|ambalaj\w* .{0,15}(kötü|yırtık|yok)'),
    'kargo': ('Kargo sorunu', 'Kargo sorun çıkarıyor!',
              r'kargo\w* .{0,30}(geç|kayıp|gelmedi|patla|kötü|rezalet|yere|ilgisiz|ulaşmadı)|geç geldi|teslim edildi görün|teslim edilmedi|ulaşmadı|kurye|ptt|geç kargoya|kargoya ver\w* .{0,15}(uzadı|geç)|vazat'),
    'fiyat': ('Fiyatına değmez', 'Fiyatına değmiyor!',
              r'paran\w* (yazık|çöp)|parama yazık|paraya (yazık|değmez)|paraya üzüldüm|verdiğ\w* paraya|parasını hak|o paraya|fiyat\w* .{0,25}(değmez|pahalı|yüksek|fazla|abart)|pahalı|kazık|bu fiyata (değmez|ancak)|daha ucuza daha kaliteli'),
    'yorum': ('Yorumlara güvenip hayal kırıklığı', 'Yorumlar beklentiyi yükseltiyor!',
              r'yorumlara (bakarak|aldan|güven|göre)|yorumlara aldandım|yorumları okuyup|güzel yorumlara|diyenlere (de )?hayret|yorum yapanlar|yorumu yapanlar|iyi yorum'),
    'aksesuar': ('Düğme, fermuar, lastik sorunu', 'Düğmesi ve lastiği sorunlu!',
                 r'düğme|dugme|fermuar|çıtçıt|citcit|kopça|lastiğ\w* .{0,20}(koptu|gevşe|zayıf|kısa|olmuyor)|lastiği yok'),
}
OLUMLU = {
    'yumusak': ('Yumuşak, rahat', r'yumuşa|yumusa|yumuşacık|pamuk gibi|rahat|ipek gibi|kadife gibi|tatlı bir doku'),
    'kalite': ('Kaliteli, kalın kumaş', r'kaliteli|kalitesi|kalın|kalin|sağlam|dolgun|sık dokuma|dayanıklı'),
    'gorsel': ('Rengi ve deseni görseldeki gibi', r'görsel\w* .{0,20}(gibi|aynı|birebir)|göründüğü gibi|resimdeki gibi|fotoğraftaki gibi|birebir|aynısı|beklediğim gibi'),
    'renk': ('Rengi, deseni güzel', r'renk|reng|desen|şık|güzel duruyor|canlı|tatlı|zarif|asil'),
    'pamuk': ('Pamuklu, terletmiyor', r'pamuklu|%100 pamuk|pamuk|terletmiyor|terletmez|nefes alan|hava alan'),
    'yikama': ('Yıkamada solmadı, tüylenmedi', r'(sol|tüylen|çekme|pamuklan|boya)\w* (yok|yapmadı|yapmıyor|olmadı|vermedi|atmadı)|solmadı|tüylenmedi|çekmedi|yıkadım .{0,30}(güzel|sorun|aynı)'),
    'olcu': ('Ölçüsü tam, çarşaf oturuyor', r'lastikli|lastik|tam oldu|tam oturdu|oturdu|ölçü\w* .{0,15}(tam|uygun|iyi)|yatağa tam|büyük|geniş'),
    'fiyat': ('Fiyatına göre iyi', r'fiyat|uygun|ucuz|indirim|performans|parasına|fp\b'),
    'paket': ('Özenli paket, kutulu, hızlı kargo', r'paketle|paketlen|kutu|hızlı|kargo|özenli|sağlam geldi'),
    'hediye': ('Hediye ya da çeyiz için aldı', r'hediye|çeyiz|ceyiz|annem|anneme|kızıma|gelin|düğün'),
}


def js_sozluk():
    J = lambda s: s.replace(r'\w', r'[\p{L}\d_]')
    return {'sikayet': {k: J(v[2]) for k, v in SIKAYET.items()}, 'olumlu': {k: J(v[1]) for k, v in OLUMLU.items()}}


if __name__ == '__main__':
    json.dump(js_sozluk(), sys.stdout, ensure_ascii=False)
