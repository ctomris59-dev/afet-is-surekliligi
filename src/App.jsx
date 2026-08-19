import React, { useState, useMemo } from "react";

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

function MethodologyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="bg-[#FAF9F6] border border-slate-900 max-w-xl w-full max-h-[85vh] overflow-y-auto p-8 md:p-12 text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-8 pb-4 border-b border-slate-900">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 block mb-1">DOKÜMAN #01</span>
            <h3 className="text-xl font-bold tracking-tight uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Metodoloji &amp; Dayanaklar</h3>
          </div>
          <button onClick={onClose} className="font-mono text-xs uppercase text-slate-500 hover:text-slate-900 transition">
            [KAPAT]
          </button>
        </div>
        <div className="space-y-6 text-xs leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div>
            <p className="font-mono text-[10px] text-red-700 uppercase font-bold mb-0.5">// 01 STANDARDİZASYON</p>
            <p className="font-bold text-sm text-slate-900 mb-1">ISO 22301:2019 — İş Sürekliliği Yönetim Sistemi</p>
            <p className="text-slate-600">Risk değerlendirmesi, iş etki analizi (BIA), süreklilik stratejisi, plan geliştirme, tatbikat/test ve PUKÖ döngüsü bu standardın ana yapı taşlarıdır.</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-red-700 uppercase font-bold mb-0.5">// 02 AFET RİSKİ</p>
            <p className="font-bold text-sm text-slate-900 mb-1">UNDRR Sendai Afet Risk Azaltma Çerçevesi (2015-2030)</p>
            <p className="text-slate-600">BM çerçevesinin ilk önceliği olan "afet riskini anlamak", Risk &amp; Tehlike Analizi boyutunun temelini oluşturur.</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-red-700 uppercase font-bold mb-0.5">// 03 YASAL MEVZUAT</p>
            <p className="font-bold text-sm text-slate-900 mb-1">6331 Sayılı İş Sağlığı ve Güvenliği Kanunu</p>
            <p className="text-slate-600">Acil durum planı hazırlama, tahliye düzenlemeleri yapma ve çalışanları bilgilendirme yükümlülüklerini esas alır.</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-red-700 uppercase font-bold mb-0.5">// 04 BT SÜREKLİLİĞİ</p>
            <p className="font-bold text-sm text-slate-900 mb-1">NIST SP 800-34 — Olağanüstü Durum Planlama Rehberi</p>
            <p className="text-slate-600">Bilgi sistemleri sürekliliği için ABD Ulusal Standartlar Enstitüsü'nün rehberini temel alır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showMethodology, setShowMethodology] = useState(false);

  const currentQ = QUESTIONS[qIndex];

  const handleAnswer = (value) => {
    const next = { ...answers, [currentQ.id]: value };
    setAnswers(next);
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setStep("results");
    }
  };

  const { overall, byDim } = useMemo(() => {
    const dimScores = {};
    DIMENSIONS.forEach((d) => {
      const qs = QUESTIONS.filter((q) => q.dim === d.key);
      const vals = qs.map((q) => answers[q.id]).filter(Boolean);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      dimScores[d.key] = ((avg - 1) / 4) * 100;
    });
    const allVals = Object.values(answers);
    const overallAvg = allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;
    return { overall: ((overallAvg - 1) / 4) * 100, byDim: dimScores };
  }, [answers]);

  const level = getLevel(overall);
  const weakestDims = [...DIMENSIONS]
    .sort((a, b) => byDim[a.key] - byDim[b.key])
    .slice(0, 3)
    .map((d) => {
      const dLevel = getLevel(byDim[d.key]);
      const levelIndex = LEVELS.indexOf(dLevel);
      return { ...d, dLevel, levelIndex, scenario: DIM_SCENARIOS[d.key][levelIndex] };
    });

  const restart = () => { setAnswers({}); setQIndex(0); setStep("intro"); };

  return (
    <div className="h-screen w-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-between overflow-hidden relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Font Injections */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
      `}</style>

      {/* Açık Renk Mimari Duvar Kağıdı Deseni */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF9F6] via-[#F5F3EF] to-[#EFECE6] pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z' fill='%3C%23000000%3E'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Header */}
      <header className="border-b border-slate-900/10 px-8 py-5 flex-shrink-0 relative z-10 bg-[#FAF9F6]/80 backdrop-blur-md print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-red-700 font-bold block">KURUMSAL SKORKART</span>
            <h1 className="font-bold text-base md:text-lg tracking-tight text-slate-900 uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Çorlu Ticaret ve Sanayi Odası
            </h1>
          </div>
          <button
            onClick={() => setShowMethodology(true)}
            className="font-mono text-[11px] uppercase tracking-widest border border-slate-900 rounded-none px-4 py-2 hover:bg-slate-900 hover:text-white transition duration-200 text-slate-800"
          >
            METODOLOJİ
          </button>
        </div>
      </header>

      {/* Main Container - Kaydırmasız Tam Ekran */}
      <main className="max-w-5xl mx-auto px-6 py-4 flex-1 w-full flex items-center justify-center relative z-10 overflow-hidden">
        <div className="w-full">

          {/* ---------------- INTRO ---------------- */}
          {step === "intro" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className="md:col-span-8">
                <span className="font-mono text-[11px] uppercase tracking-widest text-red-700 block mb-3 font-bold">
                  [ ISO 22301 · SENDAİ ÇERÇEVESİ · 6331 S. KANUN ]
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 uppercase leading-none mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  İşletmeniz bir kriz anında ne kadar dayanıklı?
                </h2>
                <p className="text-slate-600 text-sm md:text-base font-normal max-w-xl leading-relaxed">
                  18 soruluk bu editoryal öz-değerlendirme; kurumunuzun afet, siber kriz ve tedarik kesintilerine karşı olgunluk seviyesini ölçer.
                </p>
              </div>

              <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-900/10 pt-6 md:pt-0 md:pl-8 flex flex-col justify-between">
                <div className="space-y-2 font-mono text-[11px] uppercase tracking-widest text-slate-500 mb-6">
                  {DIMENSIONS.map((d, i) => (
                    <div key={d.key} className="flex justify-between border-b border-slate-900/10 pb-1.5">
                      <span>0{i + 1}. {d.short}</span>
                      <span className="text-slate-900 font-bold">✓</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep("quiz")}
                  className="w-full bg-slate-900 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-widest py-4 px-6 transition duration-300 text-center font-bold"
                >
                  DEĞERLENDİRMEYİ BAŞLAT →
                </button>
              </div>
            </div>
          )}

          {/* ---------------- QUIZ (Kaydırmasız Tek Sayfa Düzeni) ---------------- */}
          {step === "quiz" && currentQ && (
            <div className="max-w-3xl mx-auto flex flex-col justify-between h-auto">
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-900/10 pb-2">
                  <span className="text-red-700 font-bold">// BOYUT: {DIMENSIONS.find((d) => d.key === currentQ.dim)?.label.toUpperCase()}</span>
                  <span>SORU {qIndex + 1} / {QUESTIONS.length}</span>
                </div>

                <h2 className="text-lg md:text-xl font-bold text-slate-900 uppercase leading-snug mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {currentQ.text}
                </h2>

                <div className="space-y-2.5">
                  {currentQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i + 1)}
                      className="w-full text-left p-4 bg-white/80 border border-slate-900/15 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition duration-150 flex items-center gap-4 group"
                    >
                      <span className="font-mono text-[11px] uppercase tracking-widest text-slate-400 group-hover:text-red-500 font-bold">
                        [0{i + 1}]
                      </span>
                      <span className="text-xs md:text-sm font-medium tracking-tight">
                        {opt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {qIndex > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setQIndex(qIndex - 1)}
                    className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-900 transition"
                  >
                    ← ÖNCEKİ SORUYA DÖN
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---------------- RESULTS ---------------- */}
          {step === "results" && (
            <div className="max-w-4xl mx-auto overflow-y-auto max-h-[75vh] pr-2">
              <div className="border-b border-slate-900/10 pb-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-8">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-red-700 block mb-1 font-bold">// NİHAİ DEĞERLENDİRME</span>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {level.name}
                    </h2>
                  </div>
                  <div className="md:col-span-4 flex flex-col md:items-end justify-end">
                    <div className="font-mono text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-none">
                      {Math.round(overall)}<span className="text-base text-slate-400">/100</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mt-3 max-w-2xl leading-relaxed">
                  {level.desc}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-900/10 pb-1">// BOYUT BAZLI ANALİZ</h3>
                  <div className="space-y-2.5">
                    {DIMENSIONS.map((d) => (
                      <div key={d.key} className="border-b border-slate-900/10 pb-2">
                        <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest mb-1">
                          <span className="font-bold text-slate-900">{d.label}</span>
                          <span className="text-slate-500">%{Math.round(byDim[d.key])}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-none overflow-hidden">
                          <div className="bg-slate-900 h-1.5 transition-all duration-1000" style={{ width: `${byDim[d.key]}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-900/10 pb-1">// ÖNCELİKLİ AKSİYONLAR VE SENARYO</h3>
                  <div className="space-y-4">
                    {weakestDims.map((d) => (
                      <div key={d.key} className="border-l-2 border-slate-900 pl-3 py-0.5">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-red-700 font-bold">{d.label}</span>
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-slate-200 text-slate-800 font-bold">
                            {d.dLevel.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{d.scenario.scenario}</p>
                        <ul className="space-y-1">
                          {d.scenario.actions.map((act, i) => (
                            <li key={i} className="text-[11px] text-slate-700 flex gap-1.5">
                              <span className="font-mono text-slate-400 font-bold">0{i + 1}.</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-widest py-3.5 px-6 transition duration-200 font-bold"
                >
                  PDF RAPORU İNDİR →
                </button>
                <button
                  onClick={restart}
                  className="border border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-mono text-xs uppercase tracking-widest py-3.5 px-6 transition duration-200 font-bold"
                >
                  YENİDEN BAŞLAT
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/10 px-8 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-500 flex justify-between items-center flex-shrink-0 relative z-10 bg-[#FAF9F6]/80 backdrop-blur-md print:hidden">
        <span>ÇORLU TSO © 2026</span>
        <span>AFET &amp; İŞ SÜREKLİLİĞİ SKORKARTI</span>
      </footer>

      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
    </div>
  );
}
