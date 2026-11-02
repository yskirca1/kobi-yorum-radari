# Şal konu sözlüğü ve oran hesabı. Ham dosyalar (rv_<urunId>.json) bu klasörde çalıştırılır: python3 analiz.py
# Not: Armine, Aker ve Modakaşmir Aya ürünleri uygulamanın tarayıcısında toplandı; oranları aynı sözlükle tarayıcıda
# hesaplandı (JS'de \w yerine [\p{L}\d_] ve 'u' bayrağı) ve sal_tarayici.json dosyasında duruyor.
import json, re, sys

DOSYALAR = {  # urunId: (kisa, marka, segment)
    '327241909': ('Armine Medine İpeği', 'Armine', 'Büyük marka'),
    '51132406': ('Armine Trend 2206', 'Armine', 'Büyük marka'),
    '778137757': ('Aker Elegance', 'Aker', 'Büyük marka'),
    '950221597': ('Modakaşmir Aya', 'Modakaşmir', 'Büyük marka'),
    '811110897': ('Modakaşmir Neo Pamuk', 'Modakaşmir', 'Büyük marka'),
    '944739275': ('Mira İpek Gül Desen', 'Mira İpek', 'KOBİ'),
    '968548196': ('Mira İpek İlham ps33', 'Mira İpek', 'KOBİ'),
    '973174379': ('Mira İpek Batik ps24', 'Mira İpek', 'KOBİ'),
    '468684489': ("Bambu Kraş 3'lü (Genel Markalar)", 'Genel Markalar', 'KOBİ'),
    '763220958': ("Organic Scarfs 3'lü", 'Organic Scarfs', 'KOBİ'),
    '211986804': ('Afvente Paisley', 'Afvente', 'KOBİ'),
    '366531659': ("Naciye Sultan 4'lü Penye", 'Naciye Sultan', 'KOBİ'),
}
TARAYICI = {'327241909', '51132406', '778137757', '950221597'}
RENKLER = r'(lacivert|mavi|kahve|kahverengi|siyah|bordo|gri|bej|pembe|kırmızı|krem|vizon|yeşil|mor|beyaz|pudra|karamel|çikolata)'
SIKAYET = {
    'renk': ('Renk görseldekinden farklı', 'Rengi fotoğraftaki gibi gelmiyor!',
             r'reng\w*.{0,40}(farklı|alaka|aynı değil|değil|soluk|açık|koyu|canlı değil|göründüğü gibi|gibi değil|uymuyor|beklediğim)|renkler\w* .{0,25}(gelmedi|farklı|alakasız|korkunç|kötü|vasat|aynı değil|umduğum)|(soluk|solgun) |canlı değil|canlı bir renk|ton\w* (tamamen )?farklı|' + RENKLER + r' (değil|gibi bi renk|gibi (bir )?renk)|gül kurusu gibi|asker yeşili|renkler\w* .{0,25}gibi değil|reng\w*.{0,30}gelmedi|grimsi|pastel renk değil|birbirinden farklı|renk dağılımı'),
    'yanlis': ('Yanlış ürün / renk gönderildi', 'Yanlış ürün ya da renk geliyor!',
               r'yanlış|yanlis|farklı (ürün|model|renk(te)?|renge) (gönder|geldi|yolla)|farklı olarak geldi|aynısı gelmedi|aynı (ürün|renkler) gelmedi|istediğim (ürün|şal|renk\w*) (gelmedi|değil)|başka (ürün|renk|bir ürün)|' + RENKLER + r' (yerine|istedim|istemiştim|diye|dediniz|sipariş)|yerine .{0,20}(gönder|yolla|gelmiş)|ikiside aynı geldi|alakası yok|gönderdiklerimi|renkleri göndermedi|alakasız (bir )?şal|alakası olmayan|gelen renge bakar|göndermişsiniz|göndernişsiniz|serisi değil|markası bunda yazmıyor'),
    'sentetik': ('Kumaş kötü: naylon, polyester', 'Pamuk yazıyor, naylon çıkıyor!',
                 r'naylon|polyester|polyestet|laykon|kumaş\w* (çok |inanılmaz )?kötü|kötü kumaş|berbat bir kumaş|kumaşı almayın|konforsuz|kumaşını iade|kumaşı yapısı|pamuk(lu)? değil|pamuk oranı az|sentetik|ipeksi bir dokusu yok|neo ?pamuk değil|likralı|kandır'),
    'kayiyor': ('Kayıyor, şekil almıyor', 'Kayıyor, şekil almıyor!',
                r'kay[ıa]n|kayıyor|kaygan|şekil almıyor|şekil al(mı|amı)|biçim almıyor|önü (yapılmıyor|şekil)|tok dur(m|mu)|dökümlü dur(m|mu)|kendini salıyor|rahat durm|güzel durmuyor|birbirine yapışıyor'),
    'ince': ('İnce / iç gösteriyor', 'Çok ince, iç gösteriyor!',
             r'ince|incecik|iç gösteriyor|transparan|şeffaf'),
    'sert': ('Sert, kalın, terletiyor', 'Kumaşı sert, kalın ve terletiyor!',
             r'sert|kalın|terlet|yakıyor|yazın (takmak|için uygun)|yazlık değil|ağır'),
    'defo': ('Defolu / lekeli / yırtık', 'Defolu, lekeli ya da yırtık geliyor!',
             r'defo|leke|yırtık|yirtik|delik|kusurlu|çekilmiş|ipi çekil|sökük|sökülüyor|ipliği sökül|çizgi|boya izi|kirli|deforme|kırık geldi|iğne izi|buruş|kullanılmış|yakılmış|hatalar var|süsü kırık|dikiş\w* (açıl|hata)|kenarları sökül|ipi (cekik|çekik|kaçmış)|iplikli|yanık|iplikleri sarkıyor|etiketi yoktu|iade ürün|toz ve pislik'),
    'baski': ('Baskı kalitesiz, desen farklı', 'Baskısı kalitesiz, deseni farklı!',
              r'baskı|baskısı|desen\w* .{0,20}(alakası|soluk|büyük|farklı|canlı değil|olmamış)|dijital baskı|yapmacık|desenleri çok kötü|deseni baskisi|desenleri .{0,20}hayal'),
    'yikama': ('Yıkayınca soluyor, tüyleniyor, boya veriyor', 'Yıkayınca soluyor, tüyleniyor!',
               r'yıka|yika|tiftik|tüylen|tüylü|soldu|solma|solmuş|boya veriyor|boya bırak|rengini attı|her yerim'),
    'olcu': ('Ölçü küçük / kısa / orantısız', 'Ölçüsü küçük ya da orantısız!',
             r'küçük|kısa|boyutu|enleri fazla|uzunluk|orantısız|kesimi'),
    'eksik': ('Eksik ya da gelmeyen ürün', 'Siparişteki ürün eksik geliyor!',
              r'paketin içinden çıkmadı|şal gelmedi|siparişim gelmedi|eksik|gönderilmesini rica|biri gelmedi|tanesi gelmedi'),
    'fiyat': ('Fiyatına değmez', 'Fiyatına değmiyor!',
              r'değmez|değmiyor|paraya yazık|paranız çöp|para(m)? boşa|kupon kullanmasam|bu fiyata değ|fiyatından dolayı|fiyatına değ'),
    'satici': ('İade, kargo, satıcı ilgisi', 'İade ve satıcı ilgisi zayıf!',
               r'kargo\w* (geç|ücreti)|geç veril|iade (edemiyorum|edemedim|ile uğraş|süreci)|iadeyle uğraş|ilgi alaka|arkasında durmuyor|ilginiz|değişim (yapmanızı|talep)|kargo (firması|poşet)|kayboldu|kaybetti|ulaşmadı|göndermediniz|ürünüm yok|paketle\w* özensiz|poşete bile|özen dikkat'),
}
OLUMLU = {
    'kalite': ('Kaliteli kumaş', r'kalite|kumaş\w* (çok |gayet )?(güzel|mükemmel|harika|iyi|kaliteli)|kumaşı mükemmel'),
    'yumusak': ('Yumuşak, hafif, rahat', r'yumuş|hafif|rahat'),
    'kaymaz': ('Kaymıyor, şekil alıyor', r'kaym|şekil al|biçim al|tok dur|bozulm|duruş|modeli hemen al'),
    'renk': ('Renkleri canlı ve güzel', r'reng|renk|canlı'),
    'gorsel': ('Görseldeki gibi geldi', r'görsel\w* gibi|fotoğraftaki|birebir|aynısı|göründüğü gibi|istediğim renkler|seçtiğim renkler|tam görsel'),
    'tekrar': ('Tekrar alıyor, diğer renklerini de aldı', r'ikinci|tekrar|yine|diğer (renk|seri|model)|bütün renk|her renk|hep buradan|\d+\. ?şal|set daha|stokl|bir sürü aldım|daha sipariş'),
    'hediye': ('Hediye / yakınına almış', r'hediye (olarak|aldım|almıştım|aldık)|anneme|annem|kuzen|arkadaşıma|eşime|kızım|doğum gün|kız kardeş'),
    'not': ('Satıcının notu / hediyesi', r'notunuz|not için|zarif not|not çok|hediyeler için|hediyeniz|hediye(si)? için teşekkür|tatlı not|notu'),
    'fp': ('Fiyat performans', r'fiyat|uygun|bu fiyata|indirim|ucuz'),
    'kargo': ('Hızlı kargo, özenli paket', r'kargo|paket|teslim|elime ulaştı|hızlı geldi'),
    'yazlik': ('Yazın rahat, terletmiyor', r'yazlık|yaz için|yazın|terletmiyor|serin'),
}

def tl(s): return s.replace('I', 'ı').replace('İ', 'i').lower()
def oran(liste, regex):
    if not liste: return 0.0
    rx = re.compile(regex)
    return sum(1 for r in liste if rx.search(tl(r['text']))) / len(liste)

if __name__ == '__main__':
    for uid, (kisa, *_) in DOSYALAR.items():
        if uid in TARAYICI: continue
        d = json.load(open(f'rv_{uid}.json'))
        neg, top = d['neg'], d['top']
        s = {k: round(oran(neg, v[2]), 2) for k, v in SIKAYET.items()}
        o = {k: round(oran(top, v[1]), 2) for k, v in OLUMLU.items()}
        hic = sum(1 for r in neg if not any(re.search(v[2], tl(r['text'])) for v in SIKAYET.values()))
        print(kisa, 'neg', len(neg), 'konusuz', hic, '\n  S', {k: v for k, v in s.items() if v}, '\n  O', o)
    if len(sys.argv) > 1:
        for uid in DOSYALAR:
            if uid in TARAYICI: continue
            for r in json.load(open(f'rv_{uid}.json'))['neg']:
                if not any(re.search(v[2], tl(r['text'])) for v in SIKAYET.values()) and len(r['text']) > 25: print(uid[:3], r['stars'], r['text'][:100])
