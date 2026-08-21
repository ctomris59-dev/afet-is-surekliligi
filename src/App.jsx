import React, { useState, useMemo } from "react";
import { supabase } from "./lib/supabaseClient";
import { generateAfetPdfReport } from "./lib/pdfReport";

/* ======================================================================
   ÇORLU TSO — AFET & İŞ SÜREKLİLİĞİ SKORKARTI (LIGHT EDITORIAL FULLSCREEN)
   ====================================================================== */

/* ---------------- Değerlendirme boyutları ---------------- */
const DIMENSIONS = [
  { key: "risk", label: "Risk & Tehlike Analizi", short: "Risk", ref: "ISO 22301 md.8.2 / Sendai Öncelik 1" },
  { key: "emergency", label: "Acil Durum Müdahale Planı", short: "Müdahale", ref: "6331 s. Kanun / İşyeri Acil Durum Yönetmeliği" },
  { key: "it", label: "Veri & BT Sürekliliği", short: "BT", ref: "NIST SP 800-34 / ISO 22301 md.8.4" },
  { key: "supply", label: "Tedarik Zinciri & Operasyon", short: "Tedarik", ref: "ISO 22301 md.8.2.2 (BIA)" },
  { key: "people", label: "Çalışan Güvenliği & İletişim", short: "Çalışan", ref: "6331 s. Kanun / ISO 22301 md.8.4.3" },
  { key: "testing", label: "Tatbikat & Sürekli İyileştirme", short: "Tatbikat", ref: "ISO 22301 md.8.5 / md.9-10" },
];

/* ---------------- Soru bankası ---------------- */
const QUESTIONS = [
  {
    id: "r1", dim: "risk",
    text: "İşletmenizi etkileyebilecek afet ve kriz risklerini (deprem, yangın, sel, siber saldırı, tedarik kesintisi) ne ölçüde belirlediniz?",
    options: [
      "Sistematik bir risk değerlendirmesi yapılmadı",
      "Riskler biliniyor ama yazılı bir kaydı yok",
      "Temel riskler listelendi, olasılık/etki analizi eksik",
      "Yazılı risk değerlendirmesi var, düzenli gözden geçiriliyor",
      "Kapsamlı risk haritası var; dış veriyle (AFAD, sigorta vb.) destekleniyor",
    ],
  },
  {
    id: "r2", dim: "risk",
    text: "İşyerinizin fiziksel risk analizi (bina durumu, konum, deprem/yangın dayanıklılığı) yapıldı mı?",
    options: [
      "Hiç yapılmadı",
      "Sadece yasal asgari önlemler (yangın tüpü vb.) mevcut",
      "Risk biliniyor ama azaltıcı bir plan yok",
      "Risk azaltıcı önlemlerin bir kısmı alındı",
      "Bağımsız uzman raporuyla doğrulandı, önlemler tamamlandı",
    ],
  },
  {
    id: "r3", dim: "risk",
    text: "Kritik tedarikçi, müşteri ve altyapı (elektrik, internet, lojistik) bağımlılıklarınızın kesinti riski değerlendirildi mi?",
    options: [
      "Bu bağımlılıklar hiç haritalanmadı",
      "Ana bağımlılıklar biliniyor, riski değerlendirilmedi",
      "Kritik bağımlılıklar listelendi",
      "Kritik bağımlılıklar için risk seviyesi belirlendi",
      "Her kritik bağımlılık için alternatif/yedek çözüm tanımlı",
    ],
  },
  {
    id: "e1", dim: "emergency",
    text: "Yazılı bir acil durum ve afet müdahale planınız var mı?",
    options: [
      "Yok",
      "Taslak halinde, resmi değil",
      "Var ama güncel değil / paylaşılmadı",
      "Var, çalışanlara duyuruldu",
      "Var, düzenli güncelleniyor ve ilgili mevzuata (6331 s. Kanun) uygun",
    ],
  },
  {
    id: "e2", dim: "emergency",
    text: "Acil durumda kimin hangi görevi üstleneceği (tahliye sorumlusu, ilk yardım, iletişim) tanımlı mı?",
    options: [
      "Görev tanımı yok",
      "Sözlü olarak biliniyor, yazılı değil",
      "Bazı roller yazılı tanımlı",
      "Tüm kritik roller yazılı ve atanmış",
      "Roller yazılı, yedekli (birincil/ikincil sorumlu) ve tatbik edilmiş",
    ],
  },
  {
    id: "e3", dim: "emergency",
    text: "İşyerinde toplanma noktası, tahliye yolları ve acil müdahale ekipmanı (yangın tüpü, ilk yardım) işaretli ve erişilebilir mi?",
    options: [
      "Hayır",
      "Kısmen, bazı alanlarda işaretleme var",
      "Çoğu alanda işaretli, düzenli kontrol edilmiyor",
      "Tüm alanlar işaretli, periyodik kontrol yapılıyor",
      "Tam uyumlu, kontrol kayıtları tutuluyor ve denetime hazır",
    ],
  },
  {
    id: "i1", dim: "it",
    text: "Kritik iş verileriniz (muhasebe, müşteri, üretim kayıtları) düzenli olarak yedekleniyor mu?",
    options: [
      "Yedekleme yok",
      "Düzensiz, manuel yedekleme yapılıyor",
      "Düzenli yedekleme var ama tek konumda saklanıyor",
      "Düzenli ve fiziksel olarak farklı konumda (bulut/harici) yedekleme var",
      "Otomatik, çoklu konumlu yedekleme + geri yükleme testleri yapılıyor",
    ],
  },
  {
    id: "i2", dim: "it",
    text: "Bir siber saldırı veya sistem arızası durumunda işinize ne kadar sürede devam edebilirsiniz?",
    options: [
      "Bilmiyorum / hiç değerlendirilmedi",
      "1 haftadan uzun sürer",
      "2-7 gün içinde",
      "1-2 gün içinde",
      "Birkaç saat içinde (yedek sistem/BT sürekliliği planı var)",
    ],
  },
  {
    id: "i3", dim: "it",
    text: "Çalışanlarınızın temel siber güvenlik farkındalığı (kimlik avı, güçlü parola vb.) var mı?",
    options: [
      "Hiç eğitim verilmedi",
      "Bilgilendirme yapıldı ama tekrarlanmadı",
      "Yıllık bilgilendirme var",
      "Düzenli eğitim + test (örn. tatbiki kimlik avı) yapılıyor",
      "Kapsamlı program var, sonuçlar ölçülüp iyileştiriliyor",
    ],
  },
  {
    id: "s1", dim: "supply",
    text: "Ana tedarikçinizde yaşanacak bir kesinti için alternatif tedarikçi veya stok planınız var mı?",
    options: [
      "Yok, tek tedarikçiye bağımlıyız",
      "Farkındayız ama alternatif belirlenmedi",
      "Bazı kritik girdiler için alternatif belirlendi",
      "Kritik girdilerin çoğunda alternatif tedarikçi var",
      "Tüm kritik girdilerde alternatif + güvenlik stoku politikası var",
    ],
  },
  {
    id: "s2", dim: "supply",
    text: "Üretim/hizmet sürecinizin hangi adımlarının 'kritik' (kesintiye en duyarlı) olduğu belirlendi mi?",
    options: [
      "Hayır",
      "Genel bir fikrimiz var, yazılı değil",
      "Kritik adımlar listelendi",
      "Kritik adımlar için etki analizi (BIA) yapıldı",
      "BIA sonuçlarına göre öncelikli kurtarma sırası tanımlandı",
    ],
  },
  {
    id: "s3", dim: "supply",
    text: "Bir kesinti sırasında müşterilerinize hizmeti sürdürebilecek minimum kapasite/alternatif plan var mı?",
    options: [
      "Yok",
      "Fikir var, planlanmadı",
      "Kısmi bir plan var, test edilmedi",
      "Plan var, en kritik müşteriler için test edildi",
      "Kapsamlı süreklilik planı var, düzenli test ediliyor",
    ],
  },
  {
    id: "p1", dim: "people",
    text: "Acil bir durumda çalışanlara/tedarikçilere hızlıca ulaşabileceğiniz bir iletişim sisteminiz (telefon zinciri, grup, SMS) var mı?",
    options: [
      "Yok",
      "Gayri resmi (kişisel telefonlar üzerinden)",
      "Temel bir liste var, güncel değil",
      "Güncel iletişim listesi ve yedek kanal var",
      "Çok kanallı, otomatik bildirim sistemi mevcut",
    ],
  },
  {
    id: "p2", dim: "people",
    text: "Çalışanlarınız temel ilk yardım ve tahliye eğitimi aldı mı?",
    options: [
      "Hiç eğitim verilmedi",
      "Sadece işe giriş eğitiminde bahsedildi",
      "Bazı çalışanlar eğitim aldı",
      "Tüm çalışanlar periyodik eğitim alıyor",
      "Sertifikalı eğitim + tatbikatlarla pekiştiriliyor",
    ],
  },
  {
    id: "p3", dim: "people",
    text: "Kriz anında karar verme yetkisi kilit kişide/kişilerde toplanıyorsa, o kişi ulaşılamazsa ne olacağı tanımlı mı?",
    options: [
      "Tanımlı değil, tek kişiye bağımlıyız",
      "Sözlü bir yedek var",
      "Yazılı yetki devri tanımlı",
      "Yazılı yetki devri + iletişim protokolü var",
      "Çok kademeli yedekleme, düzenli test ediliyor",
    ],
  },
  {
    id: "t1", dim: "testing",
    text: "Acil durum planınızı en son ne zaman tatbikatla test ettiniz?",
    options: [
      "Hiç test edilmedi",
      "2 yıldan uzun süre önce",
      "Son 1-2 yıl içinde bir kez",
      "Yılda bir düzenli tatbikat yapılıyor",
      "Yılda birden fazla, farklı senaryolarla tatbikat yapılıyor",
    ],
  },
  {
    id: "t2", dim: "testing",
    text: "Geçmişte yaşanan bir aksaklık/kriz sonrası plan gözden geçirilip güncellendi mi?",
    options: [
      "Yaşanan aksaklıklar sonrası plan güncellenmedi",
      "Sözlü ders çıkarıldı, yazılı değişiklik yapılmadı",
      "Bazı güncellemeler yapıldı",
      "Sistematik 'ders çıkarma' süreci var",
      "Her olay sonrası resmi inceleme + plan revizyonu yapılıyor",
    ],
  },
  {
    id: "t3", dim: "testing",
    text: "İş sürekliliği/afet hazırlığı konusunda üst yönetim ne sıklıkla bilgilendiriliyor veya karar alıyor?",
    options: [
      "Hiç gündeme gelmiyor",
      "Yalnızca bir olay sonrası konuşuluyor",
      "Yılda bir kez gözden geçiriliyor",
      "Düzenli (çeyreklik) gündem maddesi",
      "Yönetim sisteminin resmi, sürekli bir parçası (ISO 22301 PUKÖ döngüsü)",
    ],
  },
];

/* ---------------- Olgunluk seviyeleri ---------------- */
const LEVELS = [
  { min: 0, max: 20, name: "Habersiz / Reaktif", color: "#7C2D12", desc: "Afet ve kriz hazırlığı büyük ölçüde tesadüfe bırakılmış. Herhangi bir kesinti işletmeyi ciddi risk altında bırakabilir." },
  { min: 21, max: 40, name: "Farkında / Başlangıç", color: "#B91C1C", desc: "Riskler kısmen biliniyor ama yazılı, sistematik bir hazırlık yok. İlk adım: temel riskleri ve kritik süreçleri yazılı hale getirmek." },
  { min: 41, max: 60, name: "Gelişmekte", color: "#C2410C", desc: "Temel unsurlar (plan, yedekleme, roller) kısmen mevcut. Sıradaki öncelik: planları test etmek ve boşlukları kapatmak." },
  { min: 61, max: 80, name: "Yönetilen", color: "#B45309", desc: "İş sürekliliği kurumsallaşmaya başlamış; düzenli gözden geçirme ve test var. İnce ayar ve kapsam genişletme aşaması." },
  { min: 81, max: 100, name: "Dayanıklı / Optimize", color: "#0F766E", desc: "ISO 22301 ruhuna uygun, olgun bir yönetim sistemi. Sürekli iyileştirme döngüsü işliyor." },
];

const getLevel = (score) => LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];

/* ---------------- Senaryo Matrisi ---------------- */
const DIM_SCENARIOS = {
  risk: [
    {
      scenario: "Riskler şu ana kadar sistematik olarak değerlendirilmemiş — Sendai Çerçevesi'nin ilk ve en temel önceliği olan 'riski anlama' aşaması henüz atılmamış. İlk adım karmaşık bir analiz değil, tek sayfalık bir liste: deprem, yangın, sel, siber saldırı ve tedarik kesintisini alt alta yazıp her biri için kaba bir olasılık/etki puanı vermek.",
      actions: ["AFAD'ın il/ilçe bazlı deprem tehlike haritasından bölgenizin risk seviyesini öğrenin", "En olası 5 riski tek sayfada listeleyin, olasılık ve etkiyi 1-5 arası puanlayın", "Listeyi yıllık takvime bir hatırlatma olarak ekleyin"],
    },
    {
      scenario: "Riskler ekip içinde konuşuluyor ama hiçbir yerde yazılı değil — bu bilgi, riski bilen kişi işten ayrıldığında kayboluyor demektir. ISO 22301 madde 8.2.3'ün istediği ilk şey tam da bu: riskleri kurumsal hafızaya, yazılı bir kayda taşımak.",
      actions: ["Ekip toplantısında konuşulan riskleri tek bir belgede toplayın", "Her risk için 'bu gerçekleşirse ilk 24 saatte ne olur' sorusunu yazılı yanıtlayın", "Belgeyi yılda bir güncellemeyi takvime ekleyin"],
    },
    {
      scenario: "Temel risk listeniz var ama olasılık/etki analizi eksik — hangi riskin öncelikli olduğu net değil. Sıradaki adım, ISO 22301'in İş Etki Analizi (BIA, madde 8.2.2) mantığına geçiş: her riski, işi ne kadar sürede durdurabileceğine göre sıralamak.",
      actions: ["Her risk için 'olursa üretim/hizmet kaç saat/gün durur' sorusunu yanıtlayın", "En yüksek etkili 3 riski önceliklendirip özel önlem planı yazın", "Sigorta poliçenizin bu riskleri kapsayıp kapsamadığını kontrol edin"],
    },
    {
      scenario: "Yazılı ve düzenli gözden geçirilen bir risk değerlendirmeniz var — birçok KOBİ'nin ulaşmadığı bir olgunluk seviyesi. Sıradaki adım, değerlendirmeyi yalnızca içeriden değil dış veriyle (AFAD verileri, sigorta risk mühendisliği raporu) doğrulamak.",
      actions: ["Sigorta şirketinizden bir risk mühendisliği değerlendirmesi talep edin", "Kritik tedarikçilerinizin kendi risk değerlendirmesi olup olmadığını sorun", "Risk listesini yıllık takvimin yanı sıra önemli bir olay sonrası da güncelleyin"],
    },
    {
      scenario: "Kapsamlı ve dış veriyle desteklenmiş bir risk haritanız var — bu seviyeyi korumak asıl zorluk. Sıradaki adım, bu disiplini tedarik zincirinize de yaymak.",
      actions: ["Kritik tedarikçilerinizden kendi risk değerlendirmelerini paylaşmalarını isteyin", "Risk haritanızı yönetim/ortaklar toplantısında yıllık gündem maddesi yapın", "Mevcut olgunluğunuz uygun görünüyor — ISO 22301 sertifikasyonunu değerlendirin"],
    },
  ],
  emergency: [
    {
      scenario: "Yazılı bir acil durum planınız yok — bu yalnızca bir hazırlık eksikliği değil, 6331 sayılı Kanun'un 11 ve 12. maddelerine dayanan yasal bir yükümlülüğün karşılanmadığı anlamına da geliyor. Yönetmeliğin 7. maddesi planın hangi aşamalardan geçerek hazırlanacağını adım adım tarif eder.",
      actions: ["Çalışma ve Sosyal Güvenlik Bakanlığı'nın 'Acil Durum Planı Hazırlama Rehberi'ni indirin", "İşyeri hekiminiz/İSG uzmanınız varsa plan hazırlığını onunla başlatın", "Yoksa bir OSGB'den bu konuda destek alın — yasal zorunluluk"],
    },
    {
      scenario: "Bir taslak var ama resmi değil ve muhtemelen çalışanlarla paylaşılmadı. Yönetmelik madde 19 gereği çalışanların acil durumlar hakkında bilgilendirilmesi zorunlu — plan ne kadar iyi olursa olsun, bilinmiyorsa işe yaramaz.",
      actions: ["Taslağı resmi hale getirip tarih atın", "Tüm çalışanlara en az bir kez sözlü + yazılı bilgilendirme yapın", "Yeni işe başlayanlara oryantasyonda planı anlatmayı standart hale getiren"],
    },
    {
      scenario: "Planınız var ama güncel değil veya yeterince paylaşılmamış. Yönetmelik madde 13, planın yalnızca yazılı olmasını değil, düzenli tatbikatla test edilmesini de şart koşar (diğer işyerleri için en geç yılda bir).",
      actions: ["Plan üzerindeki tarihleri ve sorumlu isimlerini güncelleyin", "Yılda bir kez basit bir tahliye tatbikatı planlayın", "Tatbikat sonrası Yönetmelik Ek-2'deki örneğe benzer bir değerlendirme formu doldurun"],
    },
    {
      scenario: "Plan var, çalışanlara duyurulmuş — iyi bir seviyedesiniz. Sıradaki adım, planı tek seferlik bir belge değil, yaşayan bir doküman haline getirmek.",
      actions: ["Tatbikat sonrası çıkan eksiklikleri plana işleyin (Yönetmelik md.13/3)", "Yaşlı, engelli veya hamile çalışan/ziyaretçi için özel tahliye desteği tanımlayın (md.8/4)", "Planı yalnızca yılda bir değil, önemli bir bina/süreç değişikliğinde de gözden geçirin"],
    },
    {
      scenario: "Planınız güncel, mevzuata uygun ve düzenli test ediliyor — bu seviyeyi sürdürmek asıl hedef olmalı.",
      actions: ["Farklı senaryolarla (yangın, deprem, siber olay) yılda birden fazla tatbikat yapmayı değerlendirin", "İş hanı/OSB'deyseniz komşu işyerleriyle ortak tatbikat imkanını araştırın", "Planı yeni çalışan oryantasyonunun standart bir kontrol listesi parçası yapın"],
    },
  ],
  it: [
    {
      scenario: "Kritik verileriniz yedeklenmiyor — bir donanım arızası, fidye yazılımı veya çalınma durumunda geri dönüşü olmayan bir kayıp riski var. NIST SP 800-34'ün en temel önerisi budur: hiçbir BT sürekliliği yedekleme olmadan mümkün değildir.",
      actions: ["Bu hafta içinde muhasebe ve müşteri verilerinizin bir kopyasını harici bir diske alın", "Ücretsiz/düşük maliyetli bulut yedekleme (Drive, OneDrive vb.) için otomatik senkronizasyon kurun", "Hangi verinin 'kritik' olduğuna karar verin — her şeyi değil önce en önemlisini yedekleyin"],
    },
    {
      scenario: "Yedekleme yapılıyor ama düzensiz ve manuel — bir olay anında elinizdeki yedek muhtemelen güncel olmayacak. Hedef, yedeklemeyi insan hafızasına değil otomasyona bağlamak.",
      actions: ["Yedeklemeyi otomatik/zamanlanmış hale getirin (günlük veya haftalık)", "Yedeğin gerçekten alındığını doğrulayan basit bir kontrol rutini kurun", "Kimin ne zaman yedek aldığını kaydeden basit bir kayıt tutun"],
    },
    {
      scenario: "Düzenli yedekleme var ama tek konumda saklanıyor — bir yangın veya hırsızlık hem orijinali hem yedeği aynı anda götürebilir. Yaygın kabul gören '3-2-1 kuralı' (3 kopya, 2 farklı ortam, 1'i uzak konum) burada devreye girer.",
      actions: ["Yedeğin en az bir kopyasını fiziksel olarak farklı bir konumda (bulut veya başka bina) tutun", "Geri yükleme işlemini yılda bir deneyerek yedeğin gerçekten çalıştığını doğrulayın", "'Ne kadar sürede sisteme geri döneriz' sorusuna kaba bir yanıt yazın"],
    },
    {
      scenario: "Düzenli, çoklu konumlu yedekleme var — iyi bir olgunluk seviyesi. Sıradaki adım, 'yedek var mı' sorusundan 'yedekten ne kadar sürede geri döneriz' sorusuna geçmek.",
      actions: ["Bir kurtarma süresi hedefi (RTO) ve veri kaybı toleransı (RPO) belirleyin", "Yılda bir kez gerçek bir 'felaket senaryosu' tatbikatı (tam geri yükleme denemesi) yapın", "Kritik yazılımlarınızın lisans/erişim bilgilerini de yedek planına dahil edin"],
    },
    {
      scenario: "Otomatik, çoklu konumlu yedekleme ve düzenli geri yükleme testleri yapıyorsunuz — NIST SP 800-34 çerçevesinin olgun bir uygulamasına yakınsınız.",
      actions: ["BT sürekliliği planınızı kimin ne yapacağını da içeren tek bir dokümana bağlayın", "Siber sigorta kapsamınızı bu olgunluk seviyesine göre gözden geçirin", "Kritik bulut/yazılım tedarikçilerinizin kendi süreklilik garantilerini (SLA) kontrol edin"],
    },
  ],
  supply: [
    {
      scenario: "Kritik girdileriniz için tek bir tedarikçiye bağımlısınız ve bu hiç sorgulanmamış. ISO 22301'in İş Etki Analizi mantığı tam olarak bunu sorar: 'bu tedarikçi bugün kesilirse işimiz kaç günde durur?'",
      actions: ["En çok bağımlı olduğunuz 2-3 girdiyi/hizmeti listeleyin", "Her biri için 'alternatif var mı' sorusunu yanıtlayın (yoksa en büyük riskiniz budur)", "En kritik girdi için en az bir alternatif tedarikçiyle ön görüşme yapın"],
    },
    {
      scenario: "Bağımlılıkların farkındasınız ama alternatif belirlenmedi — bilgi var, plan yok. Bu genelde ucuz ve hızlı kapatılabilecek bir boşluktur.",
      actions: ["En kritik 1-2 girdi için somut bir alternatif tedarikçi bulun (bir fiyat teklifi bile yeterli başlangıç)", "Mevcut tedarikçinizle 'siz üretemezseniz ne olur' konusunu açıkça konuşun", "Küçük bir güvenlik stoku bütçelemeyi değerlendirin"],
    },
    {
      scenario: "Bazı kritik girdiler için alternatif belirlendi — iyi bir başlangıç. ISO 22301 madde 8.2.2'nin istediği sonraki adım, bunu tüm öncelikli faaliyetlere yaymak ve resmi bir etki analizine dönüştürmek.",
      actions: ["Kalan kritik girdiler için de alternatif arayışını tamamlayın", "Her kritik süreç için 'ne kadar sürede eski haline döneriz' sorusunu yazılı yanıtlayın", "En kritik müşterilerinizle olası bir gecikme durumunda nasıl iletişim kuracağınızı planlayın"],
    },
    {
      scenario: "Kritik girdilerin çoğunda alternatif var — güçlü bir konumdasınız. Sıradaki adım, bunu resmi bir öncelik sıralamasına (hangi süreç önce kurtarılır) dönüştürmek.",
      actions: ["BIA sonuçlarına göre süreçlerinizi 'önce / sonra kurtarılacak' şeklinde sıralayın", "Alternatif tedarikçilerle yıllık bir 'hazır olma' kontrolü yapın", "Güvenlik stoku seviyelerini kritiklik sıralamasına göre gözden geçirin"],
    },
    {
      scenario: "Tüm kritik girdilerde alternatif ve güvenlik stoku politikanız var — bu, çoğu büyük kurumun bile tam oturtamadığı bir olgunluk seviyesi.",
      actions: ["Bu disiplini yeni ürün/hizmet geliştirirken de standart bir adım haline getirin", "Alternatif tedarikçilerinizin kendi süreklilik planı olup olmadığını sorgulamaya başlayın", "Yıllık BIA güncellemesini yönetim gündemine sabit madde olarak ekleyin"],
    },
  ],
  people: [
    {
      scenario: "Acil bir durumda çalışanlara nasıl ulaşacağınıza dair bir sisteminiz yok. ISO 22301 madde 8.4.3'ün altını çizdiği gibi, bir kriz anında en büyük risklerden biri iletişimin kopmasıdır.",
      actions: ["Tüm çalışanların güncel telefon numaralarını tek bir listede toplayın", "Basit bir WhatsApp/SMS grubu oluşturun (kriz anı için)", "Bu listeyi kimin güncel tutacağını belirleyin"],
    },
    {
      scenario: "İletişim kişisel telefonlar üzerinden, gayri resmi şekilde yürüyor — birileri hatırladığı için işliyor, sistemli değil.",
      actions: ["Listeyi resmi bir belgeye dönüştürün ve İK dosyasında saklayın", "En az bir yedek iletişim kanalı belirleyin (telefon ulaşmazsa e-posta/SMS)", "Yeni işe başlayanları listeye eklemeyi standart oryantasyon adımı yapın"],
    },
    {
      scenario: "Temel bir liste var ama güncel değil — bu, tam ihtiyaç anında en çok fark eden eksikliklerden biri.",
      actions: ["Listeyi 6 ayda bir güncellemeyi takvime ekleyin", "Yedek bir iletişim kanalı (grup mesajı, acil durum panosu) kurun", "İlk yardım/tahliye sorumlularının isimlerini listeye ekleyin"],
    },
    {
      scenario: "Güncel iletişim listeniz ve yedek kanalınız var — sağlam bir temel. Sonraki adım otomasyon.",
      actions: ["Toplu SMS/anlık bildirim gönderebileceğiniz düşük maliyetli bir araç araştırın", "Yılda bir kez test mesajı göndererek listenin gerçekten çalıştığını doğrulayın", "Çalışan yakınları için de bir bilgilendirme kanalı düşünün"],
    },
    {
      scenario: "Çok kanallı, otomatik bildirim sisteminiz var — bu seviyede asıl risk rehavet.",
      actions: ["Sistemi yılda en az bir kez gerçek bir tatbikatla test edin", "Yeni teknolojik seçenekleri (acil durum bildirim uygulamaları) takip edin", "Bu altyapıyı yalnızca acil durumlarda değil, iş sürekliliği iletişiminde de kullanmayı değerlendirin"],
    },
  ],
  testing: [
    {
      scenario: "Planınızı hiç test etmediniz — kağıt üzerinde iyi görünen bir plan, gerçek bir olayda genellikle beklenmedik şekilde çalışır. ISO 22301'in en çok atlanan ama en kritik maddesi budur: test edilmeyen plan, plan değildir.",
      actions: ["Küçük başlayın: 30 dakikalık bir masabaşı (tabletop) tatbikatı planlayın", "En az bir kez gerçek bir tahliye denemesi yapın", "Tatbikat sonrası neyin işe yaramadığını yazılı not alın"],
    },
    {
      scenario: "2 yıldan uzun süre önce bir test yapılmış — ekip değişmiş, mekan değişmiş, plan muhtemelen artık gerçeği yansıtmıyor.",
      actions: ["Bu yıl içinde en az bir tatbikat planlayın", "Yönetmelik md.13'ün istediği asgari sıklık (yılda bir) için takvim hatırlatıcısı kurun", "Tatbikat tarihini ve sonuçlarını yazılı kaydetmeye başlayın"],
    },
    {
      scenario: "Son 1-2 yılda bir kez test yapılmış — düzenli değil ama en azından bir alışkanlık başlamış.",
      actions: ["Yıllık tatbikatı sabit bir takvim etkinliği haline getirin", "Tatbikat sonrası basit bir değerlendirme formu doldurun (Yönetmelik Ek-2 örnek alınabilir)", "Bulunan eksiklikleri bir sonraki tatbikata kadar kapatmayı hedef koyun"],
    },
    {
      scenario: "Yılda bir düzenli tatbikat yapılıyor — sağlam bir alışkanlık. ISO 22301 madde 9-10'un istediği, bunu bir 'ders çıkarma' döngüsüne bağlamak.",
      actions: ["Farklı senaryolar deneyin (her yıl aynısı yerine yangın/deprem/siber rotasyonu)", "Tatbikat sonuçlarını yönetim toplantısında kısa bir gündem maddesi yapın", "Geçmiş 2-3 tatbikatın sonuçlarını karşılaştırıp gelişim olup olmadığını görün"],
    },
    {
      scenario: "Yılda birden fazla, farklı senaryolu tatbikat yapıyorsunuz — ISO 22301'in PUKÖ (Planla-Uygula-Kontrol Et-Önlem Al) döngüsünün olgun bir uygulaması bu.",
      actions: ["Bu disiplini resmi bir ISO 22301 sertifikasyon başvurusuna dönüştürmeyi değerlendirin", "Tedarikçi ve iş ortaklarınızı da ortak tatbikatlara davet edin", "Sonuçları Çorlu TSO ile paylaşarak bölgesel afet hazırlığına katkı sağlayın"],
    },
  ],
};

// UI-FIX-BCM-2026-08-21-FULLSCREEN-PORTAL-V1

function Icon({ name, size = 18, className = "" }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", className };
  const paths = {
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    alert: <><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
    truck: <><path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/></>,
    arrowRight: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    arrowLeft: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>,
    close: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg {...common}>{paths[name] || paths.shield}</svg>;
}

const DIM_ICONS = {
  risk: "alert",
  emergency: "shield",
  it: "database",
  supply: "truck",
  people: "users",
  testing: "refresh",
};

function MethodologyModal({ onClose }) {
  const [tab, setTab] = useState(0);
  const tabs = [
    {
      label: "ISO 22301",
      title: "İş sürekliliği yönetim sistemi",
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["01", "Risk & BIA", "Risk değerlendirmesi, iş etki analizi ve kritik süreçlerin önceliklendirilmesi."],
            ["02", "Süreklilik Stratejisi", "Kesinti anında minimum kapasitenin, alternatif kaynakların ve sorumlulukların tanımlanması."],
            ["03", "Plan & Müdahale", "Acil durum rolleri, iletişim zinciri, tahliye ve toparlanma adımlarının yazılı hale getirilmesi."],
            ["04", "Tatbikat & PUKÖ", "Planların test edilmesi, sonuçların gözden geçirilmesi ve sürekli iyileştirme döngüsü."],
          ].map(([no, title, desc]) => (
            <div key={no} className="rounded-2xl border border-[#DFE5EA] bg-[#F7F9FB] p-4">
              <div className="text-[10px] font-extrabold tracking-[.16em] text-[#C74242]">{no}</div>
              <div className="mt-1 text-xs font-extrabold text-[#14283F]">{title}</div>
              <p className="mt-1.5 text-[10px] leading-5 text-[#6D7A87]">{desc}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "Risk & Mevzuat",
      title: "Afet riski ve yasal dayanak",
      body: (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["UNDRR Sendai", "Afet riskini anlamayı ve azaltmayı temel öncelik kabul eder."],
            ["6331 Sayılı Kanun", "Acil durum planı, tahliye ve çalışanların bilgilendirilmesi yükümlülüklerini esas alır."],
            ["İşyeri Acil Durum Yönetmeliği", "Planlama, görevlendirme, tatbikat ve periyodik gözden geçirme yaklaşımını destekler."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl bg-[#10243D] p-4 text-white">
              <Icon name="book" size={18} className="text-[#E9A3A3]" />
              <div className="mt-3 text-xs font-extrabold leading-5">{title}</div>
              <p className="mt-1.5 text-[10px] leading-5 text-white/[0.60]">{desc}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "BT & Kullanım",
      title: "BT sürekliliği ve araç kullanım yaklaşımı",
      body: (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["01", "NIST SP 800-34", "Bilgi sistemleri sürekliliği, yedekleme ve toparlanma planlamasına referans sağlar."],
            ["02", "6 boyut", "Risk, müdahale, BT, tedarik, çalışan ve tatbikat birlikte değerlendirilir."],
            ["03", "Öz-değerlendirme", "Araç resmi denetim veya sertifikasyon değildir; hızlı ön tarama ve aksiyon önceliklendirmesidir."],
          ].map(([no, title, desc]) => (
            <div key={no} className="rounded-2xl border border-[#DFE5EA] bg-white p-4 shadow-[0_8px_24px_rgba(12,31,54,.05)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F8E8E8] text-[10px] font-black text-[#B73737]">{no}</div>
              <div className="mt-3 text-xs font-extrabold text-[#14283F]">{title}</div>
              <p className="mt-1.5 text-[10px] leading-5 text-[#6D7A87]">{desc}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];
  const active = tabs[tab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#061628]/[0.85] p-3 backdrop-blur-md" onClick={onClose}>
      <div className="flex h-[min(560px,calc(100dvh-24px))] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/[0.60] bg-[#FBFCFD] shadow-[0_30px_90px_rgba(3,19,37,.35)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#DFE5EA] px-5 py-3.5">
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#C74242]">Afet & iş sürekliliği metodolojisi</div>
            <h3 className="mt-0.5 text-lg font-extrabold tracking-tight text-[#10243D]">Bilimsel Metodoloji ve Dayanaklar</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE3E9] bg-white text-[#6E7A86] hover:bg-[#F4F6F8]"><Icon name="close" size={18} /></button>
        </div>
        <div className="grid flex-shrink-0 grid-cols-3 gap-1.5 border-b border-[#E4E9ED] bg-[#F5F7F9] p-2.5 sm:px-5">
          {tabs.map((item, idx) => (
            <button key={item.label} type="button" onClick={() => setTab(idx)} className={`rounded-xl px-3 py-2 text-[10px] font-extrabold transition ${idx === tab ? "bg-[#10243D] text-white" : "text-[#65717D] hover:bg-white"}`}>{item.label}</button>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 gap-4 p-4 sm:grid-cols-[.31fr_.69fr] sm:p-5">
          <div className="hidden rounded-[22px] bg-[#10243D] p-5 text-white sm:block">
            <Icon name="shield" size={28} className="text-[#E9A3A3]" />
            <div className="mt-5 text-[9px] font-extrabold uppercase tracking-[.17em] text-[#F0B1B1]">Aktif başlık</div>
            <div className="mt-2 text-xl font-extrabold leading-tight">{active.title}</div>
            <p className="mt-3 text-[10px] leading-5 text-white/[0.58]">Kaynaklar tek ekran içinde sekmelere ayrılmıştır; modal kaydırması gerekmez.</p>
          </div>
          <div className="min-h-0 overflow-hidden rounded-[22px] border border-[#DFE5EA] bg-white p-4 sm:p-5">
            <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#C74242] sm:hidden">{active.title}</div>
            {active.body}
          </div>
        </div>
      </div>
    </div>
  );
}

function KVKKModal({ onClose }) {
  const [tab, setTab] = useState(0);
  const tabs = [
    {
      label: "Veri & Amaç",
      title: "Veri sorumlusu ve işleme amacı",
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#DFE5EA] bg-[#F7F9FB] p-4"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#C74242]">Veri Sorumlusu</div><p className="mt-2 text-[10.5px] leading-5 text-[#627180]">Bu değerlendirme, 6698 sayılı KVKK kapsamında Çorlu Ticaret ve Sanayi Odası tarafından veri sorumlusu sıfatıyla yürütülmektedir.</p></div>
          <div className="rounded-2xl border border-[#DFE5EA] bg-[#F7F9FB] p-4"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#C74242]">İşlenen Veriler</div><p className="mt-2 text-[10.5px] leading-5 text-[#627180]">Firma unvanı, yetkili adı-soyadı, e-posta, telefon, anket yanıtları ve hesaplanan olgunluk skorları işlenir.</p></div>
          <div className="sm:col-span-2 rounded-2xl bg-[#10243D] p-4 text-white"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#F0B1B1]">İşleme Amacı</div><p className="mt-2 text-[10.5px] leading-5 text-white/[0.65]">Afet ve iş sürekliliği olgunluk düzeyinizin ölçülmesi, sonuç raporunun sunulması ve Çorlu TSO tarafından gelişim sürecinizin takip edilmesi amacıyla işlenir.</p></div>
        </div>
      ),
    },
    {
      label: "Güvenlik",
      title: "Hukuki sebep, saklama ve güvenlik",
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#DFE5EA] bg-white p-4"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#C74242]">Hukuki Sebep</div><p className="mt-2 text-[10.5px] leading-5 text-[#627180]">KVKK md. 5/1 uyarınca açık rızanıza dayanılarak, Oda'nın üyelerine yönelik afet ve iş sürekliliği kapasitesini geliştirme faaliyetleri kapsamında işlenir.</p></div>
          <div className="rounded-2xl border border-[#DFE5EA] bg-white p-4"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#C74242]">Saklama & Güvenlik</div><p className="mt-2 text-[10.5px] leading-5 text-[#627180]">Veriler yalnızca yetkili Oda personelinin erişebildiği güvenli bir veritabanında, amaç için gerekli süre boyunca saklanır ve ticari amaçla kullanılmaz.</p></div>
        </div>
      ),
    },
    {
      label: "Haklar",
      title: "KVKK kapsamındaki haklarınız",
      body: (
        <div className="rounded-2xl border border-[#DFE5EA] bg-[#F7F9FB] p-5">
          <div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#C74242]">KVKK md. 11</div>
          <p className="mt-2 text-[11px] leading-6 text-[#607080]">Verilerinize erişme, düzeltilmesini veya silinmesini talep etme ve rızanızı geri alma dahil haklarınızı kullanmak için Çorlu Ticaret ve Sanayi Odası'na yazılı olarak başvurabilirsiniz.</p>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-900">Bu metin genel bir taslaktır; yayına almadan önce Oda'nın hukuk/uyum birimince gözden geçirilmesi önerilir.</div>
        </div>
      ),
    },
  ];
  const active = tabs[tab];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#061628]/[0.85] p-3 backdrop-blur-md" onClick={onClose}>
      <div className="flex h-[min(510px,calc(100dvh-24px))] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/[0.60] bg-[#FBFCFD] shadow-[0_30px_90px_rgba(3,19,37,.35)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#DFE5EA] px-5 py-3.5">
          <div><div className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#C74242]">Kişisel verilerin korunması</div><h3 className="mt-0.5 text-lg font-extrabold tracking-tight text-[#10243D]">KVKK Aydınlatma Metni</h3></div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE3E9] bg-white text-[#6E7A86] hover:bg-[#F4F6F8]"><Icon name="close" size={18} /></button>
        </div>
        <div className="grid flex-shrink-0 grid-cols-3 gap-1.5 border-b border-[#E4E9ED] bg-[#F5F7F9] p-2.5 sm:px-5">{tabs.map((item, idx) => <button key={item.label} type="button" onClick={() => setTab(idx)} className={`rounded-xl px-3 py-2 text-[10px] font-extrabold ${idx === tab ? "bg-[#10243D] text-white" : "text-[#65717D] hover:bg-white"}`}>{item.label}</button>)}</div>
        <div className="grid min-h-0 flex-1 gap-4 p-4 sm:grid-cols-[.31fr_.69fr] sm:p-5">
          <div className="hidden rounded-[22px] bg-[#10243D] p-5 text-white sm:block"><Icon name="shield" size={28} className="text-[#E9A3A3]" /><div className="mt-5 text-[9px] font-extrabold uppercase tracking-[.17em] text-[#F0B1B1]">KVKK</div><div className="mt-2 text-lg font-extrabold leading-tight">{active.title}</div></div>
          <div className="min-h-0 overflow-hidden rounded-[22px] border border-[#DFE5EA] bg-white p-4 sm:p-5">{active.body}</div>
        </div>
      </div>
    </div>
  );
}

function Gauge({ value, color = "#C74242" }) {
  const size = 210, cx = size / 2, cy = size / 2 + 8, r = 82, start = -180, end = 0;
  const pct = Math.max(0, Math.min(1, value / 100));
  const angle = start + pct * (end - start);
  const polar = (a, radius) => { const rad = (a * Math.PI) / 180; return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]; };
  const arc = (a0, a1, radius) => { const [x0, y0] = polar(a0, radius); const [x1, y1] = polar(a1, radius); return `M ${x0} ${y0} A ${radius} ${radius} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  const [nx, ny] = polar(angle, r - 13);
  return (
    <svg viewBox={`0 0 ${size} ${size * .63}`} width="100%" className="mx-auto block max-w-[230px]">
      <path d={arc(start, end, r)} fill="none" stroke="#E4E9EF" strokeWidth="12" strokeLinecap="round" />
      <path d={arc(start, angle, r)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#10243D" strokeWidth="3.3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5.5" fill="#10243D" />
      <text x={cx} y={cy - 30} textAnchor="middle" fontSize="31" fontWeight="850" fill="#10243D">{Math.round(value)}</text>
    </svg>
  );
}

function RadarChart({ byDim }) {
  const size = 300, cx = size / 2, cy = size / 2, maxR = 98, n = DIMENSIONS.length;
  const pointAt = (i, r) => { const angle = (-90 + (360 / n) * i) * (Math.PI / 180); return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]; };
  const rings = [20, 40, 60, 80, 100];
  const dataPoints = DIMENSIONS.map((d, i) => pointAt(i, ((byDim[d.key] || 0) / 100) * maxR));
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" className="mx-auto block max-h-[245px] max-w-[300px]">
      {rings.map((r) => <polygon key={r} points={DIMENSIONS.map((_, i) => pointAt(i, (r / 100) * maxR).join(",")).join(" ")} fill="none" stroke="#DCE4EB" strokeWidth={r === 100 ? 1.4 : 1} strokeDasharray={r === 100 ? "0" : "3,3"} />)}
      {DIMENSIONS.map((d, i) => { const [x, y] = pointAt(i, maxR); return <line key={d.key} x1={cx} y1={cy} x2={x} y2={y} stroke="#CBD5DF" strokeWidth="1" />; })}
      <polygon points={dataPath} fill="rgba(199,66,66,.13)" stroke="#C74242" strokeWidth="2.6" />
      {dataPoints.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.8" fill="#C74242" stroke="#fff" strokeWidth="2" />)}
      {DIMENSIONS.map((d, i) => { const [x, y] = pointAt(i, maxR + 24); return <text key={d.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill="#526070" fontWeight="800">{d.short.toUpperCase()}</text>; })}
    </svg>
  );
}

function AppHeader({ onMethodology }) {
  return (
    <header className="relative z-30 flex h-16 flex-shrink-0 items-center border-b border-[#DCE4EA] bg-white/[0.92] px-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E0E5EA] bg-white p-1 shadow-sm"><img src="/ctso-logo.png" alt="Çorlu TSO" className="h-full w-full object-contain" /></div>
          <div className="min-w-0"><div className="truncate text-[10px] font-extrabold uppercase tracking-[.16em] text-[#B73737]">Çorlu Ticaret ve Sanayi Odası</div><div className="truncate text-sm font-extrabold tracking-tight text-[#10243D] sm:text-base">Üye Dönüşüm Portalı</div></div>
        </div>
        <div className="hidden items-center gap-2 lg:flex"><span className="rounded-xl border border-[#E2E7EB] bg-[#F7F9FA] px-3 py-2 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#596979]">Afet & İş Sürekliliği Skorkartı</span><button onClick={onMethodology} className="rounded-xl bg-[#10243D] px-3.5 py-2 text-[9px] font-extrabold uppercase tracking-[.12em] text-white transition hover:bg-[#183653]">Metodoloji</button></div>
        <button onClick={onMethodology} className="rounded-xl border border-[#DCE3E9] bg-white px-3 py-2 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#536473] lg:hidden">Metodoloji</button>
      </div>
    </header>
  );
}

export default function App() {
  const [step, setStep] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showMethodology, setShowMethodology] = useState(false);
  const [showKVKK, setShowKVKK] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [contact, setContact] = useState({ companyName: "", contactName: "", email: "", phone: "" });
  const [contactErrors, setContactErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pdfState, setPdfState] = useState("idle");
  const [resultTab, setResultTab] = useState("overview");

  const currentQ = QUESTIONS[qIndex];
  const currentDim = currentQ ? DIMENSIONS.find((d) => d.key === currentQ.dim) : DIMENSIONS[0];

  const handleAnswer = (value) => {
    const next = { ...answers, [currentQ.id]: value };
    setAnswers(next);
    if (qIndex < QUESTIONS.length - 1) setQIndex(qIndex + 1);
    else setStep("contact");
  };

  const { overall, byDim } = useMemo(() => {
    const dimScores = {};
    DIMENSIONS.forEach((d) => {
      const qs = QUESTIONS.filter((q) => q.dim === d.key);
      const vals = qs.map((q) => answers[q.id]).filter(Boolean);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      dimScores[d.key] = vals.length ? ((avg - 1) / 4) * 100 : 0;
    });
    const allVals = Object.values(answers);
    const overallAvg = allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;
    return { overall: allVals.length ? ((overallAvg - 1) / 4) * 100 : 0, byDim: dimScores };
  }, [answers]);

  const level = getLevel(overall);
  const weakestDims = [...DIMENSIONS].sort((a, b) => byDim[a.key] - byDim[b.key]).slice(0, 3).map((d) => {
    const dLevel = getLevel(byDim[d.key]);
    const levelIndex = LEVELS.indexOf(dLevel);
    return { ...d, dLevel, levelIndex, scenario: DIM_SCENARIOS[d.key][levelIndex] };
  });

  const progress = ((qIndex + (step === "quiz" ? 0 : 1)) / QUESTIONS.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const handleDownloadPdf = async () => {
    setPdfState("generating");
    try {
      await generateAfetPdfReport({ companyName: contact.companyName, contactName: contact.contactName, dimensions: DIMENSIONS, overall, byDim, level, weakestDims });
      setPdfState("done");
    } catch (e) {
      console.error("PDF üretim hatası:", e);
      setPdfState("error");
    }
  };

  const restart = () => {
    setAnswers({}); setQIndex(0); setStep("intro"); setKvkkAccepted(false); setResultTab("overview");
    setContact({ companyName: "", contactName: "", email: "", phone: "" }); setContactErrors({}); setSubmitError(""); setPdfState("idle");
  };

  const handleContactChange = (field) => (e) => {
    setContact((prev) => ({ ...prev, [field]: e.target.value }));
    setContactErrors((prev) => prev[field] ? { ...prev, [field]: null } : prev);
  };

  const validateContact = () => {
    const errs = {};
    if (!contact.companyName.trim()) errs.companyName = "Firma adı zorunludur";
    if (!contact.contactName.trim()) errs.contactName = "Ad soyad zorunludur";
    if (!contact.email.trim()) errs.email = "E-posta zorunludur";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) errs.email = "Geçerli bir e-posta girin";
    if (!contact.phone.trim()) errs.phone = "Telefon zorunludur";
    else if (contact.phone.replace(/\D/g, "").length < 10) errs.phone = "Geçerli bir telefon girin";
    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!validateContact()) return;
    setSubmitting(true); setSubmitError("");
    const { error } = await supabase.from("skorkart_basvurular").insert({
      company_name: contact.companyName.trim(), contact_name: contact.contactName.trim(), email: contact.email.trim(), phone: contact.phone.trim(), overall_score: overall, level_name: level.name,
      risk_score: byDim.risk, emergency_score: byDim.emergency, it_score: byDim.it, supply_score: byDim.supply, people_score: byDim.people, testing_score: byDim.testing, answers, kvkk_consent: true,
    });
    setSubmitting(false);
    if (error) { console.error("Supabase kayıt hatası:", error); setSubmitError("Kaydınız gönderilirken bir sorun oluştu. Lütfen tekrar deneyin."); return; }
    setStep("results"); setResultTab("overview");
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#F3F6F8] text-[#1B2D40]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');`}</style>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(199,66,66,.07),transparent_25%),radial-gradient(circle_at_90%_85%,rgba(46,104,215,.06),transparent_24%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[.035]" style={{ backgroundImage: "linear-gradient(#10243D 1px,transparent 1px),linear-gradient(90deg,#10243D 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
      <AppHeader onMethodology={() => setShowMethodology(true)} />

      <main className="relative z-10 h-[calc(100dvh-64px)] overflow-hidden">
        {step === "intro" && (
          <section className="mx-auto grid h-full max-w-[1500px] grid-cols-1 gap-3 px-3 py-3 sm:px-6 lg:grid-cols-12 lg:gap-4 lg:px-8 lg:py-4">
            <div className="relative hidden min-h-0 overflow-hidden rounded-[30px] bg-[#10243D] p-7 text-white shadow-[0_24px_70px_rgba(16,36,61,.16)] lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#C74242]/[0.25]" />
              <div className="absolute -bottom-20 -left-14 h-64 w-64 rounded-full border-[42px] border-white/[.035]" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[.06] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#F0B1B1]"><Icon name="shield" size={13} /> BCM · Dayanıklılık · Süreklilik</div>
                <h1 className="mt-5 max-w-xl text-[clamp(2.35rem,4vw,4.6rem)] font-extrabold leading-[.98] tracking-[-.055em]" style={{ fontFamily: "'Manrope', sans-serif" }}>Kriz gelmeden önce dayanıklılığınızı görün.</h1>
                <p className="mt-4 max-w-lg text-[12px] leading-6 text-white/[0.62]">Afet, siber olay ve tedarik kesintilerine karşı işletmenizin hazırlık seviyesini 18 soruda ölçün; kritik boşlukları ve uygulanabilir öncelikleri netleştirin.</p>
              </div>
              <div className="relative z-10 grid grid-cols-3 gap-2.5">
                {[["18", "Soru"], ["6", "Boyut"], ["100", "Puan"]].map(([x, y]) => <div key={y} className="rounded-2xl border border-white/[0.10] bg-white/[.06] p-3.5"><div className="text-2xl font-black text-[#F0B1B1]">{x}</div><div className="mt-0.5 text-[8px] font-extrabold uppercase tracking-[.13em] text-white/[0.45]">{y}</div></div>)}
              </div>
            </div>

            <div className="flex min-h-0 flex-col rounded-[30px] border border-white/[0.80] bg-white/[0.92] p-4 shadow-[0_20px_60px_rgba(16,42,68,.09)] backdrop-blur-xl sm:p-5 lg:col-span-7">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[9px] font-extrabold uppercase tracking-[.17em] text-[#C74242]">Değerlendirme mimarisi</div><h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#14283F]">6 boyutta bütüncül dayanıklılık görünümü</h2></div><div className="rounded-xl bg-[#F8E8E8] px-2.5 py-1.5 text-[9px] font-black text-[#B73737]">BCM</div></div>
              <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-2.5">
                {DIMENSIONS.map((d, i) => (
                  <div key={d.key} className="flex min-h-0 flex-col rounded-[18px] border border-[#E0E6EB] bg-[#F9FAFB] p-3.5 sm:p-4">
                    <div className="flex items-start gap-3"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#F8E8E8] text-[#B73737]"><Icon name={DIM_ICONS[d.key]} size={17} /></div><div><div className="text-[9px] font-black text-[#C74242]">0{i + 1}</div><div className="text-[12px] font-extrabold leading-4 text-[#1A2E44] sm:text-[13px]">{d.label}</div></div></div>
                    <div className="intro-ref mt-2 text-[9.5px] leading-4 text-[#778592]">{d.ref}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-shrink-0 items-center gap-3 rounded-[18px] border border-[#E0E6EB] bg-[#F7F9FA] p-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5"><input type="checkbox" checked={kvkkAccepted} onChange={(e) => setKvkkAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#C74242]" /><span className="text-[10px] leading-4 text-[#637280]"><button type="button" onClick={(e) => { e.preventDefault(); setShowKVKK(true); }} className="font-extrabold text-[#10243D] underline decoration-[#C74242]/40 underline-offset-2">KVKK Aydınlatma Metni</button>'ni okudum ve kişisel verilerimin belirtilen amaçlarla işlenmesini onaylıyorum.</span></label>
                <button onClick={() => kvkkAccepted && setStep("quiz")} disabled={!kvkkAccepted} className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-[#C74242] px-4 py-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#B73737] disabled:cursor-not-allowed disabled:bg-[#CBD3DA]">Değerlendirmeyi Başlat <Icon name="arrowRight" size={14} /></button>
              </div>
            </div>
          </section>
        )}

        {step === "quiz" && currentQ && (
          <section className="mx-auto grid h-full max-w-[1500px] grid-cols-1 gap-3 px-3 py-3 sm:px-6 lg:grid-cols-12 lg:gap-4 lg:px-8 lg:py-4">
            <aside className="hidden min-h-0 flex-col rounded-[28px] bg-[#10243D] p-5 text-white lg:col-span-3 lg:flex">
              <div className="text-[9px] font-extrabold uppercase tracking-[.17em] text-[#F0B1B1]">Değerlendirme ilerlemesi</div>
              <div className="mt-2 text-3xl font-black">{qIndex + 1}<span className="text-sm text-white/[0.35]"> / {QUESTIONS.length}</span></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.10]"><div className="h-full rounded-full bg-[#C74242] transition-all" style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%` }} /></div>
              <div className="mt-5 grid min-h-0 flex-1 auto-rows-fr gap-1.5">
                {DIMENSIONS.map((d, i) => {
                  const dimQuestions = QUESTIONS.filter((q) => q.dim === d.key);
                  const done = dimQuestions.filter((q) => answers[q.id]).length;
                  const active = currentDim.key === d.key;
                  return <div key={d.key} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${active ? "bg-white/[.09]" : "bg-white/[.035]"}`}><div className={`flex h-7 w-7 items-center justify-center rounded-lg ${active ? "bg-[#C74242] text-white" : "bg-white/[.06] text-white/[0.45]"}`}><Icon name={DIM_ICONS[d.key]} size={14} /></div><div className="min-w-0 flex-1"><div className={`truncate text-[10px] font-extrabold ${active ? "text-white" : "text-white/[0.55]"}`}>{d.short}</div><div className="mt-0.5 text-[8px] text-white/[0.30]">{done}/{dimQuestions.length} tamamlandı</div></div></div>;
                })}
              </div>
              <div className="mt-3 rounded-xl border border-white/[0.10] bg-white/[.05] p-3 text-[9px] leading-4 text-white/[0.50]">Yanıtlar 1'den 5'e olgunluk ölçeğinde değerlendirilir.</div>
            </aside>

            <div className="flex min-h-0 flex-col rounded-[28px] border border-white/[0.80] bg-white/[0.92] p-4 shadow-[0_20px_60px_rgba(16,42,68,.09)] backdrop-blur-xl sm:p-5 lg:col-span-9">
              <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#E3E8EC] pb-3">
                <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F8E8E8] text-[#B73737]"><Icon name={DIM_ICONS[currentDim.key]} size={18} /></div><div className="min-w-0"><div className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#C74242]">Boyut · {currentDim.short}</div><div className="truncate text-sm font-extrabold text-[#152B42] sm:text-base">{currentDim.label}</div></div></div>
                <div className="rounded-xl border border-[#E1E6EB] bg-[#F7F9FA] px-3 py-1.5 text-[9px] font-extrabold text-[#536373]">{answeredCount}/{QUESTIONS.length} yanıt</div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-center py-3 sm:py-4">
                <div className="mx-auto w-full max-w-4xl">
                  <div className="mb-2 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#8B98A4]">Soru {qIndex + 1} / {QUESTIONS.length}</div>
                  <h2 className="question-title max-w-4xl text-[clamp(1.2rem,2.1vw,2rem)] font-extrabold leading-[1.18] tracking-[-.025em] text-[#10243D]" style={{ fontFamily: "'Manrope', sans-serif" }}>{currentQ.text}</h2>
                  <div className="mt-4 grid gap-2">
                    {currentQ.options.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(i + 1)} className="answer-option group flex w-full items-center gap-3 rounded-[16px] border border-[#DDE4E9] bg-[#FAFBFC] px-3.5 py-3 text-left transition hover:border-[#C74242]/[0.55] hover:bg-[#FFF7F7] sm:px-4">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-[#E1E6EA] bg-white text-[10px] font-black text-[#B73737] transition group-hover:border-[#C74242] group-hover:bg-[#C74242] group-hover:text-white">0{i + 1}</span>
                        <span className="option-copy text-[11.5px] font-semibold leading-5 text-[#425466] sm:text-[12.5px]">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center justify-between border-t border-[#E3E8EC] pt-3">
                <button onClick={() => qIndex > 0 && setQIndex(qIndex - 1)} disabled={qIndex === 0} className="flex items-center gap-1.5 rounded-xl border border-[#D9E1E7] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#536273] disabled:opacity-35"><Icon name="arrowLeft" size={14} /> Geri</button>
                <div className="hidden text-[9px] font-bold text-[#8B97A3] sm:block">1: Başlangıç &nbsp; · &nbsp; 3: Kısmen Yönetilen &nbsp; · &nbsp; 5: Olgun / Sistematik</div>
                <div className="text-[9px] font-extrabold text-[#C74242]">%{Math.round(((qIndex + 1) / QUESTIONS.length) * 100)}</div>
              </div>
            </div>
          </section>
        )}

        {step === "contact" && (
          <section className="mx-auto grid h-full max-w-[1200px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-5">
            <div className="hidden min-h-0 flex-col justify-between overflow-hidden rounded-[28px] bg-[#10243D] p-7 text-white lg:col-span-5 lg:flex">
              <div><div className="inline-flex items-center gap-2 rounded-full bg-white/[.07] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#F0B1B1]"><Icon name="shield" size={13} /> Son adım</div><h2 className="mt-5 text-[clamp(2rem,3.3vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-.045em]" style={{ fontFamily: "'Manrope', sans-serif" }}>Dayanıklılık karnenizi kişiselleştirelim.</h2><p className="mt-4 max-w-md text-[12px] leading-6 text-white/[0.60]">İletişim bilgileriniz yalnızca sonuç raporunun sunulması ve Çorlu TSO'nun dönüşüm destekleri kapsamında gelişiminizin takip edilebilmesi için kullanılır.</p></div>
              <div className="grid grid-cols-3 gap-2.5">{[["18", "Yanıt"], [Math.round(overall), "Ön Skor"], ["PDF", "Rapor"]].map(([x, y]) => <div key={y} className="rounded-2xl border border-white/[0.10] bg-white/[.06] p-3"><div className="text-xl font-black text-[#F0B1B1]">{x}</div><div className="mt-0.5 text-[8px] font-extrabold uppercase tracking-[.12em] text-white/[0.45]">{y}</div></div>)}</div>
            </div>

            <div className="flex min-h-0 flex-col justify-center rounded-[28px] border border-white/[0.80] bg-white/[0.92] p-5 shadow-[0_20px_60px_rgba(16,42,68,.10)] backdrop-blur-xl sm:p-7 lg:col-span-7">
              <div className="mx-auto w-full max-w-xl">
                <div className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#C74242]">Sonuçlara erişim</div><h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#14283F] sm:text-2xl">Sonucunuzu görmek için bilgilerinizi girin</h2><p className="mt-1.5 text-[10px] leading-5 text-[#71808E] sm:text-[11px]">Afet & iş sürekliliği karneniz ve PDF raporunuz kayıt sonrasında görüntülenecektir.</p>
                <form onSubmit={handleContactSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["companyName", "Firma Adı *", "Örn. ABC Makine Sanayi", "text", "sm:col-span-2"],
                    ["contactName", "Ad Soyad *", "Yetkili adı soyadı", "text", "sm:col-span-2"],
                    ["email", "E-posta *", "ornek@firma.com", "email", ""],
                    ["phone", "Telefon *", "05XX XXX XX XX", "tel", ""],
                  ].map(([field, label, placeholder, type, span]) => <div key={field} className={span}><label className="mb-1 block text-[9px] font-extrabold uppercase tracking-[.1em] text-[#677583]">{label}</label><input type={type} value={contact[field]} onChange={handleContactChange(field)} placeholder={placeholder} className={`w-full rounded-xl border bg-[#FBFCFD] px-3.5 py-2.5 text-[11px] outline-none transition focus:border-[#C74242] focus:ring-2 focus:ring-[#C74242]/[0.10] ${contactErrors[field] ? "border-red-400" : "border-[#D8E0E6]"}`} />{contactErrors[field] && <p className="mt-1 text-[9px] text-red-600">{contactErrors[field]}</p>}</div>)}
                  {submitError && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[10px] font-semibold text-red-700">{submitError}</p>}
                  <div className="mt-1 flex items-center justify-between sm:col-span-2"><button type="button" onClick={() => setStep("quiz")} className="flex items-center gap-1 rounded-xl border border-[#D9E1E7] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#596777]"><Icon name="arrowLeft" size={13} /> Geri</button><button type="submit" disabled={submitting} className="flex items-center gap-1.5 rounded-xl bg-[#C74242] px-5 py-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#B73737] disabled:opacity-50">{submitting ? "Kaydediliyor…" : "Sonucumu Görüntüle"}{!submitting && <Icon name="arrowRight" size={13} />}</button></div>
                </form>
              </div>
            </div>
          </section>
        )}

        {step === "results" && (
          <section className="mx-auto flex h-full max-w-[1500px] flex-col px-3 py-3 sm:px-6 lg:px-8 lg:py-4">
            <div className="flex flex-shrink-0 items-center justify-between gap-3 rounded-[20px] border border-white/[0.80] bg-white/[0.92] px-4 py-2.5 shadow-[0_10px_30px_rgba(19,47,75,.06)] backdrop-blur-xl">
              <div className="min-w-0"><div className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#C74242]">Nihai değerlendirme</div><div className="truncate text-sm font-extrabold text-[#152B42] sm:text-base">{contact.companyName || "İşletme"} · {level.name}</div></div>
              <div className="flex items-center gap-2"><div className="rounded-xl bg-[#F8E8E8] px-3 py-1.5 text-sm font-black text-[#B73737]">{Math.round(overall)}<span className="text-[9px] font-bold text-[#B73737]/[0.55]">/100</span></div><button onClick={restart} className="hidden rounded-xl border border-[#DCE3E9] bg-white px-3 py-2 text-[9px] font-extrabold text-[#536473] sm:block">Yeniden Başlat</button></div>
            </div>

            <div className="mt-2 grid flex-shrink-0 grid-cols-4 gap-1.5 rounded-[16px] border border-[#E0E6EB] bg-[#EDF1F4] p-1.5">
              {[["overview", "Genel Bakış"], ["dimensions", "6 Boyut"], ["actions", "Aksiyonlar"], ["report", "Rapor"]].map(([key, label]) => <button key={key} onClick={() => setResultTab(key)} className={`rounded-xl px-2 py-2 text-[9px] font-extrabold transition sm:text-[10px] ${resultTab === key ? "bg-[#10243D] text-white shadow-sm" : "text-[#657483] hover:bg-white"}`}>{label}</button>)}
            </div>

            <div className="mt-2 min-h-0 flex-1 overflow-hidden">
              {resultTab === "overview" && (
                <div className="grid h-full min-h-0 grid-cols-2 gap-2.5 md:grid-cols-3">
                  <div className="flex min-h-0 flex-col justify-center rounded-[22px] border border-[#DCE8E1] bg-white p-4 shadow-[0_10px_30px_rgba(4,49,38,.05)]"><div className="text-[9px] font-extrabold uppercase tracking-[.17em] text-[#789187]">Genel dayanıklılık skoru</div><Gauge value={overall} /><div className="mx-auto rounded-full border border-[#F2CACA] bg-[#FFF4F4] px-3 py-1 text-[10px] font-extrabold text-[#B73737]">{level.name}</div><p className="overview-desc mx-auto mt-2 max-w-sm text-center text-[10px] leading-4 text-[#6F7E8C]">{level.desc}</p></div>
                  <div className="hidden min-h-0 flex-col justify-center rounded-[22px] border border-[#DCE8E1] bg-white p-4 shadow-[0_10px_30px_rgba(4,49,38,.05)] md:flex"><div className="text-[9px] font-extrabold uppercase tracking-[.17em] text-[#789187]">6 boyutlu görünüm</div><RadarChart byDim={byDim} /></div>
                  <div className="flex min-h-0 flex-col rounded-[22px] border border-[#DCE8E1] bg-white p-4 shadow-[0_10px_30px_rgba(4,49,38,.05)]"><div className="text-[9px] font-extrabold uppercase tracking-[.17em] text-[#789187]">İlk 3 öncelik</div><div className="mt-3 grid min-h-0 flex-1 auto-rows-fr gap-2">{weakestDims.map((d, i) => <div key={d.key} className="flex min-h-0 items-center gap-3 rounded-2xl border border-[#E1E7EB] bg-[#F8FAFB] p-3"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#F8E8E8] text-[#B73737]"><Icon name={DIM_ICONS[d.key]} size={16} /></div><div className="min-w-0 flex-1"><div className="text-[9px] font-black text-[#C74242]">0{i + 1}</div><div className="truncate text-[11px] font-extrabold text-[#263B50]">{d.label}</div></div><div className="text-sm font-black text-[#10243D]">{Math.round(byDim[d.key])}</div></div>)}</div></div>
                </div>
              )}

              {resultTab === "dimensions" && (
                <div className="grid h-full min-h-0 grid-cols-2 gap-2 sm:grid-cols-3">
                  {DIMENSIONS.map((d, i) => <div key={d.key} className="flex min-h-0 flex-col justify-between rounded-[20px] border border-[#DFE5EA] bg-white p-3.5 shadow-[0_8px_24px_rgba(12,31,54,.045)]"><div className="flex items-start gap-2.5"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#F8E8E8] text-[#B73737]"><Icon name={DIM_ICONS[d.key]} size={16} /></div><div><div className="text-[9px] font-black text-[#C74242]">0{i + 1}</div><div className="text-[11px] font-extrabold leading-4 text-[#263B50] sm:text-xs">{d.label}</div></div></div><div><div className="mb-1.5 flex items-end justify-between"><span className="text-[9px] font-bold text-[#84909B]">Olgunluk skoru</span><span className="text-xl font-black text-[#10243D]">{Math.round(byDim[d.key])}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#E9EDF0]"><div className="h-full rounded-full bg-[#C74242]" style={{ width: `${byDim[d.key]}%` }} /></div><div className="dim-ref mt-2 text-[9px] leading-4 text-[#7B8894]">{d.ref}</div></div></div>)}
                </div>
              )}

              {resultTab === "actions" && (
                <div className="grid h-full min-h-0 grid-cols-1 gap-2.5 md:grid-cols-3">
                  {weakestDims.map((d, idx) => <div key={d.key} className="flex min-h-0 flex-col rounded-[22px] border border-[#DFE5EA] bg-white p-4 shadow-[0_10px_30px_rgba(12,31,54,.05)]"><div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#F8E8E8] text-[#B73737]"><Icon name={DIM_ICONS[d.key]} size={16} /></div><div className="min-w-0"><div className="text-[8px] font-black uppercase tracking-[.12em] text-[#C74242]">Öncelik 0{idx + 1}</div><div className="truncate text-[11px] font-extrabold text-[#263B50]">{d.label}</div></div></div><div className="rounded-lg bg-[#F4F6F8] px-2 py-1 text-[9px] font-extrabold text-[#607080]">{Math.round(byDim[d.key])}/100</div></div><p className="action-scenario mt-3 text-[10px] leading-5 text-[#637280]">{d.scenario.scenario}</p><div className="mt-3 grid min-h-0 flex-1 auto-rows-fr gap-2">{d.scenario.actions.map((act, i) => <div key={i} className="flex min-h-0 gap-2 rounded-xl border border-[#E6EAED] bg-[#F9FAFB] p-2.5"><span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-[#10243D] text-[8px] font-black text-white">{i + 1}</span><span className="action-copy text-[9.5px] font-semibold leading-4 text-[#526272]">{act}</span></div>)}</div></div>)}
                </div>
              )}

              {resultTab === "report" && (
                <div className="grid h-full min-h-0 grid-cols-1 gap-2.5 lg:grid-cols-[1.1fr_.9fr]">
                  <div className="flex min-h-0 flex-col justify-between rounded-[24px] bg-[#10243D] p-5 text-white sm:p-6"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/[.07] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#F0B1B1]"><Icon name="file" size={13} /> Kurumsal çıktı</div><h3 className="mt-4 text-2xl font-extrabold tracking-[-.035em] sm:text-3xl" style={{ fontFamily: "'Manrope', sans-serif" }}>Afet & İş Sürekliliği Sonuç Raporu</h3><p className="mt-3 max-w-xl text-[11px] leading-5 text-white/[0.60]">PDF raporu; genel skorunuzu, 6 boyut skorunu, en zayıf alanları ve öncelikli aksiyonları tek dokümanda bir araya getirir.</p></div><div className="grid grid-cols-3 gap-2.5">{[[Math.round(overall), "Genel Skor"], [level.name, "Seviye"], ["3", "Öncelik"]].map(([x, y]) => <div key={y} className="rounded-2xl border border-white/[0.10] bg-white/[.06] p-3"><div className="truncate text-lg font-black text-[#F0B1B1]">{x}</div><div className="mt-0.5 text-[8px] font-extrabold uppercase tracking-[.12em] text-white/[0.40]">{y}</div></div>)}</div></div>
                  <div className="flex min-h-0 flex-col justify-center rounded-[24px] border border-[#DFE5EA] bg-white p-5 sm:p-6"><div className="mx-auto w-full max-w-md"><div className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#C74242]">Rapor merkezi</div><h3 className="mt-1 text-xl font-extrabold tracking-tight text-[#14283F]">PDF raporunuzu indirin</h3><p className="mt-2 text-[10px] leading-5 text-[#6F7E8C]">Rapor firma adınız ve yetkili bilgilerinizle oluşturulur. Sonuç ekranındaki veriler değiştirilmeden PDF'e aktarılır.</p><button onClick={handleDownloadPdf} disabled={pdfState === "generating"} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C74242] px-5 py-3 text-[10px] font-extrabold text-white transition hover:bg-[#B73737] disabled:opacity-50"><Icon name="download" size={15} />{pdfState === "generating" ? "Rapor hazırlanıyor…" : pdfState === "done" ? "PDF Raporunu Tekrar İndir" : "PDF Raporunu İndir"}</button><button onClick={restart} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#D9E1E7] bg-white px-5 py-3 text-[10px] font-extrabold text-[#536273]"><Icon name="refresh" size={14} /> Yeni Değerlendirme Başlat</button>{pdfState === "error" && <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[9px] font-semibold text-red-700">PDF oluşturulamadı. Lütfen tekrar deneyin.</div>}</div></div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
      {showKVKK && <KVKKModal onClose={() => setShowKVKK(false)} />}
    </div>
  );
}
