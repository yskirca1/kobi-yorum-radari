# Bluetooth kulaklık konu sözlüğü ve oran hesabı. Ham dosyalar (rv_<urunId>.json) bu klasörde çalıştırılır: python3 analiz.py
import json, re, sys

DOSYALAR = {  # urunId: (kisa, marka, segment)
    '728117603': ('Redmi Buds 4 Lite', 'Xiaomi', 'Büyük marka'),
    '855229283': ('Redmi Buds 6 Play beyaz', 'Xiaomi', 'Büyük marka'),
    '855229295': ('Redmi Buds 6 Play siyah', 'Xiaomi', 'Büyük marka'),
    '761318970': ('Huawei FreeBuds SE 2', 'Huawei', 'Büyük marka'),
    '143889066': ('Favors Dots E6s', 'Favors', 'KOBİ'),
    '314585747': ('Favors Pro', 'Favors', 'KOBİ'),
    '233129679': ('Abbruch Pro 5', 'Abbruch', 'KOBİ'),
    '661738189': ('Barbanti Air 2', 'Barbanti', 'KOBİ'),
    '672471753': ('Barbanti Pro', 'Barbanti', 'KOBİ'),
    '218495477': ('Teknoloji Gelsin', 'Teknoloji Gelsin', 'KOBİ'),
    '666158167': ('Trktech Pro 5 Plus', 'Trktech', 'KOBİ'),
    '819066262': ('Tarçın Air Pro 2', 'Tarçın', 'KOBİ'),
}
SARJ = r'(şarj|sarj|şarz|sarz|jarz|şarji|şarjı|şarzı)'
SIKAYET = {
    'pil': ('Şarj çabuk bitiyor', 'Şarjı çabuk bitiyor!',
            SARJ + r'\w*.{0,40}(bit|tüken|tukan|tutmuyor|dayanm|gitmiyor|düşüyor|az gid|yetmiyor|%10|10 at)|(çabuk|hızlı|hemen|tez|aniden).{0,12}(bit|tüken)|\d+ ?(dakika|dk|saat).{0,25}(şarj|sarj|bit|gidiyor|tutuyor|dayan)|pil ömrü|batarya|\d+ saat (jarz|şarj|sarj)'),
    'sarj': ('Şarj olmuyor / şarj almıyor', 'Şarj olmuyor, şarj almıyor!',
             SARJ + r'\w* ?(olmuyor|olmuyo|almıyor|almıyo|alm[ıi]yor|etmiyor|edilmiyor|olmasi|almadı|dolmuyor|almama)|şarj (yeri|girişi)|şarj edemiyor|kulaklıkları şarj etmiyor'),
    'bozulma': ('Kısa sürede bozuldu', 'Kısa sürede bozuluyor!',
                r'bozul|bozuk|bozyk|arıza|arzalı|ses gelmiyor|kutu\w* (kapağı|dandik)|defolu|kusurlu|ariza|çalışmıyor|calismiyor|çalışmadı|çalışmamaya|çalışmıyo|ömrü|dayanmadı|çöp oldu|cöpe|(\d+|bir|iki|üç|birkaç|bi) ?(gün|hafta|ay)\w* ?(sonra|olmadan|dolmadan|içinde|oldu|kullandım|dayan|götür)|gittikçe|kırıldı|patladı|ışığı yanm|ışık yanm|ışığıda yanm|paranparça|çatladı'),
    'tek': ('Tek taraf çalışmıyor', 'Tek tarafı çalışmıyor!',
            r'tek (taraf|kulak|kulaklık)\w* (çalış|ses|bağlan)|teki (bozul|çalışm|yok)|(sağ|sol) (kulak|taraf)\w*|bir tarafı|bir tarafından|tek tarafı|biri(nden)? (çalışmıyor|ses gelmiyor|sesgelmiyor|bozuk)|birinin|ses dengesiz|daha az ses|tek kulaktan'),
    'baglanti': ('Bağlantı kopuyor', 'Bağlantı kopuyor, ses kesiliyor!',
                 r'bağlan|baglan|bağlantı|baglanti|kopuyor|kopma|kopuyo|koptu|kesint|ses (gidip|kesil|gidiyor|sürekli gidiyor)|sesi kesil|bluetooth.{0,20}(at|kes|kop|problem|zayıf|sorun)|blootuth|eşleş|tanımla|bulamıyor|görmedi|gecikme|duraksı|duraksiyo|tekliyor|kendi kendine (kapan|tıklı)'),
    'ses': ('Ses az, boğuk, cızırtılı', 'Sesi az, boğuk ya da cızırtılı!',
            r'ses\w* (çok |biraz |gayet |oldukça )?(az|kısık|düşük|kötü|boğuk|zayıf|yetersiz|seviyesi (baya )?düş)|sesi az|az ses|cızırt|cizirt|boğuk|ses kalitesi (kötü|sıfır|zayıf|beklediğim|oldukça zayıf|ortanın altında|10 üzerinden)|(?<!\w)bim|kasa yanında|ucuz kulaklık|bit pazar|dışarı(ya)? (cok |çok )?(veriyor|ses)|dışarıdaki sesler|dışardan çok rahat|sesi dışarı|ses kalitesi beklendiğinden|istediğim ses|ses kalitesi beklemeyin|ses (seviyesi|yüksekliği)\w* (yetersiz|çok düşük|düşük|sonda)|ses (çok )?az geliyor|ses kalitesi (düşük|berbat|iyi değil)|sesi (iyi değil|çıkmıyor|fulde|o kadar da)|ses çıkmıyor|çapaklanma|bass?\w* (sistemide )?(çok )?kötü|duymakta sıkıntı|duymak zor|dışarı (çıkıyor|aktarıyor)|dışarının seslerini|dsarının|kulağın içine içine|yüzde 60|ses (kılmaya|kısılmaya)|ses daha iyi olabilirdi|yanında konuşan|ses performansı'),
    'mikrofon': ('Mikrofon / telefon görüşmesi', 'Görüşmede karşı taraf duymuyor!',
                 r'mikrofon|görüşme|gorusme|konuşurken|konusurken|konuşma|aradığım|arama yap|karşı taraf|karşıya|karsi taraf|karsı taraf|efendim|sesim (boğuk|gitm)|beni duy'),
    'kulak': ('Kulağa oturmuyor, acıtıyor', 'Kulağa oturmuyor, acıtıyor!',
              r'oturmuyor|oturmadı|kulağa (büyük|hiç)|kulaktan (sık sık |sık )?düş|kulağımda durm|kulakta durm|düşüyor|acıt|ağrı|uyuşma|rahatsız|kaba|filler için|kulağım küçük|büyük geldi|kulak\w* (oturma|durm)|fırladı|kulağımdan düş|kulakta (ta )?(zor )?duruyor|aşırı büyük|yara yaptı|ısınma'),
    'vaat': ('Yazan özellik yok', 'İlanda yazan özellik yok!',
             r'özellik|yanıltıcı|gürültü engelleme.{0,25}(yok|seçeneği|düzgün)|anc.{0,25}(yok|düzgün|çalışm)|flaş|işitme|şarjı gözükmüyo|şarj detayları|şarjı ne kadar|anlatıldığı gibi|gürültü engelle\w*.{0,25}(yok|hikaye)|\d+ saat diyor'),
    'farkli': ('Farklı / sahte ürün geldi', 'Farklı ya da sahte ürün geliyor!',
               r'farklı ürün|başka (alt )?marka|alt markası|görseldeki ürün gelmedi|yanlış (ürün|gönder)|yanlış göndermiş|power geldi|sahte|çakma|orijinal değil|orjinal değil|önceki(lerden| modellerden) farklı|ilk aldığımla alakası|aldığımla alakası|3pro gelmiş|değişik geldi|farklı değişik|önceden .{0,30}daha iyiydi|geçen sene aldığım'),
    'eksik': ('Eksik parça / kablo yok', 'Kutudan kablo ya da parça eksik çıkıyor!',
              r'(kablo|şarj aleti|şarj kablosu|kablosu)\w* (çıkmadı|çıkmamış|çıkmamıştır|yok|gelmedi|bozuk|koymamak|alınmış)|kablosuz geldi|pedler? yok|kılavuz yok|kılıf.{0,25}(gönderme|yok|mor renk)|teki yok|eksik|kutunun içine|kablo gönderiyor o da bozuk|bozuk şarj kablosu|kutusu açık|paket açılmış|kenarını delip|olmadan yollamış|çıkmaması|şarj (aleti|cihazı|kablosu)\w* (çıkmıyor|yok)|şarj aletini|şarjı çıkmadı|gondermeyi unut|yanında gelmedi|kulaklık çıkmadı|kıllar ile|etiketleri olur'),
    'iade': ('İade ve garanti sorunu', 'İade ve garanti zor!',
             r'iade\w* (kabul|etmedi|etmediler|yapmadı|yatırıl|alınmadı|reddet|edilmedi)|iadem kabul edilmedi|garanti\w*.{0,30}(red|gönderemiyorum|nasıl|vermiyor|sağlamıyor|yok|desteği)|param\w* (yatırıl|gitti|iade edilmiyor)|para iadesi yapmadılar|ilgilen(m|miyor)|cevap (ver|yok)|bakmıyolar|tüketici|hakem|değişim yap(m|mı)|15 gün geçmiş|yardım hattı|reddedildi|red geldi|onaylanmam|tamir için gönderim kabul'),
    'dokunmatik': ('Dokunmatik sorunlu', 'Dokunmatiği sorunlu!',
                   r'dokunmati|dokunma(?!dan)|tıklıyor|kafamı çevirince'),
    'yorum': ('Yönlendirilmiş yorum şüphesi', 'Yorumlar hediyeyle yönlendiriliyor!',
              r'(yukarı|üst|üste|üstte)\w* (çık|görün)|görünmesi için|okunsun diye|hediye ver\w*.{0,30}(yorum|yaz)|güzel yorum yaptır|gerçek yorum|(5|beş) (yıldız|puan) ver\w*.{0,40}(diye|için)|yorumlar\w* (aldan|inan|bakarak)|yorumlara inanıp|bilerek beş yıldız|yorumlarda gördüm|keşke yorumları okusaydım'),
    'fiyat': ('Fiyatına değmez', 'Fiyatına değmiyor!',
              r'değmez|değmiyor|paraya yazık|paranıza yazık|parama yazık|paranız boşa|para (vermeyin|harcamayın)|bu fiyata alınmaz|ederi değil|üstüne biraz (daha )?koyun|(\d{3}) ?(tl|₺).{0,25}(daha|boşa|verip)|200,300 daha|verdiğimiz paraya|bu fiyata daha iyi|bu fiyatada alınmaz|bu fiyatada alinmaz|daha iyilerini|indirime gir|pink tax|pahalı'),
    'kargo': ('Kargo gecikmesi / özensiz paket', 'Kargo gecikiyor, paket özensiz!',
              r'kargo.{0,30}(geç|yavaş|kötü|hafta)|geç geldi|ezilmiş|paketleme (kötü|idare)|\d+ haftada geldi|kargom|kargo da sıkıntı'),
}
OLUMLU = {
    'ses': ('Ses kalitesi iyi', r'ses|bas(?!k)|tiz'),
    'pil': ('Şarjı uzun gidiyor', SARJ + r'|pil'),
    'fp': ('Fiyat performans', r'fiyat|(?<!\w)fp(?!\w)|f/p|uygun|bu fiyata|parasının|parasını'),
    'kargo': ('Hızlı kargo, özenli paket', r'kargo|paket|hızlı (geldi|teslim|ulaştı|bir şekilde)|teslimat|gün(de|ünde| içinde| içerisinde) (geldi|elime|ulaştı|hemen)|elime ulaştı'),
    'satici_hediye': ('Satıcının hediyesi (kılıf vb.)', r'hediye(si|niz|ler|leriniz)?\w* (için|içinde|içinde de|kılıf|kahve|de)|hediyeniz|hediyesiyle|hediye kılıf|kılıf hediye|kılıf(ı|ta|ınız|ına|için|da gelmiş| için)|yanında .{0,20}(kılıf|hediye)|iki hediye|hediye kahve'),
    'hediye_alim': ('Hediye / sevdiğine almış', r'hediye (olarak|aldım|almıştım|aldim)|eşime|esime|sevgilim|oğlum|oğluma|kızım|kızıma|kardeşim|kardeşime|annem|anneme|babam|babama|erkek arkada|doğum gün|anneannem|çocuklarım|yeğen'),
    'mikrofon': ('Görüşmede ses net', r'mikrofon|konuşurken|konusurken|konuşma|görüşme|karşı(ya| taraf)|karsi taraf'),
    'baglanti': ('Kolay bağlanıyor, uyumlu', r'bağlan|baglan|bağlantı|uyumlu|iphone|ios|tanımla'),
    'rahat': ('Kulakta rahat', r'rahat(?!lık)|kulaktan düşmüyor|kulağa otur|hafif|rahatsız etmiyor|kulakta durmuyor değil'),
    'dayaniklilik': ('Uzun süredir sorunsuz', r'(\d+|bir|iki|üç|dört) ?(ay|yıl|sene)\w* ?(dır|dir|oldu|kullan|geçti)|aylardır|yıllardır|uzun (zaman|süre)(dır|dir| önce)|hala|hâlâ|sorunsuz'),
    'orijinal': ('"Orijinaline benziyor" diyor', r'orijinal|orjinal|birebir'),
}

def tl(s): return s.replace('I', 'ı').replace('İ', 'i').lower()
def oran(liste, regex):
    if not liste: return 0.0
    rx = re.compile(regex)
    return sum(1 for r in liste if rx.search(tl(r['text']))) / len(liste)

if __name__ == '__main__':
    for uid, (kisa, *_) in DOSYALAR.items():
        d = json.load(open(f'rv_{uid}.json'))
        neg, top = d['neg'], d['top']
        s = {k: round(oran(neg, v[2]), 2) for k, v in SIKAYET.items()}
        o = {k: round(oran(top, v[1]), 2) for k, v in OLUMLU.items()}
        hic = sum(1 for r in neg if not any(re.search(v[2], tl(r['text'])) for v in SIKAYET.values()))
        print(kisa, 'konusuz', hic, '\n  S', {k: v for k, v in s.items() if v}, '\n  O', o)
    if len(sys.argv) > 1:
        for uid in DOSYALAR:
            for r in json.load(open(f'rv_{uid}.json'))['neg']:
                if not any(re.search(v[2], tl(r['text'])) for v in SIKAYET.values()) and len(r['text']) > 30: print(uid[:3], r['stars'], r['text'][:105])
