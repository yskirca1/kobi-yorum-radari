# Yüz serumu konu sözlüğü. Ürünlerin tamamı Claude uygulama tarayıcısında toplandı (12 Kasım 2026); oranlar bu sözlükle
# tarayıcıda hesaplandı (JS'de \w yerine [\p{L}\d_] ve 'u' bayrağı). Özetler: serum_tarayici.json
# `python3 analiz.py` sözlüğü tarayıcıya gönderilecek JSON olarak yazar.
# Not: konular yorumcuların ne yazdığını sayar; site ürünün etkisi ya da sağlık hakkında kendi iddiasında bulunmaz.
import json, sys

DOSYALAR = {  # urunId: (kisa, marka, segment)
    '157360249': ('Vitamin C+ Süper Parlaklık Serumu', 'Garnier', 'Büyük marka'),
    '150725523': ('Luminous630 Leke Karşıtı Serum', 'Nivea', 'Büyük marka'),
    '906055076': ('Niacinamide %10 + Zinc %1 Serum', 'The Ordinary', 'Büyük marka'),
    '475277782': ('Revitalift Clinical %12 C Vitamini Serum', "L'Oréal Paris", 'Büyük marka'),
    '754862327': ('Leke Karşıtı Aydınlatıcı Ampul', 'Koreaco', 'KOBİ'),
    '754863810': ('AHA %10 + BHA %2 Ampul', 'Koreaco', 'KOBİ'),
    '44174819': ('Arbutin Aydınlatıcı Serum', 'The Purest Solutions', 'KOBİ'),
    '147528362': ('C Vit %10 Serum', 'The Purest Solutions', 'KOBİ'),
    '44292035': ('Niacinamide %5 Serum', 'The Purest Solutions', 'KOBİ'),
    '696216899': ('Vitamin C Glutatyon Serum', 'The Ceel', 'KOBİ'),
    '318277648': ('Peptit Serum', 'Cream Co.', 'KOBİ'),
    '449122769': ('Papaya Peeling Serumu', 'eliamora', 'KOBİ'),
    '241614313': ('Arbutin Serum', 'Rimu', 'KOBİ'),
}
SIKAYET = {
    'etkisiz': ('Etkisini görmedi, fark yok', 'Etkisini görmediğini yazanlar çok!',
                r'etki\w* (yok|olmadı|görme|göreme|gözlemle)|(bir|hiç|hiçbir|pek|bi) (etki|fark|fayda|değişi|sonuç)\w* (yok|görme|göreme|olmadı|etme|fark ?etme|yarat|gözlemle|alama)|fark\w* (yok|görme|göreme|olmadı|etmedi|yaratmadı)|faydası\w* (yok|olmadı|görme|göreme)|faydasını görme|işe yara(ma|mı)|işe yaramıyor|iş yaramadı|yaramadı|sudan farksız|su gibi etki|^su+ ?(sadece)?$|aynı (kaldı|duruyor)|değişiklik (yok|olmadı|göreme|görme)|hiçbir şey (değişmedi|yapmadı|olmadı)|hiç bir şey (değişmedi|yapmadı)|açmadı|aydınlatmadı|geçirmedi|etkisiz|fayda etmedi|fayda ettiği söylenemez|hiçbir işe|hiç bir işe|bir şeye yaradığı|(etki|fark|fayda)\w* .{0,10}(gor|gör)(e)?me|(etki|fayda|fark)\w* (alamadım|anlaşılmıyor|anlayamadım|anlamadım)|açılma (olmadı|görmedim|yok)|kalıcılık yok|anlık (parlaklık|etki|olarak)|geçirdiği yok|aynen devam|yararı (da )?(yok|olmadı)|fayası olmadı|yeterli olmadı|değişiklik yapmadı|işe yaramdı|ne işe yarıyor anlama|iyi gelmedi|iyi gelmemiş|faydası yık|sadece parlaklık veriyor|tırt|hüsran|hayal kırıklığı|işe yaradığını düşünmüyorum'),
    'sivilce': ('Sivilce, komedon yaptığı yazılıyor', 'Sivilce yaptığını yazanlar var!',
                r'sivilce\w* (yap|çık|oldu|patla|artır|art)|sivilcelen|sivilcemsi|komedon|akne yap|kusma|pütür|döküntü|sivilce gibi|siviceler|beze|iltihap|ilthap|komedi|sıvılcelen|sivilceler (yaptı|çıktı|çıkardı)|yüzüm(ü)? (sivilce|döküntü)'),
    'tahris': ('Yaktı, kızartı, kaşındırdı (tahriş)', 'Yanma ve kızarıklık yazılıyor!',
               r'yaktı|yakıyor|(?<!u)yandı|(?<!u)yanma|kızar|kaşın|kaşıntı|alerji|tahriş|batma|batıyor|acıt|yüzümü (yaktı|mahvetti)|kızarıklık|hassasiyet (yaptı|oldu)|yaqtı|soyul|pul pul|kabuk|kuruttu|cild\w* .{0,10}kurut|yüzümü kurut|kuruluk yaptı|gerginlik'),
    'kotulesme': ('Lekeleri ya da cildi kötüleştirdiğini yazıyor', 'Cildi kötüleştirdiğini yazanlar var!',
                  r'(leke|lekeler)\w* .{0,25}(belirginleş|koyulaş|arttı|artırdı|çoğal|kötüleş)|daha (da )?(kötü|belirgin)|koyulaştır|kararttı|karartı|azdırdı|esmerleştir|esmerlestir|cildimi (bitirdi|bozdu|mahvetti|kötüleştirdi)|cildim (mahvoldu|bozuldu|kötüleşti)|mahvoldu|mahvetti|maffetti|gözenek\w* .{0,20}(büyü|açıl|arttı|çıktı)|ters (etki|tepki)|tedaviye başla|dermatolo'),
    'bozuk': ('Rengi, kokusu, kıvamı bozuk geldi ya da bozuldu', 'Rengi ve kıvamı bozuk geliyor!',
              r'ren[kg]\w* .{0,25}(değiş|koyu|kahve|turuncu|farklı|sarar|kararmış|kopkoyu)|kahverengileş|koyulaştı|kararmış|okside|oksitlen|bozuk (gel|ürün)|bozulmuş|(?<!morelim )bozuldu|kıvam\w* .{0,20}(değiş|farklı|bozuk)|formül\w* .{0,20}değiş|eskisi gibi değil|eskisinden farklı|tortu|kesilmiş|bozuk ürün'),
    'koku': ('Kokusu ağır ya da kötü', 'Kokusu rahatsız ediyor!',
             r'koku\w* .{0,20}(kötü|ağır|berbat|berr|iğrenç|tuhaf|rahatsız|bulandır|keskin|sert|garip|leş|alkol|yoğun|ağır)|kötü kok|leş gibi kok|kokuyor|kokusu var|mide bulandır|kokusundan'),
    'doku': ('Yapışkan, su gibi, makyaj altında topaklanıyor', 'Dokusu yapışkan ya da cıvık!',
             r'yapış|su gibi|cıvık|sulu|yağlı (bir )?(his|bırak)|ele geliyor|topak|makyaj\w* .{0,25}(yapamı|yapışmıyor|topak|altında)|emilmiyor|emilmesi zor|beyaz iz|parlama yap|ağır (bir )?doku'),
    'miktar': ('Az geldi, çabuk bitti, şişe yarım', 'Şişe yarım ya da çok az geliyor!',
               r'yarım (şişe|geldi|dolu)|yarısı (boş|yok|dolu|kutuya)|şişe\w* .{0,25}(yarım|boş|yarısı|az)|serumun yarısı|az geldi|eksik geldi|eksikti|hemen bitti|çabuk bitti|çok çabuk bit|çok az|miktarı az|ml\w* .{0,10}az|boyu (baya )?küçük|küçücük|neredeyse yarım|doldurma|boş geldi|boşmuş|kısmı boş|yarım gibi|küçük geldi'),
    'bant': ('Ambalajı açık, bantsız ya da kullanılmış gibi geldi', 'Ambalajı açık ya da bantsız geliyor!',
             r'koruma band|bandı (yok|yoktu)|bantsız|bantsiz|güvenlik jelet|jelatin\w* (yok|yırtık|açık)|jelatinsiz|safety seal|mühür|ağzı açık|kapağı açık|kutu\w* .{0,15}(açık|açılmış)|açılmış|açık (halde|geldi|gelmiş|ulaştı)|kapalı kutu değil|kullanılmış|kullanılmış gibi|iade ürün|ikinci el'),
    'orijinal': ('Orijinal olmadığından şüphe ediyor', 'Orijinalliği sorgulanıyor!',
                 r'orijinal\w* (değil|mi|olmadığ)|orjinal\w* (değil|deyıl|deyil|mi|olmadığ)|sahte|çakma|taklit|replika|fake|(^| )uts( |$)|üts|karekod|barkod\w* .{0,15}(yok|çıkmadı|farklı)|doldurma ürün|güven vermiyor'),
    'hasarli': ('Kırık, akmış, kapağı ya da damlalığı eksik geldi', 'Şişe kırık ya da akmış geliyor!',
                r'kırık|kırıl|akmış|akıtmış|dökülmüş|döküldü|patlak|patlamış|sızdır|kapağı\w* .{0,15}(yok|kırık|gelmedi|yollama|yollamam|gönderilme|eksik)|kapağını yollam|damlalı\w* .{0,20}(yok|kırık|bozuk|çalışm|çekmiyor|eksik)|pipet\w* .{0,15}(yok|bozuk|kırık)|pompa\w* .{0,15}(çalışm|bozuk)'),
    'ambalaj': ('Şişe ya da damlalık kullanışsız', 'Şişesi kullanışsız!',
                r'damlalık\w* .{0,25}(kullanışsız|zor|çekmiyor|almıyor|kötü|yetersiz)|şişe\w* .{0,25}(kullanışsız|zor|zulüm|zulum|almak zor|kötü)|içinden almak|şişe bu şekilde|ambalaj\w* .{0,15}(kullanışsız|kötü)|cam şişe değil|dibinde kalıyor|sonuna kadar alam'),
    'yanlis': ('Yanlış ya da farklı ürün geldi', 'Yanlış ürün geliyor!',
               r'yanlış (ürün|renk|serum|gönder|geldi)|yanlışlıkla|başka (bir )?(ürün|asit|serum|renk)\w* (geldi|gönder|yolla)|farklı (bir )?(ürün|serum)\w* (geldi|gönder)|istememe rağmen|sipariş ettiğim\w* .{0,20}(değil|gelmedi)|gömdermissiniz|göndermişsiniz .{0,20}(yerine|başka)|istediğim halde|hiç gelmemiş'),
    'skt': ('Son kullanma tarihi yakın', 'Son kullanma tarihi yakın geliyor!',
            r'son kullanma|skt|miadı|tarihi (yakın|geçmiş|geçmek)|tarihi\w* .{0,15}(yakın|geçmiş|az kalmış)'),
    'hediye': ('Hediye ya da deneme ürünü gelmedi', 'Hediye beklentisi karşılanmıyor!',
               r'hediye\w* .{0,30}(yok|gelmedi|gelmemiş|göndermiyor|gönderilmedi|koyulmamış|koymamış|yollar|yollamamış|yazıyordu)|tester\w* .{0,20}(yok|koy|gönder|bile)|numune\w* .{0,15}(yok|koy|gönder)|yanına (bir |bı |bi )?hediye|hediyesi yok|hediye (göndermiyorsunuz|yok)|hediye gönderseydiniz|tester istedim|tester da 1'),
    'reklam': ('Reklama, fenomene ya da yorumlara güvenip hayal kırıklığı', 'Övgüler beklentiyi yükseltiyor!',
               r'influencer|fenomen|reklam|instagram|tiktok|youtuber|abartı|şişiril|şişirilmiş|şişirmiş|yorumlara (bakarak|güven|bakıp|inan|aldan|göre)|yorumlarda anlatıldığı|bu kadar (iyi |güzel )?yorum|övülmüş|övdükleri|öve öve|övünce|tavsiye\w* (ile|üzerine|ettiği) aldım .{0,40}(olmadı|yaramadı|etkisi|göreme)|diyenlere inan|popüler|para tuzağı|şişirme|yorum\w* güvenerek'),
    'boykot': ('Boykot ya da marka hakkındaki haberler yüzünden düşük puan', 'Boykot ve marka haberleri puanı düşürüyor!',
               r'boykot|boykut|israil|siyonist|filistin|gazze|çıkan haber|haberlerden sonra|dedikodu'),
    'fiyat': ('Fiyatına değmez', 'Fiyatına değmiyor!',
              r'paran\w* (yazık|çöp)|parama yazık|paraya (yazık|değmez)|boşa para|parasını hak|bu fiyata|fiyat\w* .{0,25}(değmez|pahalı|yüksek|fazla)|pahalı|kazık|para tuzağı|fiyatına göre|indirime girdi|fiyatı .{0,25}düştü'),
    'kargo': ('Kargo gecikti ya da ulaşmadı', 'Kargo gecikiyor!',
              r'kargo\w* .{0,30}(geç|kayıp|gelmedi|ulaşmadı|kötü|rezalet|ilgisiz|çalındı|değiştirin)|geç geldi|çok geç|ulaşmadı|elime ulaşmadı|ulasmsdı|not arrived|arived|teslim edilmedi|kurye|gün sonra (elime|geldi|ulaştı)|teslimat süresi|geç teslim|kolay gelsin (kargo|firması)'),
    'paket': ('Paketleme özensiz', 'Paketleme özensiz!',
              r'paketle\w* .{0,25}(kötü|özensiz|yetersiz|rezalet|berbat|sıfır|çok kötü)|özensiz (paket|kargo|gönder)|paketleme rezalet|poşet\w* .{0,10}(içinde|ile)|balonlu|kırılmaması için'),
}
OLUMLU = {
    'leke': ('Lekeleri açtı, ton eşitledi', r'leke\w* .{0,30}(açıl|açtı|azal|geçti|soldu|hafifle|iyi geldi|kayboldu|etkili)|ton\w* (eşitle|eşit)|cilt tonu|aydınlat|aydınlık|beyazlat'),
    'isilti': ('Parlaklık, canlılık verdi', r'parlak|parlaklık|ışıltı|ışıl|glow|canlı|canlandır|ışık saç|pırıl'),
    'nem': ('Nemlendirip yumuşattı', r'nemlendir|nem |yumuşa|yumuşacık|ipeksi|pürüzsüz|kuruluğ'),
    'sivilce': ('Sivilce, gözenek azaldı diyor', r'sivilce\w* .{0,30}(azal|geçti|kurut|iyi geldi|kalmadı|yok oldu|bitti)|gözenek\w* .{0,30}(küçül|sıkılaş|azal|kapan|iyi)|siyah nokta\w* .{0,30}(azal|geçti|iyi|temiz)|yağlanma\w* .{0,20}(azal|dengele)|akne\w* .{0,20}(azal|geçti)'),
    'doku': ('Hafif, çabuk emiliyor, yapıştırmıyor', r'hafif|emil|yapış(mıyor|kanlık yok|kan değil|tırmıyor)|kıvam|dokusu|akışkan|iz bırakm|yağlı his (bırakm|yok)'),
    'tekrar': ('Tekrar alıyor, yıllardır kullanıyor', r'ikinci|üçüncü|tekrar (al|sipariş)|yine aldım|yeniden aldım|yıllardır|sürekli kullan|vazgeçilmez|bitince|bitmeden|stok|kaçıncı|\d+\. (kez|kere|alış|şişe)'),
    'fiyat': ('Fiyatına göre iyi', r'fiyat|uygun|ucuz|indirim|performans|parasına|fp\b'),
    'paket': ('Özenli paket, hızlı kargo', r'paketle|paketlen|hızlı|kargo|özenli|sağlam geldi|güvenli'),
    'hediye': ('Hediye ya da deneme ürünü sevindirdi', r'hediye|tester|numune|deneme boy|minik|sürpriz'),
    'tavsiye': ('Tavsiye ya da sosyal medya ile aldı', r'tavsiye (üzerine|ile)|tavsiyesi|önerisiyle|önerisi üzerine|arkadaşım|instagram|tiktok|fenomen|influencer|youtube|videosu|reklam|dermatolog'),
}
# Sözlükte olmayan, notlar için ayrıca sayılan durumlar (oranlar tarayıcıda, aynı yöntemle)
EK = {
    'henuz': r'(henüz|daha) (kullanmadım|denemedim|kullanamadım|deneyemedim|yeni)|kullanınca (yorum|yaz|güncel)|kullandıktan sonra (yorum|yaz|güncel)|deneyip (yaz|yorum)|kullanıp .{0,20}(yaz|yorum|güncel)|yeni (aldım|başladım|ulaştı)|umarım (faydasını|işe yarar|memnun)|inşallah',
    'olumlu_metin': r'(çok |gayet |harika |mükemmel |güzel bir |iyi bir )(ürün|serum)|beğendim|bayıldım|memnun (kaldım|kaldik)|tavsiye ederim|harika|mükemmel|çok iyi|çok güzel',
}


def js_sozluk():
    J = lambda s: s.replace(r'\w', r'[\p{L}\d_]')
    return {'sikayet': {k: J(v[2]) for k, v in SIKAYET.items()}, 'olumlu': {k: J(v[1]) for k, v in OLUMLU.items()},
            'ek': {k: J(v) for k, v in EK.items()}}


if __name__ == '__main__':
    json.dump(js_sozluk(), sys.stdout, ensure_ascii=False)
