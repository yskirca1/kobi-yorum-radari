# Bebek arabası konu sözlüğü. Ürünlerin tamamı Claude uygulama tarayıcısında toplandı (12 Kasım 2026); oranlar bu sözlükle
# tarayıcıda hesaplandı (JS'de \w yerine [\p{L}\d_] ve 'u' bayrağı). Özetler: bebek_tarayici.json
# `python3 analiz.py` sözlüğü tarayıcıya gönderilecek JSON olarak yazar.
import json, sys

DOSYALAR = {  # urunId: (kisa, marka, segment)
    '823617305': ('GB Pockit Plus Kabin, siyah', 'Cybex', 'Büyük marka'),
    '299365998': ('Maxi-Cosi Lara2 Kabin, grafit', 'Maxi-Cosi', 'Büyük marka'),
    '292890141': ('Maxi-Cosi Lara2 Kabin, siyah', 'Maxi-Cosi', 'Büyük marka'),
    '761256359': ('Unal Two Koalas Keten Gold', 'Unal', 'KOBİ'),
    '112066554': ('Diamond Baby Sapphire Antrasit', 'Diamond Baby', 'KOBİ'),
    '52643125': ('Tommybaby Tornado Plus Antrasit', 'Tommybaby', 'KOBİ'),
    '751940568': ('Tommybaby Luppo Baston', 'Tommybaby', 'KOBİ'),
    '98385275': ('4 Baby Esse Gold Travel Sistem', '4 Baby', 'KOBİ'),
    '98387892': ('4 Baby Olympus Gold Kahve', '4 Baby', 'KOBİ'),
    '469834144': ('4 Baby Drone Sky Kabin', '4 Baby', 'KOBİ'),
    '56991712': ('Bebegold Travel Sistem', 'Bebegold', 'KOBİ'),
    '57697838': ('Baby Home BH-945 Paris Travel', 'Baby Home', 'KOBİ'),
}
SIKAYET = {
    'teker': ('Tekerlekler dönmüyor, zor sürülüyor', 'Tekerlekleri zor dönüyor!',
              r'teker|fren|zor (gidiyor|sürül|dönüyor|ilerl)|sürüş\w* .{0,20}(zor|rahatsız|kötü)|sürerken zorlan|nereye çekersen|yön (ver|dön)|gitmiyor|ilerlemiyor|yere değmiyor|havada|amortisör\w* .{0,15}(yok|kötü|çalışm)'),
    'kirilma': ('Kısa sürede kırıldı, bozuldu', 'Kısa sürede bozuluyor!',
                r'kırıl|kiril|bozuldu|bozulmaya|yamul|(?<!d)eğil(di|ip|iyor)|parçalara ayrıl|dağıldı|koptu|vidası çıktı|çatla|\d+ (ay|hafta|gün)\w* (sonra|içinde|olmadan|kullan|dayan)|dayanmadı|dayanıksız|ömrü|paramparça|elimde kaldı|çöpe attım|çöp oldu'),
    'koku': ('Ağır plastik ya da kimyasal kokusu', 'Ağır kokusu var!', r'koku|kokuyor'),
    'hasarli': ('Kırık, defolu, kullanılmış gibi geldi', 'Kusurlu ya da kullanılmış ürün geliyor!',
                r'(kırık|kirik|yırtık|yirtik|yamuk|ezik|eğri|çizik|çizil|lekeli|sökük|delik|kirli|tozlu|bozuk|arızalı|hatalı|hatali|zedelen|deforme)\w* .{0,20}(geld[iı]|gönder|çıktı|ulaştı|vardı|var\b|halde|şekilde)|defolu|deformeli|kusurlu|hasarlı|kullanılmış|kullanilmis|ikinci el|teşhir|yanık izi|çizikti|kontrol edilme|kontrol etmeden|kalite kontrol'),
    'kilit': ('Katlama ve kilit mekanizması sorunlu', 'Katlanıp açılması sorunlu!',
              r'kilit|kitlen|katlan\w* .{0,20}(zor|olmuyor|sorun|sıkıntı)|katlaması zor|kapanmıyor|açılmıyor|zor açıl|zor kapan|açılması .{0,20}zor|açıp kapa\w* .{0,20}(zor|imkan)|tutukluk|mekanizma'),
    'guvenlik': ('Bebek içindeyken katlandı, devrildi', 'Bebek içindeyken katlanıyor ya da devriliyor!',
                 r'içindeyken .{0,20}(katlan|kapan|geri at)|kendiliğinden (kapan|katlan)|kendi kendine (kapan|katlan|sal)|devril|tepe ?takla|düşüyordu|düşmüş|düştü|düşme tehlike|düşecek gibi|hastanelik|güvenli değil|tehlike|az kalsın'),
    'eksik': ('Eksik parça geldi', 'Parçası eksik geliyor!',
              r'eksik|göndermemiş|gönderilmemiş|yollamamış|sepet\w* (yok|gelme|eksik)|eşya koyma gözü yok|(çanta|ana ?kucağı|puset|yağmurluk|cibinlik|tente|minder)\w* .{0,15}(gelmedi|yok|çıkmadı)'),
    'kalitesiz': ('Kalitesiz, dandik malzeme', 'Malzemesi kalitesiz!',
                  r'kalitesiz|kalıtesız|kalite\w* .{0,15}(düşük|kötü|yok|iyi değil|sıfır)|kaliteli (bir şeye benzemiyor|değil)|dandik|dandık|hurda|çürük|plastik\w* .{0,15}(ince|kötü|iyi değil|dandik|kalitesiz)|basit|vasat|oyuncak gibi|ucuz malzeme|yan sanayi|sağlam de[ğg]il|saglam degil|dayanıklı de[ğy]il|kaliteli (hiç )?de[ğg]il|kaliteli bi[sş]i? beklemeyin|zayıf'),
    'konfor': ('Bebek için rahatsız, kayıyor, tam yatmıyor', 'Bebek rahat etmiyor!',
               r'konfor|bebe\w* .{0,25}(rahat değil|rahatsız|kayıyor|sığmıyor|düşüyor|terl)|içinde kayıyor|kayıyor|yere (çok )?yakın|tam yatmıyor|yatmıyor|dik duruyor|sırt\w* .{0,15}(dik|sert)|emniyet kemer|kemer\w* .{0,15}(takıl|kısa|kilit)|minder\w* .{0,15}(ince|sert)|dar geldi|çok dar|ürün çok dar|sığmıyor|zor sığıyor|oturma yeri .{0,20}(sığ|küçük)|çok küçük|ayak (uzatma|desteği)\w* .{0,20}(yok|olmadı)|rahat edeme'),
    'agir': ('Ağır, hantal, yer kaplıyor', 'Ağır ve hantal!',
             r'ağır|hantal|yer kaplıyor|bagaj\w* .{0,15}(sığm|girm)|asansör\w* .{0,10}(sığm|girm)|taşıması zor|kaldırması zor|büyük ve'),
    'tente': ('Tente, kumaş, çıtçıt sorunu', 'Tente ve kumaşı dayanmıyor!',
              r'tente|güneşlik|kumaş\w* .{0,20}(ince|sert|yırt|kalitesiz|söküldü|soluk)|çıtçıt|fermuar|dikiş|yırtıl|boya\w* .{0,15}(söküldü|soyul|kalk)|rengi soluk'),
    'kurulum': ('Kurulum karışık, kılavuz yok', 'Kurulumu karışık!',
                r'kurulum|kurulu[sş]|kılavuz|klavuz|talimat|kullanım kılavuz|nasıl (takıl|kapan|kurul|katlan|açıl)|monte|takılmıyor|yerine oturmuyor|oturtmuyor|yerinden çıkıyor'),
    'yanlis': ('Yanlış ürün / renk, görseldeki gibi değil', 'Görseldeki gibi gelmiyor!',
               r'yanlış|yanliş|farklı (bir )?(ürün|renk|model)|rengi farklı|başka renk|görsel\w* .{0,20}(alakası|ilgisi|değil|farklı)|göründüğü gibi değil|gösteren gibi gelme|resimdeki gibi de[ğy]il|fotoğraf\w* .{0,20}(alakası|farklı|değil|gibi değil)|alakası yok|alakasız|sahte|orijinal değil|başka marka|farklı (bir )?marka|markası farklı|ayrı marka|mimma|gelen ürün farklı|farklı ürün geldi|renk göndermiş|renk gönderdin|başkasına ait|böyle gelmedi|istedi[ğg]im gibi gelmedi|(siyah|lacivert|kırmızı|gold|kahve|gri)\w* .{0,25}(almama rağmen|sipariş ettim|aldım|istedim)[^.]{0,30}(gönder|geldi)'),
    'bilgi': ('İlandaki bilgi tutmadı (çift yön, hediye, ölçü)', 'İlandaki bilgi tutmuyor!',
              r'çift yön\w* .{0,40}(değil|deniliyor|dediler|dediniz|diyorsunuz)|tek yönlü (çıktı|kullanıl|olması)|hediye\w* .{0,30}(yok|gelmedi|gelmemiş|demiştiniz|diyor)|yağmurluk\w* .{0,30}(yok|gelmedi|gelmemiş|olması gerek)|(ağırlık|kg)\w* .{0,30}belirtilmiş|ebeveyn penceresi var dedi|soru.?cevap|videodaki haliyle|fotoğrafta var'),
    'puset': ('Puset / ana kucağı parçası sorunlu', 'Travel sistemin puseti sorunlu!',
              r'puset\w* .{0,40}(oturm|sallan|kırık|kirik|dandik|sorun|kullanışsız|kullanılsız|tutmuyor|oynuyor|zorladı|uygun değil|fiyasko|etmez|işe yaramıyor|sabitlenmiyor|bozuk|kolu kırıldı)|ana ?kucağı\w* .{0,30}(oturm|kırık|sorun)|portbebe'),
    'satici': ('Satıcı ilgilenmiyor, parça ve iade sorunu', 'Satıcı ve servis desteği zayıf!',
               r'satıcı\w* .{0,30}(ilgilen|cevap|dönüş|yazdım|ulaşam|özensiz)|ilgilenmiyor|ilgilenmedi|ilgilenirseniz|ilgilenirmisiniz|dönüş (olmadı|yapmadı|sağlanmadı)|tedarik (yapmıyor|edilmedi|edemiyor)|parça (sat|bul|gönder|istiyorum)|yedek parça|servis|garanti|muhattap|cevap ver(il)?miyor|ileti ?şim kur|ilgisi 0|bakmadılar'),
    'kargo': ('Kargo gecikti, kapıya getirmedi', 'Kargo gecikiyor!',
              r'kargo\w* .{0,30}(geç|kayıp|kayb|getirmedi|getirmeden|teslim (etmedi|edemiyor)|rezalet|felaket|şube)|geç geldi|gün sonra getirdi|teslim edil(di|miş) görün|didn.t receive|kapıya (kadar )?(getirme|teslim edeme)|sürat kargo|aras kargo|yukarı (çıkar|taşı)|apartman\w* (giriş|altına)|kapıya (bile )?çıkarma|aşağıda bırak|teslı?[iı]m ed[iı]ld[iı] (diye|görün)|gün sürdü'),
    'fiyat_dusus': ('Aldıktan sonra fiyatı düştü', 'Aldıktan hemen sonra fiyatı düşüyor!',
                    r'fiyat\w* .{0,25}(düştü|düşüyor|değiş|manipüle)|bine (düş|aldığım)|\d+ ?(bin|tl|₺)\w* .{0,30}(düştü|düşüyor|olmuş|indirim)|indirim (mi )?yaptınız|indirim oranı aldatıcı|tl indirim|tepeden sat|balon indirim|sonra fiyatı düştü'),
    'paket': ('Paketleme özensiz', 'Paketleme özensiz!',
              r'paketle\w* .{0,20}(kötü|özensiz|yetersiz|sıfır|rezil)|paketleme sıfı|özensiz paket|kutu\w* .{0,15}(yırtık|ezik|parçalan|açık)|koli\w* .{0,10}(yırtık|ezik)|poşet'),
    'fiyat': ('Fiyatına değmez', 'Fiyatına değmiyor!',
              r'paran\w* (yazık|çöp)|parama yazık|paraya (yazık|değmez|günah)|parasını (hak|hakket)|bu parayı haket|parayı hak|verdiğ\w* paraya|fiyat\w* .{0,25}(değmez|göre .{0,15}(değil|kötü|pahalı)|pahalı|yüksek)|pahalı|kazık|fazla ver|üzerine koyup|fazla verip'),
    'yorum': ('Yorumlara güvendi, hayal kırıklığı', 'Yorumlar beklentiyi yükseltiyor!',
              r'yorumlara (bakarak|güven|göre)|yorumları okuyarak|yorumlardaki|bu kadar iyi yorum|neden bu kadar iyi yorum|yorum öne çıksın|yorumun (gözükmesi|görünmesi)'),
}
OLUMLU = {
    'saglam': ('Sağlam, kaliteli', r'sağlam|saglam|kaliteli|kalitesi|dayanıklı|sapasağlam'),
    'hafif': ('Hafif, kolay katlanıyor', r'hafif|katlan|kompakt|pratik|tek elle|kolay kapan|kolay açıl|küçücük'),
    'surus': ('Rahat sürülüyor, tekerlekleri iyi', r'sürüş|rahat (gidiyor|sürül|ilerl)|teker|amortisör|yumuşak gidi|kolay sürül|manevra|kayar gibi'),
    'bebek_rahat': ('Bebek rahat ediyor, tam yatıyor', r'bebe\w* .{0,30}(rahat|uyuyor|sevdi|mutlu|bayıldı)|tam yat|yatar|geniş|uyuyor|uyudu|konforlu'),
    'kabin': ('Uçağa, bagaja sığıyor', r'kabin|uçak|uçağ|bagaj|seyahat|tatil|araba\w* .{0,10}(sığ|bagaj)'),
    'set': ('Set içeriği (çanta, ana kucağı, puset)', r'çanta|ana ?kucağı|portbebe|travel|set|beşik|yağmurluk|cibinlik|ayak örtüsü'),
    'tasarim': ('Şık görünüyor', r'şık|güzel duruyor|görünüş|tasarım|renk|reng|gold|asil|havalı|duruşu'),
    'cift_yon': ('Çift yönlü kullanım', r'çift yön|iki yön|ters (çevir|kullan)|yüz yüze|bana bak|yönü değiş'),
    'fiyat': ('Fiyatına göre iyi', r'fiyat|uygun|ucuz|fp|performans|parasına|indirim'),
    'paket': ('Özenli paket, hızlı kargo', r'paketle|paketlen|hızlı|kargo|özenli|sağlam geldi|kutu'),
    'hediye': ('Hediye aldı (torun, yeğen)', r'hediye|torun|yeğen|kardeşime|kardeşim için|gelinime|kızıma aldım'),
}


def js_sozluk():
    J = lambda s: s.replace(r'\w', r'[\p{L}\d_]')
    return {'sikayet': {k: J(v[2]) for k, v in SIKAYET.items()}, 'olumlu': {k: J(v[1]) for k, v in OLUMLU.items()}}


if __name__ == '__main__':
    json.dump(js_sozluk(), sys.stdout, ensure_ascii=False)
