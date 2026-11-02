"""Filtre kahve: kahve_tarayici.json (tarayıcıda hesaplanan özetler) -> data/filtre-kahve.json"""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU

AD = {
    '788858071': 'Tchibo Gold Selection Filtre Kahve 4x250 g',
    '52915799': 'Tchibo Profesional Special Filtre Kahve 4x250 g',
    '55413395': 'Kahve Dünyası 4\'lü Filtre Kahve 1 kg',
    '266883471': 'Kahve Dünyası Fındık Aromalı Filtre Kahve 250 g',
    '37634572': 'Jacobs Selection Filtre Kahve 250 g, 4 al 3 öde',
    '80275104': 'Starbucks Veranda Blend Öğütülmüş Kahve 200 g',
    '111624445': 'Moliendo House Blend Öğütülmüş Filtre Kahve 250 g',
    '79828858': 'Bongardi 5\'li Dünya Kahveleri Seti 5x200 g',
    '274717174': 'Addis Ababa Etiyopya 3\'lü Deneme Seti 3x250 g',
    '75552664': 'Anisah Bolivar Daily Öğütülmüş Filtre Kahve 2x500 g',
    '46534796': 'Anisah Dünya Filtre Kahveleri Tanışma Seti 5x250 g',
    '151430407': 'Anisah Aromalı Filtre Kahve Seti (vanilya, fındık, karamel) 3x250 g',
    '825973627': 'Anisah Organik Decaf Kafeinsiz Filtre Kahve 250 g',
}
DIKKAT = {
    '788858071': ['En sık şikâyet patlak ya da vakumu kaçmış paket (%26); naylon poşete sarılıp gönderildiği yazılıyor.',
                  'Son kullanma tarihi yakın gelme (%15) ve hava almış, bayat kahve (%11) şikâyeti var.',
                  'Ürünü 29 farklı satıcı satıyor; sorunların çoğu satıcının paketlemesinden.'],
    '52915799': ['Olumsuz yorumların %59\'u son kullanma tarihinden: 4\'lü pakette tarihine 2-3 ay kalmış kahve geliyor.',
                 '"1 kg kahveyi 2 ayda nasıl bitireyim" şikâyeti sık; tarih yakınken açılan paket bayat bulunuyor.'],
    '55413395': ['Son kullanma tarihi yakın gelme %27, patlak paket %22.',
                 'Eksik paket (%10) ve kargo gecikmesi (%10) yazılıyor; ürünü 20 satıcı satıyor.'],
    '266883471': ['Son kullanma tarihi yakın gelme %33; "tarihine 20 gün kalan ürün" örnekleri var.',
                  'Fındık kokusu güzel ama tadında fındık olmadığı, "suni" olduğu yazılıyor (%19).',
                  'French press seçilip ince çekilmiş kahve gelmesi gibi öğütme hatası var (%6).'],
    '37634572': ['En sık şikâyet patlak paket (%32) ve hava almış kahve (%15).',
                 '"Marketten aldığım tadı alamadım" diyenler var.'],
    '80275104': ['1-2 yıldız oranı %17,8 ile kategorinin en yükseği; olumsuzların %37\'si son kullanma tarihinden.',
                 'Kahvenin değiştirildiği, orijinal olmadığı şüphesi yazılıyor (%11). Ürünü 27 satıcı satıyor.'],
    '111624445': ['Olumsuz yorumların yarısından fazlası tattan (%54): "aroma yok", "su gibi", "hafif".',
                  '"Bu kadar övülmesine şaşırdım" diyerek yorumlara güvenip hayal kırıklığı yaşayanlar var.'],
    '79828858': ['Tat şikâyeti %34; setteki bazı çeşitlerin beğenilmediği yazılıyor.',
                 'Görseldeki çeşitlerden farklı kahve gelmesi (%9) ve makineye uymayan ince öğütme (%5) var.'],
    '274717174': ['Tat şikâyeti %44: "orta kavrulmuş olanı bile fazla kavrulmuş, acı ve ekşi".',
                  'Kavrumun homojen olmadığı yazılıyor.'],
    '75552664': ['Az olumsuz yorum (27); çoğu tattan (%41): "aroma ve kokusu hiç yok".',
                 'Eksik ve patlak paket gönderimi yazılıyor.'],
    '46534796': ['Az olumsuz yorum (17); tat şikâyeti %35: "hepsi aynı tat, aroma gelmiyor".'],
    '151430407': ['Az olumsuz yorum (17); tat şikâyeti %47: "ilaç tadı", "kahveyle alakası yok".'],
    '825973627': ['1-2 yıldız oranı %15,9; kafeinsiz kahve "inanılmaz ekşi" bulunuyor (tat %39).',
                  'Çekirdek istenip öğütülmüş gelmesi ya da espresso makinesine uymaması gibi öğütme sorunu %11.'],
}
DERS = {
    '788858071': ['Kahvenin kendisi seviliyor (önerilen yorumların %38\'i "yıllardır içiyorum"); puanı satıcının paketlemesi düşürüyor.'],
    '52915799': ['Büyük marka kahvede bile müşteri tarihi kontrol ediyor; tarihi yakın stoğu 4\'lü paketle satmak 1 yıldızın 1 numaralı sebebi.'],
    '55413395': ['Marka güveni yüksek (önerilen yorumların %34\'ü sadık müşteri); ama tarih ve paket sorunu ürüne değil satıcıya bağlı.'],
    '266883471': ['Aromalı kahvede koku satışı getiriyor (%35 kokuyu övüyor), ama tat kokunun gerisinde kalınca "suni" yorumu geliyor.'],
    '37634572': ['"4 al 3 öde" kampanyası hacmi artırıyor; tek koliye konan 4 paket kargoda patlıyor.'],
    '80275104': ['Az satılan büyük marka ürünü raf ömrünün sonunda satılıyor; tarih şikâyeti en yüksek oranlardan.'],
    '111624445': ['KOBİ kahvesinde tarih ve paket sorunu neredeyse hiç yok; şikâyetin tamamı damak tadında toplanıyor.'],
    '79828858': ['Deneme seti hediye ve paketlemeyle övülüyor (%40 hediyeden söz ediyor); setteki her çeşidin tat profili net yazılmalı.'],
    '274717174': ['"Orta kavrum" yazan pakette kavrum tutarlılığı önemli; farklı partide farklı kavrum yorumlara hemen yansıyor.'],
    '75552664': ['Günlük kahvede KOBİ fiyat avantajıyla seçiliyor; tat beklentisi düşük tutulursa şikâyet de az.'],
    '46534796': ['Tanışma seti çeşit merakıyla satılıyor (%22); çeşitler arasında fark hissedilmezse hayal kırıklığı geliyor.'],
    '151430407': ['Aromalı kahvede "suni tat" riski yüksek; aroma oranını ve şekersiz olduğunu açıkça yazmak beklentiyi doğru kurar.'],
    '825973627': ['Kafeinsiz kahvede ekşilik en büyük risk; kavrum derecesi ve asidite ilanda yazılmalı.'],
}
ONERILER = [
    ('KOBİ\'nin rakibi damak tadı: tadı net anlat',
     'KOBİ kahvelerinde olumsuz yorumların %{tat_kobi}\'ü tattan ("aroma yok", "su gibi", "ekşi"); büyük markalarda bu oran %{tat_buyuk}. Tat beklentisi kişiye göre değiştiği için kavrum derecesini, asiditeyi, gövdeyi ve tat notalarını ilanda açıkça yazmak doğru müşteriyi getirir.'),
    ('Taze kahve en güçlü kozun',
     'Büyük markalarda olumsuz yorumların %{skt_buyuk}\'u son kullanma tarihinden; Tchibo Profesional\'da %59. KOBİ\'lerde bu oran %{skt_kobi}. Kavrum tarihini paketin üstüne ve ilana yazmak, KOBİ\'nin büyük markaya karşı en kolay farkı.'),
    ('Paketi kargoya dayanıklı yap',
     'Büyük marka kahvelerde patlak ve vakumu kaçmış paket şikâyeti %{paket_buyuk} (Jacobs %32, Tchibo Gold %26). Naylon poşete konan 4\'lü paketler kargoda patlıyor. Kutu, balonlu naylon ve valfli paket bu şikâyeti bitirir; KOBİ\'lerde paket şikâyeti yalnızca %{paket_kobi}.'),
    ('Öğütmeyi müşteriye sor, doğru öğüt',
     'Öğütme şikâyeti %{ogutme}: French press seçen müşteriye ince çekim, çekirdek isteyene öğütülmüş kahve gidiyor. Demleme yöntemine göre öğütme seçeneği sunmak ve siparişte doğru öğütmek iade sebebini ortadan kaldırır.'),
    ('Yorum beklentisini yönet',
     'KOBİ kahvelerinde olumsuz yorumların %{yorum_kobi}\'i "yorumlara güvenip aldım, hayal kırıklığı" diyor. Çok sayıda 5 yıldız beklentiyi yükseltiyor; tat profilini dürüst anlatmak ve küçük deneme paketi sunmak bu hayal kırıklığını azaltır.'),
    ('Deneme seti ve hediye kapıyı açar',
     'Deneme ve tanışma setleri çeşit merakıyla satılıyor; Bongardi\'nin önerilen yorumlarının %40\'ı, Addis Ababa\'nınkilerin %31\'i hediyeden (klips, Türk kahvesi) söz ediyor. Yeni müşteri için küçük gramajlı set iyi bir giriş ürünü.'),
]


def p(v): return f'{round(v * 100):d}'


def main(out):
    B = json.load(open('kahve_tarayici.json'))
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
    v = {'tat_kobi': p(w(kobi, 'tat')), 'tat_buyuk': p(w(big, 'tat')), 'skt_buyuk': p(w(big, 'skt')), 'skt_kobi': p(w(kobi, 'skt')),
         'paket_buyuk': p(w(big, 'paket_hasar')), 'paket_kobi': p(w(kobi, 'paket_hasar')), 'ogutme': p(w(U, 'ogutme')), 'yorum_kobi': p(w(kobi, 'yorum'))}
    print('öneri rakamları', v, file=sys.stderr)
    cat = {'id': 'filtre-kahve', 'ad': 'Filtre kahve', 'ust': 'Gıda', 'toplama': '2 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['filtre kahve', 'kahve', 'öğütülmüş kahve', 'çekirdek kahve', 'french press', 'kahve seti', 'aromalı kahve', 'yöresel kahve'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)


main(sys.argv[1])
