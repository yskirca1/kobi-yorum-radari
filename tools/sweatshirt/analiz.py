# Sweatshirt konu sözlüğü ve oran hesabı. Ham dosyalar (rv_<urunId>.json) bu klasörde çalıştırılır: python3 analiz.py
import json, re, sys
from collections import Counter

DOSYALAR = {  # urunId: (kisa, marka, segment)
    '777723073': ('Tudors', 'Tudors', 'Büyük marka'),
    '338581269': ('Madmext', 'Madmext', 'Büyük marka'),
    '343388614': ('Modagen', 'Modagen', 'KOBİ'),
    '466787620': ('Altamira', 'Altamira', 'KOBİ'),
    '839417686': ('Grimelange', 'Grimelange', 'KOBİ'),
    '856685071': ('Trendgar', 'Trendgar', 'KOBİ'),
}
BEDEN = r'(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|small|medium|large)'
SIKAYET = {
    'tuylenme': ('Tüylenme / tiftiklenme', 'Tüyleniyor, tiftikleniyor!',
                 r'tüy|t[ùu]yler|dokùlme|kirletiyor|renk veriyor|difdi|türerdi|kat kat iz|tifti|tifdi|tifsir|tülen|tüler|tüğlen|tuy|pamukla|pamukçuk|pamukcuk|pamuk (dök|bırak)|topak|topuk topuk|püspül|pütür|puturlu|piling|pörtl|portl|tos topl|yün(ler)? (bırak|dök|çık|topl)|yünler|polar parçacık|toz (bırak|şeklinde)|içinden .{0,15}dökül|hap kadar'),
    'dar': ('Kalıp dar / küçük', 'Kalıbı dar, küçük geliyor!',
            r'(?<!\w)dar(?!\w)|küçük (geldi|oldu|geliyo|durdu)|çok küçük|aşırı küçük|kücük|ufak|kalıbı küçük|kalıpları .{0,15}küçük|crop gibi|düdük|kısa (geldi|oldu)|(bir|1|iki|2|en az 2) (boy|beden) büyük al|büyük (alın|alınmalı|söyle)|en büyük bedeni|küçüktü|bir büyüğünü|(1|bir|bi) bu?üyük beden|beden bu?üyük al|çok kısa|boyu kısa|boyu kisa|(xl|l) (beden )?(aldım|almama|sipariş|giyiyorum).{0,40}(s|m|xs) (beden )?(gibi|boyut)'),
    'bol': ('Kalıp bol / büyük', 'Çok bol, çuval gibi duruyor!',
            r'(?<!beden )(?<!bir )çok büyük|aşırı büyük|büyük (geldi|oldu|duruyor|durdu|kalıp)|beklediğimden büyük|(?<!\w)bol(?!\w)|çuval|emanet gibi|battaniye|içinde kayboldum|uzun geldi|aşırı uzun|çok geniş|küçük (alın|alınmalı|söylen)|xs söylemen|aşırı oversize|fazla oversize|çok oversize|büyükçe geldi|yanlara genis|(small|s|xs) (beden )?(aldım|almama).{0,30}(xl|l) gibi'),
    'yanlis': ('Yanlış beden / ürün gönderildi', 'Yanlış beden ya da ürün geliyor!',
               BEDEN + r'( beden)? ?(istedim|istemiştim|söyledim|sipariş|aldım|almama|verdim|istedik).{0,45}(geldi|gönder|yolla|getir)|yanlış (beden|ürün|gönder)|başka (bir )?ürün|farklı ürün|ürün yanlış|bedenler(i)? gelmedi|beden gelmedi|beden karışık|beden kaydır|alakasız.{0,20}(geldi|değişmiş)|gömlek|etek|kazak alaka|3 değişik beden|farklı farklı geldi|' + BEDEN + r'( beden)? (göndermiş|gelmiş|yollamış)|beden yanlış|yanlis|baska (bir )?urun|gonderil|give me|büyük beden gönder|beden büyük yollamış|' + BEDEN + r' gelmiş|' + BEDEN + r' yollamış|bedenden geldi|marka farklı|farklı (bir )?marka|başka (bir )?marka|warn|etiketi? (bile )?farklı|madmext yazmıyo|kırmızı geldi|bej gelmiş'),
    'cekme': ('Yıkayınca çekiyor', 'Yıkayınca çekiyor, küçülüyor!',
              r'çekti|çekme|çekiyor|cekiyor|ceker|çeker|küçüldü|küçülüyor|ufaldı|kısacık kaldı|kısalıyor|makinada .{0,20}cekti'),
    'renk': ('Renk görseldekinden farklı', 'Rengi görseldeki gibi değil!',
             r'reng\w*.{0,40}(farklı|koyu|açık|soluk|alaka|aynı değil|değil|diğil|kötü|attı|beklediği|sarı|krem|kahve|puturlu)|(koyu|açık|soluk) (geldi|gri|tonda)|renk(te)? (aynı|farklı)|aynı renk gelmiyor|ne tonu|açık gri|krem bildiğimiz|baya sarı|sarardı|koyu yeşil|füme değil|dümdüz beyaz'),
    'gorsel': ('Görseldeki gibi değil', 'Fotoğraftaki gibi gelmiyor!',
               r'göründüğü.?gibi değil|fotoğraftaki gibi gelmedi|göründü gibi değil|gözüktüğü gibi değil|göründüğü gulibi|gözüktuguyle|göründüğünden|görsel\w* .{0,30}(alaka|değil|gibi değil|farklı|oranla)|fotoğraf\w* .{0,40}(alaka|değil|farklı)|foto\w* (gibi değil|alaka|ile alaka)|fotoyla alaka|resimde\w* gibi (değil|durm)|resimdeki gibi değil|mankende\w* gibi (değil|durm)|alakası (yok|bile yok)|aynısı (değil|gelmedi)|aynı değil|bambaşka|resimlerde .{0,30}gözüküyor'),
    'ince': ('İnce / kalitesiz kumaş', 'Kumaşı ince, kalitesiz!',
             r'ince(?!le)|kalitesiz|kalitesini beğenmedim|kaliteli gelmedi|kaliteli (bir ?şey|birşey) değil|kalitesi farklı|aynı kalitede|yıpran|eskidi|kullandıkça kötü|tok durmuyor|farklı kumaş|kalite(si)? (kötü|orta|düş|beklemeyin|vasat|tartışılır)|kötü kumaş|kumaş\w* (kötü|sağlam değil|iyi değil|kalitesiz|farklı|sert)|naylon|polyester|iki iplik|kalın değil|kalın bir şey değil|pofuduk|şardon|kalın bi sweat beklemeyin|dandik|ucuz dur|evde giy|pijama|toz bezi'),
    'oversize': ('Oversize değil', 'Oversize yazıyor ama değil!',
                 r'oversize?\w* ?(değil|olmadı|degil|durmuyor|da değil|felan olduğu yok)|oversizde|salaş durmuyo|düz kalıp|düz kesim|regular kesim|asla oversize|oversize olduğunu düşünmenizin'),
    'defo': ('Defolu / lekeli / yırtık geldi', 'Defolu, lekeli ya da yırtık geliyor!',
             r'defo|leke|yırtık|yirtik|sökük|söküklük|delik|kusurlu|hasarlı|çizik|deforme|kirinden|fondeten|portlandı|ipleri gelmedi|iplikleri çıkmış|yazısı silinmiş|kırışık geldi|sigara kokuyor|saç çıktı'),
    'dikis': ('Dikiş, fermuar, yaka, kol', 'Dikiş, fermuar ve yaka sorunlu!',
              r'dikiş|fermuar|fermanlı|yaka|lastik|ribana|manşet|kol\w* (kısa|uzun|dar|arasında)|boğaz|bilek|pot dur|yamuk|kolları kısa|ön cepleri'),
    'kargo': ('Kargo gecikmesi / eksik ürün', 'Kargo gecikiyor, eksik geliyor!',
              r'kargo|geç (geldi|ulaştı)|gün sonra|günde (geldi|elime|verildi)|hafta(dır| sonra)|sevkiyat|teslimat|günler sonra|hediye paketi|1 tane (yollamışlar|geldi)|1 tanesi gelmiyo|eksik (geldi|olarak|ürün)|paket içinde gelmedi|2 tane gönderm|iade(m|niz)? (alındı|yapilmadi|edilmiyor)|param yatırılmadı|inceleniyor'),
    'fiyat': ('Fiyat / değmez / zam', 'Fiyatına değmiyor, zam geliyor!',
              r'fiyat\w* (göre değil|değil|abartı|birden|zam|düştü|farkı|ı hak)|zam (yaptı|gelmiş)|pahalı|değmez|etmez|indirim (olmasaydı|yaptınız)|paranıza yazık|parama yazık|paraya yazık|para(m)? boşa|tl düştü|fiyatını arttır|fiyatını hakettiğini|bu fiyata asla|pazarlarda|abartılıyor'),
}
OLUMLU = {
    'kalite': ('Kaliteli kumaş', r'kalite|kumaş\w* (çok |da |gayet )?(güzel|iyi|mükemmel|harika|kaliteli|sağlam|bayıl)|kumaşına bayıl|(?<!s)tok(?!\w)|sağlam'),
    'sicak': ('Yumuşak ve sıcak tutuyor', r'yumuş|yumoş|sıcacık|sicacik|sıcak tut|sicak tut|sıcak bir|polar|ısıt|kalın|kışlık|kış ayı'),
    'beden': ('Beden tam oldu', r'tam (oldu|beden|bedenim|kalıp|istediğim)|kendi bedeni|bedenini al|bedeninizi al|tam bedeninizi|bedenime göre|cuk oldu|tam geldi|uygun oldu'),
    'boykilo': ('Boy, kilo ve beden yazmış', r'\d{2,3} ?(boy|kilo|kg|cm)|(boy|boyum|kilom|kiloyum) ?\d{2,3}|1[.,]\d{2} ?(boy)?|\d{3} ?/ ?\d{2}'),
    'hediye': ('Hediye / sevdiğine almış', r'sevgili|eşime|esime|eşim için|kocam|nişanlı|erkek arkada|kardeş|oğlum|oğluma|kızım|kızıma|kızlarım|hediye|annem|babam|abime|yeğen|yiğen'),
    'renk': ('Rengi güzel', r'reng|renk'),
    'fp': ('Fiyat performans', r'fiyat|(?<!\w)fp(?!\w)|f/p|parasını|parasının|uygun|bu fiyata'),
    'kargo': ('Hızlı kargo, özenli paket', r'kargo|paket|hızlı geldi|çabuk ulaştı|elime ulaştı|hızlı (bir sekilde|şekilde) elime|kısa (bi |bir )?sürede|kısa zamanda|teslimat'),
    'gorsel': ('Görseldeki gibi geldi', r'göründüğü gibi|resimdeki gibi|fotoğraftaki (gibi|ile aynı)|fotoğraftakiyle .{0,10}aynı|görseldeki(yle)? (gibi|aynı)|sayfadaki gibi|mankendeki gibi oldu|aynısı|tıpatıp|birebir'),
    'salas': ('Salaş / oversize duruşu', r'oversi?ze?|overisze|oversiz|salaş|salas|bol (dursun|durdu|oldu|ve güzel|sevenler)|dökümlü'),
}

def tl(s): return s.replace('I', 'ı').replace('İ', 'i').lower()
def oran(liste, regex):
    if not liste: return 0.0
    rx = re.compile(regex)
    return sum(1 for r in liste if rx.search(tl(r['text']))) / len(liste)

if __name__ == '__main__':
    for uid, (kisa, *_ ) in DOSYALAR.items():
        d = json.load(open(f'rv_{uid}.json'))
        neg, top = d['neg'], d['top']
        s = {k: round(oran(neg, v[2]), 2) for k, v in SIKAYET.items()}
        o = {k: round(oran(top, v[1]), 2) for k, v in OLUMLU.items()}
        hic = sum(1 for r in neg if not any(re.search(v[2], tl(r['text'])) for v in SIKAYET.values()))
        print(kisa, 'neg', len(neg), 'konusuz', hic, '\n  S', s, '\n  O', o)
    if len(sys.argv) > 1:  # konusuz olumsuz yorumları göster
        for uid in DOSYALAR:
            for r in json.load(open(f'rv_{uid}.json'))['neg']:
                if not any(re.search(v[2], tl(r['text'])) for v in SIKAYET.values()): print(uid[:3], r['stars'], r['text'][:110])
