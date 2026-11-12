"""Bebek arabası: bebek_tarayici.json (tarayıcıda hesaplanan özetler) -> data/bebek-arabasi.json"""
import json, re, sys
from analiz import DOSYALAR, SIKAYET, OLUMLU

AD = {
    '823617305': 'Cybex GB Pockit Plus Kabin Boy Bebek Arabası, kadife siyah',
    '299365998': 'Maxi-Cosi Lara2 Otomatik Katlanan Kabin Boy Bebek Arabası, Essential Graphite',
    '292890141': 'Maxi-Cosi Lara2 Otomatik Katlanan Kabin Boy Bebek Arabası, Essential Black',
    '761256359': 'Unal Two Koalas Keten Gold Çift Yönlü Bebek Arabası, antrasit',
    '112066554': 'Diamond Baby Sapphire Çift Yönlü Bebek Arabası, antrasit',
    '52643125': 'Tommybaby Tornado Plus Gold Alüminyum Çift Yönlü Bebek Arabası, antrasit',
    '751940568': 'Tommybaby Luppo Tam Yatar Baston Bebek Arabası, siyah',
    '98385275': '4 Baby Esse Gold Travel Sistem Bebek Arabası, antrasit',
    '98387892': '4 Baby Olympus Gold Çift Yönlü Bebek Arabası, kahve',
    '469834144': '4 Baby Drone Sky Kabin Boy Bebek Arabası, siyah',
    '56991712': 'Bebegold Çift Yönlü Travel Sistem Bebek Arabası, gold siyah',
    '57697838': 'Baby Home BH-945 Paris Amortisörlü Travel Sistem Bebek Arabası, gold kahve',
}
DIKKAT = {
    '823617305': ['1-2 yıldız oranı %21,3: büyük marka olmasına rağmen kategorinin yüksek oranlarından.',
                  'Olumsuz yorumların %31\'i bebeğin rahat etmemesinden: oturma yeri sığ, ayak desteği yok, bebek aşağı kayıyor.',
                  'Aldıktan kısa süre sonra fiyatın 2-3 bin TL düştüğü şikâyeti %17; tekerleklerin taşlı ve engebeli yolda zorlandığı da yazılıyor (%17).',
                  '"Önerilen" ilk 100 yorumda 4 tane 1-2 yıldızlı yorum var (kategoride en fazla).'],
    '299365998': ['Olumsuz yorumların %17\'si oturma yerinin dar olduğundan: 9 kg bebeğin zor sığdığı, alt sepetin küçük olduğu yazılıyor.',
                  'Kol tutacaklarının ve koruma barının kırılması, arabanın yamulması (%17) ve gevşek kilit mekanizması (%13) şikâyeti var.',
                  'Güneşliğin yetersiz olduğu ve farklı renk gönderildiği yazılıyor.'],
    '292890141': ['Az olumsuz yorum (15); en sık konu kilit ve katlama mekanizması (%20): katlıyken kilit tutmuyor, taşırken açılıyor, kilit parçası kırık geliyor.',
                  'İki yorumda "çift yönlü" diye sorulup tek yönlü çıktığı yazılıyor.',
                  'Yedek parça bulamama ve satıcıdan dönüş alamama şikâyeti var.'],
    '761256359': ['Kategorinin en çok yorum alan ürünü (1.479 yazılı yorum); 1-2 yıldız oranı %22,0.',
                  'Olumsuz yorumların %32\'si tekerleklerden: zor dönüyor, yere değmiyor, kısa sürede kırılıyor.',
                  'Kalitesiz malzeme şikâyeti %21; kusurlu ya da kullanılmış gibi gelme %17.'],
    '112066554': ['Tekerlek şikâyeti %44 ile kategorinin en yükseği: ön tekerler dönmüyor, sallanıyor, en ufak çıkıntıda takılıyor.',
                  'Olumsuz yorumların %29\'u kısa sürede kırılmadan; ön tekerin bir yılda iki kez kırıldığı yazılıyor.',
                  'Kalitesiz, dandik malzeme şikâyeti %24.'],
    '52643125': ['En sık şikâyet tekerleğin sürüş sırasında yerinden çıkması (tekerlek %29).',
                 'Kırık, kusurlu ya da kullanılmış gibi gelme oranı %27.',
                 'Açıkken ufak bir temasla kapandığı, katlama kilidinin tutmadığı yazılıyor (%9).'],
    '751940568': ['1-2 yıldız oranı %5,4 ile kategorinin en düşüğü; az olumsuz yorum (20).',
                  'Tekerleği tutan parçanın ayrılması, tekerleklerin titremesi ve yamulması %30.',
                  'Eksik parça (ön barın takılacağı yer, söz verilen yağmurluk) %20.'],
    '98385275': ['Olumsuz yorumların %21\'i aylar içinde kırılmadan: alt sepet metali, iskelet, puset kolu.',
                 'Satıcı ve garanti desteğinin yetersiz olduğu şikâyeti %13.',
                 'Pusetin yerine oturmaması, kargonun ürünü kapıya çıkarmaması ve ağır plastik kokusu yazılıyor.'],
    '98387892': ['Olumsuz yorumların %41\'i tekerleklerden: teker ve fren yerinden çıkıyor, yamuluyor, fayansta dönmüyor.',
                 'Kırık ya da kusurlu gelme oranı %21; teker pimi gibi parçaların eksik geldiği yazılıyor.',
                 'Bebek sürene dönükken sürüşün zorlaştığı yazılıyor.'],
    '469834144': ['1-2 yıldız oranı %25,9 ile kategorinin en yükseği.',
                  'Tekerleğin oturmaması ya da düşmesi %31, kısa sürede kırılma %24.',
                  'Olumsuzların %10\'u farklı ürün gelmesinden: 4 Baby yerine başka marka gönderilmiş; ürünü 9 satıcı satıyor.',
                  'Bebek içindeyken kendiliğinden katlandığı yazılıyor (%7).'],
    '56991712': ['Kırılma oranı %40 ile kategorinin en yükseği: tutma kolu, teker ve iskelet birkaç ayda kırılıyor.',
                 'İtme kolu kırılıp arabanın devrildiği, bebeğin düşmek üzere olduğu yorumlar var (güvenlik %7).',
                 'Büyük arabanın kullanışsız, pusetin dandik olduğu yazılıyor.'],
    '57697838': ['Tekerleklerden ses gelmesi, titremesi ve yerinden çıkması %34.',
                 'Pusetin arabaya oturan parçalarının kırıldığı ve bebeğin düştüğü yazılıyor (puset %19, güvenlik %9).',
                 'Hantal olduğu ve katlanınca araca sığmadığı yazılıyor (%13).'],
}
DERS = {
    '823617305': ['Kabin boy arabada önerilen yorumların %53\'ü hafifliği, %30\'u uçağa ve bagaja sığmasını övüyor; aynı küçüklük büyüyen bebek için konfor şikâyetine dönüyor.'],
    '299365998': ['Önerilen yorumların yarısı (%50) hafif ve kolay katlanmasını, %22\'si sürüşünü övüyor; kabin boy segmentte satış getiren özellik kompaktlık.'],
    '292890141': ['Soru-cevapta verilen yanlış bilgi doğrudan 1 yıldıza dönüyor; kabin boy arabada yön ve yatma özelliği net yazılmalı.'],
    '761256359': ['Uygun fiyatlı çift yönlü araba çok satıyor ama tekerlek kalitesi puanı belirliyor; olumsuzların %8\'i fiyatına değmediğini, "biraz üstüne koyup iyisini alın" diye yazıyor.'],
    '112066554': ['1-2 yıldız oranı %10,9 ile KOBİ çift yönlü arabalar arasında en düşük; yine de olumsuzların %44\'ü tekerlekten. Bu kategoride KOBİ\'nin birinci kalite kalemi tekerlek.'],
    '52643125': ['"Alüminyum lüks" olarak satılan modelde olumsuzların dörtte birinden fazlası ürünün kutudan kusurlu çıkmasından; bu, ürünü değiştirmeden ele alınabilecek ilk konu.'],
    '751940568': ['Tam yatan hafif baston arabada önerilen yorumların %17\'si hafifliği, %17\'si sürüşü övüyor; ortalama puanı (4,66) kategorinin en yükseği.'],
    '98385275': ['Travel sistemde arabanın kendisi kadar puset bağlantısı ve satış sonrası parça desteği puanı etkiliyor; garanti olduğu halde ulaşılamayan satıcı yorumlara yansıyor.'],
    '98387892': ['Önerilen yorumların %50\'si ilk izlenimde sağlamlığı övüyor; olumsuzların bir kısmı aylar sonra "yorumumu güncelliyorum" diye geliyor. Tekerlek dayanıklılığı ilk günün değil ilk ayların sınavı.'],
    '469834144': ['Kabin boy hafif arabada önerilen yorumların %29\'u hafifliği övüyor; çok satıcılı ilanda farklı marka gönderimi ve kusurlu ürün 1-2 yıldızları büyütüyor.'],
    '56991712': ['Fiyatı uygun bulunuyor (önerilen yorumların %15\'i); olumsuzlarda ise "3 ayda kırıldı" türü dayanıklılık şikâyeti öne çıkıyor.'],
    '57697838': ['Önerilen yorumların %23\'ü hediye olarak alındığını yazıyor (kategorinin en yükseği); doğumdan önce alınan arabanın sorunları doğumdan sonra, çoğu zaman iade süresi geçtikten sonra ortaya çıkıyor.'],
}
ONERILER = [
    ('Tekerlek kategorinin 1 numaralı sorunu',
     'Olumsuz yorumlarda tekerlek şikâyetinin oranı %{teker} (KOBİ %{teker_kobi}, büyük marka %{teker_buyuk}): fayansta dönmüyor, tümsekte takılıyor, sürüşte yerinden çıkıyor. Tekerlek malzemesini, çapını, amortisörü ve ön teker kilidini ilanda gösteren ve sağlam tekerlek kullanan KOBİ en büyük şikâyeti karşılar.'),
    ('Dayanıklılık aylar sonra sınanıyor: parça ve garanti desteği ver',
     'Kısa sürede kırılma şikâyetinin oranı %{kirilma}; birçok yorum "yorumumu güncelliyorum" diye aylar sonra yazılıyor. Arabayı hamileyken alıp doğumdan sonra kullanmaya başlayanlar sorunu iade süresi geçtikten sonra fark ettiğini yazıyor. KOBİ\'lerde satıcıya ve garantiye ulaşamama şikâyeti %{satici_kobi}. Yedek teker ve parça satmak, garanti sürecini ilanda anlatmak güven verir.'),
    ('Kutudan kusursuz çıksın',
     'Kırık, kusurlu ya da kullanılmış gibi gelen ürün şikâyetinin oranı %{hasarli} (KOBİ %{hasarli_kobi}, büyük marka %{hasarli_buyuk}). Bebek arabasında ilk izlenim güven demek; göndermeden önce kurup kontrol etmek ve sağlam koliyle göndermek bu şikâyeti doğrudan azaltır.'),
    ('Büyük markanın açığı: konfor ve fiyat istikrarı',
     'Büyük marka kabin boy arabalarda bebeğin rahat etmemesi şikâyetinin oranı %{konfor_buyuk} (KOBİ %{konfor_kobi}); aldıktan sonra fiyatın düşmesi %{fiyat_dusus_buyuk}. Geniş oturma yeri, ayak desteği ve kampanyalarla dalgalanmayan fiyat KOBİ için fark yaratacak alanlar.'),
]


def p(v): return f'{round(v * 100):d}'


def main(out):
    B = json.load(open('bebek_tarayici.json'))
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
    v = {k: p(w(U, k)) for k in SIKAYET}
    for k in SIKAYET:
        v[k + '_kobi'] = p(w(kobi, k)); v[k + '_buyuk'] = p(w(big, k))
    print('öneri rakamları', {k: v[k] for k in v if k.rsplit('_', 1)[0] in ('teker', 'kirilma', 'hasarli', 'konfor', 'fiyat_dusus', 'satici') or k in ('teker', 'kirilma', 'hasarli')}, file=sys.stderr)
    cat = {'id': 'bebek-arabasi', 'ad': 'Bebek arabası', 'ust': 'Anne ve bebek', 'toplama': '12 Kasım 2026', 'kaynak': 'Trendyol',
           'esanlam': ['bebek arabası', 'puset', 'travel sistem', 'kabin boy bebek arabası', 'baston puset', 'çift yönlü bebek arabası', 'bebek arabası seti', 'seyahat sistemi'],
           'temalar': [{'id': k, 'ad': t[0], 'unlem': t[1]} for k, t in SIKAYET.items()],
           'olumlu_konular': [{'id': k, 'ad': t[0]} for k, t in OLUMLU.items()],
           'oneriler': [{'baslik': b, 'metin': m.format(**v)} for b, m in ONERILER], 'urunler': U}
    json.dump(cat, open(out, 'w'), ensure_ascii=False, indent=1)


main(sys.argv[1])
