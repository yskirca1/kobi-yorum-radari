# Kamp sandalyesi konu sözlüğü. Ürünlerin tamamı Claude uygulama tarayıcısında toplandı (12 Kasım 2026); oranlar bu sözlükle
# tarayıcıda hesaplandı (JS'de \w yerine [\p{L}\d_] ve 'u' bayrağı). Özetler: kamp_tarayici.json
# `python3 analiz.py` sözlüğü tarayıcıya gönderilecek JSON olarak yazar.
import json, sys

DOSYALAR = {  # urunId: (kisa, marka, segment)
    '816485347': ('Quechua Katlanır Mavi', 'Decathlon', 'Büyük marka'),
    '816491110': ('Quechua XL Bej 150 kg', 'Decathlon', 'Büyük marka'),
    '1047715589': ('Koçtaş Deluks Ekru', 'Koçtaş', 'Büyük marka'),
    '1117395473': ('Koçtaş 2\'li Kamp Sandalyesi', 'Koçtaş', 'Büyük marka'),
    '129882972': ('Moniev Natura 2\'li Siyah', 'Moniev', 'KOBİ'),
    '208518948': ('Moniev Natura 2\'li Gri', 'Moniev', 'KOBİ'),
    '655222185': ('Moniev Litus Şezlong Gri', 'Moniev', 'KOBİ'),
    '70777674': ('Goocamp XL Kalın Profil Mavi', 'Goocamp', 'KOBİ'),
    '121658522': ('Shadow Katlanabilir Lacivert', 'Shadow', 'KOBİ'),
    '43151156': ('Hastunç Katlanır Siyah', 'Hastunç', 'KOBİ'),
    '899676379': ('Eksiksepeti 2\'li Mavi', 'Eksiksepeti', 'KOBİ'),
    '836348315': ('Funky Chairs Tenteli Haki', 'Funky Chairs', 'KOBİ'),
}
SIKAYET = {
    'kirilma': ('Kısa sürede kırıldı, yamuldu', 'Kısa sürede kırılıyor, yamuluyor!',
                r'kırıl|kiril|korıld|yamul|(?<!d)eğil(di|ip|iyor)|büküld|büküle|bükülüyor|bükülme|çöktü|çökme|koptu|kopmaya|ikiye ayrıl|patladı|parçalan|paramparça|dağıldı|darmadağın|söküldü|pert|çöp oldu|çöpe (git|att)|deforme oldu|dayanıksız|dayaniksiz|dayanmadı|ömrü|çürüdü|çatlıyor|çat diye|bu hale gel|şu hale|demiri çıktı'),
    'kumas': ('Kumaşı yırtıldı, dikişi attı', 'Kumaşı çabuk yırtılıyor!',
              r'yırtıl|yirtil|yırtıldı|yırttım|dikiş\w* .{0,15}(at|açıl|söküldü|koptu|hata)|dikişleri|kumaş\w* .{0,20}(ince|yırt|kalitesiz|ayrıl|incel)|bant\w* .{0,10}(kop|ince)|ipleri? kop|bezinde|astarı'),
    'hasarli': ('Kırık, yamuk, lekeli, kusurlu geldi', 'Kusurlu ürün gönderiliyor!',
                r'(kırık|kirik|yırtık|yirtik|yamuk|ezik|ezilmiş|eğri|eyri|eğik|çizik|çizil|lekeli|sökük|delik|kesik|kirli|tozlu|bozuk|kopuk)\w* .{0,20}(geldi|gönder|çıktı|ulaştı|vardı|var\b|halde|şekilde)|defolu|defo |defoları|kusurlu|hasarlı|kullanılmış|teşhir|kalite kontrol|kontrol edilme|kontrol etmeden|deforme ürün|çok çizik|çatlamış|hatal[ıi] (geldi|gönder)|yırtık|yirtik'),
    'rahatsiz': ('Rahat değil, sırtı ve beli ağrıtıyor', 'Oturumu rahat değil!',
                 r'rahat değil|rahat olduğunu söyleyemem|rahatsız|konfor sıfır|çok konforlu değil|bel\w* (ağr|kısmı)|belimi|sırt\w* .{0,20}(dik|kambur|ağr)|arkaya yatmıyor|acıttı|ense (bölümü|kısmı)|ensem|oturma yerleri? .{0,15}(acıt|sert)|çok sert|bacağı\w* (kes|çiz)|kesip yara|kesiyor|çiziyor'),
    'kucuk': ('Küçük, dar, çocuk boyu', 'Göründüğünden küçük!',
              r'küçük|kucuk|ufak|ufacık|minicik|çocuk (sandalyesi|şezlongu|şezlongu)|çocuklar için|çoçuk sandalyesi|bebe sandalyesi|oyuncak g|cüce|dar oturum|çok dar|bana dar|boyuma|boyutları'),
    'kilo': ('Kilosunu yazarak şikâyet ediyor', 'Normal kilodaki kullanıcı bile şikâyetçi!',
             r'\d{2,3} ?(kg|kilo)|kiloyum|kilolu|kiloyu|kilo hesab|kilo üzeri|kiloma|iri bi'),
    'kapaniyor': ('Kendiliğinden kapanıyor, dengesiz, düşürüyor', 'Kendiliğinden kapanıp düşürüyor!',
                  r'kendiliğinden kapan|aniden kapan|birden (açıl|kapan|yatar)|ayakları? .{0,15}kapan|kapanıyor|oturmadan katlan|kilit\w* (yok|sistemi)|kitlenmiyor|düşürdü|düşürebil|düştüm|düşme|yere (çakıl|düş)|dengesiz|denge\w* (dur|yok)|sallanıyor|yeri basmıyor|düz durmuyor|dik durmuyor|sabit (kal|dur)m|kayıyo|kaydığı|tehlike|dik konuma gelmiyor|sandalye olarak kullanılmıyor'),
    'yanlis': ('Yanlış ürün / renk / model geldi', 'Yanlış ürün ya da renk geliyor!',
               r'yanlış|yanliş|farklı (bir )?(ürün|renk|model)|farkli renk|rengi farklı|rengini far|renk\w* farklı|aynı renk değil|başka renk|ren kılıf|(mavi|ekru|gri|lacivert|bordo|siyah|kırmızı|krem)\w* (aldım|istedim|sipariş|diye)\w*.{0,30}(geldi|gönder)|görsel\w* .{0,20}(alakası|ilgisi|değil|gibi gelmedi|farklı)|fotoğraf\w* .{0,20}(alakası|farklı|değil)|resim\w* .{0,15}alakası|alakası yok|alakasız|tamamen farklı|ucuz olan bir model|masa geldi|minder gönder|buz aküsü|sahte|(renk|rengi)\w* (aldım|istedim|diye)[^.]{0,30}(geldi|gönder)|gelen ürün farklı|fotoğrafta[^.]{0,30}gözüküyor|görsel\w* gibi .{0,15}gelmiyor'),
    'eksik': ('Eksik parça / adet geldi', 'Parçası ya da adedi eksik geliyor!',
              r'eksik|göndermemiş|göndermedi|gönderilmemiş|yollamamış|bardaklı\w* (yok|gelme|çıkma|gönderilme)|bardak konulan yerini|\d (adet|tane) (geldi|teslim)|birini göndermiş|bir tanesi gönderildi|biri gelmedi|kolsuz|çantası? olmama|çantası olama|(iki|bir|\d) (ürün|adet|tane) teslim|diğer(ini|i| ürünü)\w* gönder|yastık .{0,15}çıkmadı'),
    'bardaklik': ('Bardaklık ve kol plastikleri dandik', 'Plastik parçaları dandik!',
                  r'bardaklı|bardak (tut|koy)|plastik|kol (dayama|koyma|destek)|kolları?\w* .{0,20}(kırıl|eğil|tutmuyor|ayrıl|düşüyor|sün)|kol yerleri'),
    'pas': ('Paslanıyor, boyası soyuluyor', 'Paslanıyor, boyası kalkıyor!',
            r'pas(lan|landı|landığı| içinde)|paslı|boya\w* .{0,20}(kalk|soyul|çıkmış|kavla|zedele|eksik|soluk)|soyulmuş|kavla|çürüdü'),
    'kalitesiz': ('Kalitesiz, dandik malzeme', 'Malzemesi kalitesiz!',
                  r'kalitesiz|kalıtesız|kalite\w* .{0,15}(iyi değil|düşük|kötü|yetersiz|0\b|beğenme|sıfır)|kaliteli (bir ürün )?değil|kaliteli gibi duruyor ama|sağlam değil|dandik|\badi\b|basit|zayıf|oyuncak gibi|yan sanayi|çok kaba|incecik|demirleri? (çok )?ince'),
    'agir': ('Ağır, çok yer kaplıyor, kurması zor', 'Ağır ve hantal!',
             r'ağır|kütük gibi|yer kaplıyor|yer kapladı|sığdır|taşıması? .{0,10}(zor|rahat değil)|açılımı zor|kurulum|kurarken|sert açılıyor|açabiliyorsunuz'),
    'paket': ('Özensiz paket, poşetle gönderilmiş', 'Paketleme özensiz!',
              r'paketle\w* .{0,20}(kötü|özensiz|yetersiz|zayıf|sıfır|irenç|rezil|yapılmamış)|özensiz|poşet|naylon|streç|kutusuz|ambalaj|pat ?pata sar|koli yırtık|kutuya (koy|kon)'),
    'kargo': ('Kargo gecikti, ulaşmadı', 'Kargo gecikiyor!',
              r'kargo\w* .{0,30}(geç|kayıp|kayb|getirmedi|teslim(atını)? (etmedi|yapmadı)|felaket|rezalet|başka yere|yukarı|nerde)|geç geldi|çok geç|geciktir|teslim edil(di|miş) görün|elime (geçmedi|ulaşmadı)|bana (gelmedi|ulaşmadı)|sürat kargo|\d+ günde (zor |teslim)|kötü kargo|kotu kargo|kargoydu'),
    'fiyat': ('Fiyatına değmez, markettekinden farksız', 'Fiyatına değmiyor!',
              r'paran\w* (yazık|çöp)|parama yazık|paraya (yazık|değmez|günah)|parasını (hak|hakket)|parayı hak|paranın (hakkı|karşılığı)|fiyat\w* .{0,25}(düştü|değmez|karşılığı değil|pahalı|yüksek|değil)|indirim(e gir| yapma)|yarı fiyat|pahalı|kazık|ındırım|\d+ ?tl\b|\bbim\b|bimde|bimden|a101|migros|3 harfli|zincir market|marketlerde|ucuz marketlerin'),
    'yorum': ('Yorumlara güvendi, hayal kırıklığı', 'Yorumlar beklentiyi yükseltiyor!',
              r'yorumlara (bakarak|güven|göre)|yorumlara da bakarak|yorumları okusaydım|yorumlardaki|bu kadar kişinin beğen|herkes iyi yazm|yorumları satın'),
}
OLUMLU = {
    'rahat': ('Rahat, konforlu', r'rahat|konfor'),
    'saglam': ('Sağlam, kaliteli', r'sağlam|saglam|kaliteli|kalitesi|dayanıklı|dayanakl|sapasağlam'),
    'hafif': ('Hafif, kolay katlanıyor ve taşınıyor', r'hafif|taşın|taşıması kolay|pratik|katlan|açma kapama|yer kaplamıyor|portatif'),
    'bardaklik': ('Bardaklık, yan sehpa kullanışlı', r'bardak|sehpa|aparat|cep'),
    'fiyat': ('Fiyatı uygun', r'fiyat|uygun|ucuz|fp|performans|parasına|paraya değer|indirim'),
    'paket': ('Özenli paket, hızlı kargo', r'paketle|paketlen|hızlı|kargo|özenli|sağlam geldi|kutu'),
    'yer': ('Balkon, bahçe, piknik, plaj', r'balkon|bahçe|piknik|kamp|sahil|plaj|deniz|mangal|tatil|mutfa'),
    'hediye': ('Ailesine / hediye aldı', r'hediye|annem|babam|anneme|babama|eşime|kayınvalide|annemi'),
    'ibadet': ('Namaz, cami, umre için', r'namaz|cami|umre|mekke|medine|hac\b'),
    'tekrar': ('Uzun süredir kullanıyor, tekrar aldı', r'tekrar|ikinci|bir tane daha|yıllardır|\d (yıl|sene)dır|senedir|aylardır|uzun süre|daha önce kullandığım'),
    'gorsel': ('Görseldeki gibi, şık', r'görsel\w* gibi|resimdeki|resimle|aynısı|göründüğü gibi|şık|tatlı|renk|reng'),
}


def js_sozluk():
    J = lambda s: s.replace(r'\w', r'[\p{L}\d_]')
    return {'sikayet': {k: J(v[2]) for k, v in SIKAYET.items()}, 'olumlu': {k: J(v[1]) for k, v in OLUMLU.items()}}


if __name__ == '__main__':
    json.dump(js_sozluk(), sys.stdout, ensure_ascii=False)
