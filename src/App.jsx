import React, { useState, useMemo } from "react";

/* ======================================================================
   ÇORLU TSO — AFET & İŞ SÜREKLİLİĞİ SKORKARTI (LIGHT EDITORIAL)
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

const LEVELS = [
  { min: 0, max: 20, name: "Reaktif", desc: "Afet ve kriz hazırlığı büyük ölçüde tesadüfe bırakılmış. Herhangi bir kesinti işletmeyi ciddi risk altında bırakabilir." },
  { min: 21, max: 40, name: "Başlangıç", desc: "Riskler kısmen biliniyor ama yazılı, sistematik bir hazırlık yok. İlk adım: temel riskleri ve kritik süreçleri yazılı hale getirmek." },
  { min: 41, max: 60, name: "Gelişmekte", desc: "Temel unsurlar (plan, yedekleme, roller) kısmen mevcut. Sıradaki öncelik: planları test etmek ve boşlukları kapatmak." },
  { min: 61, max: 80, name: "Yönetilen", desc: "İş sürekliliği kurumsallaşmaya başlamış; düzenli gözden geçirme ve test var. İnce ayar ve kapsam genişletme aşaması." },
  { min: 81, max: 100, name: "Optimize", desc: "ISO 22301 ruhuna uygun, olgun bir yönetim sistemi. Sürekli iyileştirme döngüsü işliyor." },
];

const getLevel = (score) => LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];

const DIM_RECS = {
  risk: "Risk envanterinizi yazılı hale getirin; AFAD'ın bölgenize özel tehlike haritalarını referans alın.",
  emergency: "6331 sayılı Kanun kapsamında zorunlu olan acil durum planını yazılı hale getirip tüm çalışanlarla paylaşın.",
  it: "Kritik verileriniz için 3-2-1 yedekleme kuralını (3 kopya, 2 farklı ortam, 1'i uzak konumda) uygulamayı değerlendirin.",
  supply: "En kritik 2-3 girdi için alternatif tedarikçi görüşmelerine başlayın.",
  people: "Güncel bir acil iletişim listesi oluşturun ve yılda bir kez test edin.",
  testing: "Yılda en az bir kez masabaşı (tabletop) tatbikatı planlayın — düşük maliyetli, yüksek etkili bir adımdır.",
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
  const weakestDims = [...DIMENSIONS].sort((a, b) => byDim[a.key] - byDim[b.key]).slice(0, 3);

  const restart = () => { setAnswers({}); setQIndex(0); setStep("intro"); };

  return (
    <div className="h-screen w-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-between overflow-hidden relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Font Injections: Space Grotesk (Başlıklar) & Plus Jakarta Sans (Gövde) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
      `}</style>

      {/* Açık Renk Editoryal Duvar Kağıdı Deseni (Ince Izgara + Warm Tone Overlay) */}
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
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-900/10 pb-1">// ÖNCELİKLİ AKSİYONLAR</h3>
                  <div className="space-y-3">
                    {weakestDims.map((d, i) => (
                      <div key={d.key} className="border-l-2 border-slate-900 pl-3 py-0.5">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-red-700 font-bold mb-0.5">
                          0{i + 1}. {d.label}
                        </div>
                        <div className="text-xs font-medium text-slate-700 leading-snug">
                          {DIM_RECS[d.key]}
                        </div>
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
