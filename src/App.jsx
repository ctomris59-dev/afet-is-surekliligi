import React, { useState, useMemo } from "react";

/* ======================================================================
   ÇORLU TSO — AFET & İŞ SÜREKLİLİĞİ SKORKARTI (PROFESYONEL SÜRÜM)
   ----------------------------------------------------------------------
   Tasarım Notları:
   - Modern tipografi (Inter/Space Grotesk)
   - Kurumsal arka plan (Gradient + Backdrop Blur)
   - Genişletilmiş tam ekran arayüz yapısı
   ====================================================================== */

const DIMENSIONS = [
  { key: "risk", label: "Risk & Tehlike Analizi", short: "Risk", ref: "ISO 22301 md.8.2 / Sendai Öncelik 1" },
  { key: "emergency", label: "Acil Durum Müdahale Planı", short: "Müdahale", ref: "6331 s. Kanun / İşyeri Acil Durum Yönetmeliği" },
  { key: "it", label: "Veri & BT Sürekliliği", short: "BT", ref: "NIST SP 800-34 / ISO 22301 md.8.4" },
  { key: "supply", label: "Tedarik Zinciri & Operasyon", short: "Tedarik", ref: "ISO 22301 md.8.2.2 (BIA)" },
  { key: "people", label: "Çalışan Güvenliği & İletişim", short: "Çalışan", ref: "6331 s. Kanun / ISO 22301 md.8.4.3" },
  { key: "testing", label: "Tatbikat & Sürekli İyileştirme", short: "Tatbikat", ref: "ISO 22301 md.8.5 / md.9-10" },
];

const QUESTIONS = [
  { id: "r1", dim: "risk", text: "İşletmenizi etkileyebilecek afet ve kriz risklerini (deprem, yangın, sel, siber saldırı, tedarik kesintisi) ne ölçüde belirlediniz?", options: ["Sistematik bir risk değerlendirmesi yapılmadı", "Riskler biliniyor ama yazılı bir kaydı yok", "Temel riskler listelendi, olasılık/etki analizi eksik", "Yazılı risk değerlendirmesi var, düzenli gözden geçiriliyor", "Kapsamlı risk haritası var; dış veriyle (AFAD, sigorta vb.) destekleniyor"] },
  { id: "r2", dim: "risk", text: "İşyerinizin fiziksel risk analizi (bina durumu, konum, deprem/yangın dayanıklılığı) yapıldı mı?", options: ["Hiç yapılmadı", "Sadece yasal asgari önlemler (yangın tüpü vb.) mevcut", "Risk biliniyor ama azaltıcı bir plan yok", "Risk azaltıcı önlemlerin bir kısmı alındı", "Bağımsız uzman raporuyla doğrulandı, önlemler tamamlandı"] },
  { id: "r3", dim: "risk", text: "Kritik tedarikçi, müşteri ve altyapı bağımlılıklarınızın kesinti riski değerlendirildi mi?", options: ["Bu bağımlılıklar hiç haritalanmadı", "Ana bağımlılıklar biliniyor, riski değerlendirilmedi", "Kritik bağımlılıklar listelendi", "Kritik bağımlılıklar için risk seviyesi belirlendi", "Her kritik bağımlılık için alternatif/yedek çözüm tanımlı"] },
  { id: "e1", dim: "emergency", text: "Yazılı bir acil durum ve afet müdahale planınız var mı?", options: ["Yok", "Taslak halinde, resmi değil", "Var ama güncel değil / paylaşılmadı", "Var, çalışanlara duyuruldu", "Var, düzenli güncelleniyor ve ilgili mevzuata uygun"] },
  { id: "e2", dim: "emergency", text: "Acil durumda kimin hangi görevi üstleneceği (tahliye sorumlusu, ilk yardım, iletişim) tanımlı mı?", options: ["Görev tanımı yok", "Sözlü olarak biliniyor, yazılı değil", "Bazı roller yazılı tanımlı", "Tüm kritik roller yazılı ve atanmış", "Roller yazılı, yedekli ve tatbik edilmiş"] },
  { id: "e3", dim: "emergency", text: "İşyerinde toplanma noktası, tahliye yolları ve acil müdahale ekipmanı işaretli ve erişilebilir mi?", options: ["Hayır", "Kısmen, bazı alanlarda işaretleme var", "Çoğu alanda işaretli, düzenli kontrol edilmiyor", "Tüm alanlar işaretli, periyodik kontrol yapılıyor", "Tam uyumlu, kontrol kayıtları tutuluyor ve denetime hazır"] },
  { id: "i1", dim: "it", text: "Kritik iş verileriniz düzenli olarak yedekleniyor mu?", options: ["Yedekleme yok", "Düzensiz, manuel yedekleme yapılıyor", "Düzenli yedekleme var ama tek konumda saklanıyor", "Düzenli ve fiziksel olarak farklı konumda yedekleme var", "Otomatik, çoklu konumlu yedekleme + geri yükleme testleri yapılıyor"] },
  { id: "i2", dim: "it", text: "Bir siber saldırı veya sistem arızası durumunda işinize ne kadar sürede devam edebilirsiniz?", options: ["Bilmiyorum / hiç değerlendirilmedi", "1 haftadan uzun sürer", "2-7 gün içinde", "1-2 gün içinde", "Birkaç saat içinde (yedek sistem/BT sürekliliği planı var)"] },
  { id: "i3", dim: "it", text: "Çalışanlarınızın temel siber güvenlik farkındalığı var mı?", options: ["Hiç eğitim verilmedi", "Bilgilendirme yapıldı ama tekrarlanmadı", "Yıllık bilgilendirme var", "Düzenli eğitim + test yapılıyor", "Kapsamlı program var, sonuçlar ölçülüp iyileştiriliyor"] },
  { id: "s1", dim: "supply", text: "Ana tedarikçinizde yaşanacak bir kesinti için alternatif tedarikçi veya stok planınız var mı?", options: ["Yok, tek tedarikçiye bağımlıyız", "Farkındayız ama alternatif belirlenmedi", "Bazı kritik girdiler için alternatif belirlendi", "Kritik girdilerin çoğunda alternatif tedarikçi var", "Tüm kritik girdilerde alternatif + güvenlik stoku politikası var"] },
  { id: "s2", dim: "supply", text: "Üretim/hizmet sürecinizin hangi adımlarının 'kritik' olduğu belirlendi mi?", options: ["Hayır", "Genel bir fikrimiz var, yazılı değil", "Kritik adımlar listelendi", "Kritik adımlar için etki analizi (BIA) yapıldı", "BIA sonuçlarına göre öncelikli kurtarma sırası tanımlandı"] },
  { id: "s3", dim: "supply", text: "Bir kesinti sırasında müşterilerinize hizmeti sürdürebilecek minimum kapasite planı var mı?", options: ["Yok", "Fikir var, planlanmadı", "Kısmi bir plan var, test edilmedi", "Plan var, en kritik müşteriler için test edildi", "Kapsamlı süreklilik planı var, düzenli test ediliyor"] },
  { id: "p1", dim: "people", text: "Acil durumda çalışanlara/tedarikçilere hızlıca ulaşabileceğiniz bir iletişim sisteminiz var mı?", options: ["Yok", "Gayri resmi (kişisel telefonlar üzerinden)", "Temel bir liste var, güncel değil", "Güncel iletişim listesi ve yedek kanal var", "Çok kanallı, otomatik bildirim sistemi mevcut"] },
  { id: "p2", dim: "people", text: "Çalışanlarınız temel ilk yardım ve tahliye eğitimi aldı mı?", options: ["Hiç eğitim verilmedi", "Sadece işe giriş eğitiminde bahsedildi", "Bazı çalışanlar eğitim aldı", "Tüm çalışanlar periyodik eğitim alıyor", "Sertifikalı eğitim + tatbikatlarla pekiştiriliyor"] },
  { id: "p3", dim: "people", text: "Kriz anında karar verme yetkisi kilit kişide toplanıyorsa, o kişi ulaşılamazsa ne olacağı tanımlı mı?", options: ["Tanımlı değil, tek kişiye bağımlıyız", "Sözlü bir yedek var", "Yazılı yetki devri tanımlı", "Yazılı yetki devri + iletişim protokolü var", "Çok kademeli yedekleme, düzenli test ediliyor"] },
  { id: "t1", dim: "testing", text: "Acil durum planınızı en son ne zaman tatbikatla test ettiniz?", options: ["Hiç test edilmedi", "2 yıldan uzun süre önce", "Son 1-2 yıl içinde bir kez", "Yılda bir düzenli tatbikat yapılıyor", "Yılda birden fazla, farklı senaryolarla tatbikat yapılıyor"] },
  { id: "t2", dim: "testing", text: "Geçmişte yaşanan bir aksaklık sonrası plan gözden geçirilip güncellendi mi?", options: ["Yaşanan aksaklıklar sonrası plan güncellenmedi", "Sözlü ders çıkarıldı, yazılı değişiklik yapılmadı", "Bazı güncellemeler yapıldı", "Sistematik 'ders çıkarma' süreci var", "Her olay sonrası resmi inceleme + plan revizyonu yapılıyor"] },
  { id: "t3", dim: "testing", text: "İş sürekliliği/afet hazırlığı konusunda üst yönetim ne sıklıkla bilgilendiriliyor?", options: ["Hiç gündeme gelmiyor", "Yalnızca bir olay sonrası konuşuluyor", "Yılda bir kez gözden geçiriliyor", "Düzenli (çeyreklik) gündem maddesi", "Yönetim sisteminin resmi, sürekli bir parçası"] },
];

const LEVELS = [
  { min: 0, max: 20, name: "Reaktif", color: "#DC2626", desc: "Hazırlık düzeyi çok düşük. İşletme kritik kesintilere karşı korunmasız." },
  { min: 21, max: 40, name: "Başlangıç", color: "#EA580C", desc: "Temel farkındalık var ancak sistemli bir yönetim eksik." },
  { min: 41, max: 60, name: "Gelişmekte", color: "#D97706", desc: "Temel süreçler tanımlı. Tatbikat ve test aşamasına geçilmeli." },
  { min: 61, max: 80, name: "Yönetilen", color: "#059669", desc: "Süreklilik yönetimi kurulmuş. Düzenli izleme ve iyileştirme yapılıyor." },
  { min: 81, max: 100, name: "Optimize", color: "#0D9488", desc: "Dayanıklı ve ISO standartlarına tam uyumlu olgun bir yapı." },
];

const getLevel = (score) => LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];

export default function App() {
  const [step, setStep] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleAnswer = (val) => {
    setAnswers({ ...answers, [QUESTIONS[qIndex].id]: val });
    if (qIndex < QUESTIONS.length - 1) setQIndex(qIndex + 1);
    else setStep("results");
  };

  const score = useMemo(() => {
    const vals = Object.values(answers);
    return vals.length ? ((vals.reduce((a, b) => a + b, 0) / vals.length - 1) / 4) * 100 : 0;
  }, [answers]);

  const level = getLevel(score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 font-sans p-6 md:p-12">
      <header className="max-w-5xl mx-auto mb-16 flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-800">Çorlu Ticaret ve Sanayi Odası</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase">Afet & İş Sürekliliği Öz-Değerlendirme</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-10 md:p-16">
        {step === "intro" && (
          <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tight mb-6">İşletmeniz Ne Kadar Dayanıklı?</h2>
            <p className="text-slate-600 mb-10 max-w-xl mx-auto leading-relaxed">
              18 soruluk bu değerlendirme ile kurumunuzun afet hazırlık seviyesini ölçün ve uluslararası standartlara uyum yol haritanızı oluşturun.
            </p>
            <button onClick={() => setStep("quiz")} className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-800 transition">Değerlendirmeyi Başlat</button>
          </div>
        )}

        {step === "quiz" && (
          <div>
            <div className="mb-8 text-xs font-bold text-slate-400 uppercase tracking-widest">{QUESTIONS[qIndex].dim} | Soru {qIndex + 1} / {QUESTIONS.length}</div>
            <h3 className="text-2xl font-semibold mb-8 leading-snug">{QUESTIONS[qIndex].text}</h3>
            <div className="space-y-4">
              {QUESTIONS[qIndex].options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i + 1)} className="w-full text-left p-6 rounded-2xl border border-slate-200 hover:border-slate-400 transition hover:bg-slate-50 font-medium">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="text-center">
            <div className="text-8xl font-black mb-4" style={{ color: level.color }}>{Math.round(score)}</div>
            <h2 className="text-3xl font-bold mb-2">{level.name} Seviye</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">{level.desc}</p>
            <button onClick={() => window.location.reload()} className="border border-slate-200 px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Yeniden Başlat</button>
          </div>
        )}
      </main>
    </div>
  );
}
