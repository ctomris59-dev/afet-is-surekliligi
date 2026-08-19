import React, { useState, useMemo } from "react";

/* ======================================================================
   ÇORLU TSO — AFET & İŞ SÜREKLİLİĞİ SKORKARTI (PROFESYONEL KURUMSAL SÜRÜM)
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
    text: "Kritik tedarikçi, müşteri ve altyapı bağımlılıklarınızın kesinti riski değerlendirildi mi?",
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
      "Var, düzenli güncelleniyor ve ilgili mevzuata uygun",
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
      "Roller yazılı, yedekli ve tatbik edilmiş",
    ],
  },
  {
    id: "e3", dim: "emergency",
    text: "İşyerinde toplanma noktası, tahliye yolları ve acil müdahale ekipmanı işaretli ve erişilebilir mi?",
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
    text: "Kritik iş verileriniz düzenli olarak yedekleniyor mu?",
    options: [
      "Yedekleme yok",
      "Düzensiz, manuel yedekleme yapılıyor",
      "Düzenli yedekleme var ama tek konumda saklanıyor",
      "Düzenli ve fiziksel olarak farklı konumda yedekleme var",
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
    text: "Çalışanlarınızın temel siber güvenlik farkındalığı var mı?",
    options: [
      "Hiç eğitim verilmedi",
      "Bilgilendirme yapıldı ama tekrarlanmadı",
      "Yıllık bilgilendirme var",
      "Düzenli eğitim + test yapılıyor",
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
    text: "Üretim/hizmet sürecinizin hangi adımlarının 'kritik' olduğu belirlendi mi?",
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
    text: "Bir kesinti sırasında müşterilerinize hizmeti sürdürebilecek minimum kapasite planı var mı?",
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
    text: "Acil durumda çalışanlara/tedarikçilere hızlıca ulaşabileceğiniz bir iletişim sisteminiz var mı?",
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
    text: "Kriz anında karar verme yetkisi kilit kişide toplanıyorsa, o kişi ulaşılamazsa ne olacağı tanımlı mı?",
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
    text: "Geçmişte yaşanan bir aksaklık sonrası plan gözden geçirilip güncellendi mi?",
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
    text: "İş sürekliliği/afet hazırlığı konusunda üst yönetim ne sıklıkla bilgilendiriliyor?",
    options: [
      "Hiç gündeme gelmiyor",
      "Yalnızca bir olay sonrası konuşuluyor",
      "Yılda bir kez gözden geçiriliyor",
      "Düzenli (çeyreklik) gündem maddesi",
      "Yönetim sisteminin resmi, sürekli bir parçası",
    ],
  },
];

const LEVELS = [
  { min: 0, max: 20, name: "Reaktif", color: "#DC2626", desc: "Hazırlık düzeyi çok düşük. İşletme kritik kesintilere karşı korunmasız." },
  { min: 21, max: 40, name: "Başlangıç", color: "#EA580C", desc: "Temel farkındalık var ancak sistemli bir yönetim eksik." },
  { min: 41, max: 60, name: "Gelişmekte", color: "#D97706", desc: "Temel süreçler tanımlı. Tatbikat ve test aşamasına geçilmeli." },
  { min: 61, max: 80, name: "Yönetilen", color: "#059669", desc: "Süreklilik yönetimi kurulmuş. Düzenli izleme ve iyileştirme yapılıyor." },
  { min: 81, max: 100, name: "Optimize", color: "#0D9488", desc: "Dayanıklı ve ISO standartlarına tam uyumlu olgun bir yapı." },
];

const getLevel = (score) => LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];

function polar(angleDeg, r, cx = 110, cy = 120) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(a0, a1, r) {
  const p0 = polar(a0, r), p1 = polar(a1, r);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${p0.x},${p0.y} A${r},${r} 0 ${large} 1 ${p1.x},${p1.y}`;
}

function Gauge({ value, color }) {
  const angle = -180 + (Math.max(0, Math.min(100, value)) / 100) * 180;
  const needle = polar(angle, 74);
  return (
    <svg viewBox="0 0 220 136" className="w-full max-w-[220px] mx-auto drop-shadow-sm">
      <path d={arcPath(-180, 0, 88)} fill="none" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" />
      <path d={arcPath(-180, angle, 88)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      <line x1="110" y1="120" x2={needle.x} y2={needle.y} stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="110" cy="120" r="7" fill="#0F172A" />
      <text x="110" y="112" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0F172A" fontFamily="sans-serif">
        {Math.round(value)}
      </text>
    </svg>
  );
}

export default function App() {
  const [step, setStep] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentQ = QUESTIONS[qIndex];
  const progress = Math.round((qIndex / QUESTIONS.length) * 100);

  const handleAnswer = (val) => {
    setAnswers({ ...answers, [currentQ.id]: val });
    if (qIndex < QUESTIONS.length - 1) setTimeout(() => setQIndex(qIndex + 1), 150);
    else setTimeout(() => setStep("results"), 150);
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col justify-between selection:bg-red-600 selection:text-white font-sans">
      
      {/* Header */}
      <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-lg shadow-red-600/30">
            Ç
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">Çorlu Ticaret ve Sanayi Odası</h1>
            <p className="text-xs text-slate-400 font-medium">Afet &amp; İş Sürekliliği Skorkartı</p>
          </div>
        </div>
        {step === "quiz" && (
          <div className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Soru {qIndex + 1} / {QUESTIONS.length}
          </div>
        )}
      </header>

      {/* Progress Bar */}
      {step === "quiz" && (
        <div className="w-full bg-slate-800 h-1">
          <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Main Container */}
      <main className="w-full flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-4xl mx-auto">

          {/* INTRO */}
          {step === "intro" && (
            <div className="text-center max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-10 lg:p-16 shadow-2xl">
              <span className="inline-block text-xs font-mono font-bold tracking-widest text-red-400 bg-red-950/50 border border-red-800/50 rounded-full px-4 py-1.5 mb-6">
                ISO 22301 · SENDAİ ÇERÇEVESİ · 6331 S. KANUN
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-6 text-white leading-tight">
                İşletmeniz bir kriz anında ne kadar dayanıklı?
              </h2>
              <p className="text-slate-300 text-sm lg:text-base mb-10 leading-relaxed">
                18 soruluk öz-değerlendirme ile deprem, yangın, siber saldırı ve tedarik kesintilerine karşı kurumsal hazırlığınızı test edin, özel yol haritanızı oluşturun.
              </p>
              <button
                onClick={() => setStep("quiz")}
                className="bg-red-600 hover:bg-red-500 text-white rounded-2xl px-10 py-4 font-bold text-base transition shadow-xl shadow-red-600/30"
              >
                Değerlendirmeyi Başlat →
              </button>
            </div>
          )}

          {/* QUIZ */}
          {step === "quiz" && currentQ && (
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 lg:p-12 shadow-2xl">
              <div className="text-xs font-mono font-bold tracking-wider text-red-400 uppercase mb-3">
                {DIMENSIONS.find(d => d.key === currentQ.dim)?.label}
              </div>
              <h3 className="text-xl lg:text-2xl font-bold mb-8 text-white leading-snug">
                {currentQ.text}
              </h3>
              <div className="space-y-3.5">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i + 1)}
                    className={`w-full text-left px-6 py-4 rounded-2xl border transition text-sm lg:text-base font-medium flex items-center justify-between group
                      ${answers[currentQ.id] === i + 1
                        ? "border-red-500 bg-red-950/40 text-white ring-2 ring-red-500/30"
                        : "border-slate-700/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70 text-slate-300"}`}
                  >
                    <span>{opt}</span>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs flex-shrink-0 transition
                      ${answers[currentQ.id] === i + 1 ? "border-red-500 bg-red-600 text-white" : "border-slate-600 group-hover:border-slate-500"}`}>
                      {answers[currentQ.id] === i + 1 ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>
              {qIndex > 0 && (
                <button onClick={() => setQIndex(qIndex - 1)} className="mt-6 text-xs text-slate-400 hover:text-slate-200 transition">
                  ← Önceki soru
                </button>
              )}
            </div>
          )}

          {/* RESULTS */}
          {step === "results" && (
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 lg:p-12 shadow-2xl text-center">
              <Gauge value={overall} color={level.color} />
              <div className="inline-block mt-4 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider" style={{ background: level.color + '25', color: level.color }}>
                {level.name.toUpperCase()} SEVİYE
              </div>
              <p className="text-slate-300 max-w-lg mx-auto mt-4 text-sm lg:text-base leading-relaxed">{level.desc}</p>
              
              <div className="mt-8 flex gap-4 justify-center">
                <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition">
                  Raporu İndir
                </button>
                <button onClick={() => { setAnswers({}); setQIndex(0); setStep("intro"); }} className="border border-slate-600 hover:bg-slate-700/50 text-slate-200 px-8 py-3.5 rounded-2xl font-bold text-sm transition">
                  Yeniden Başlat
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900/80 border-t border-slate-800 py-6 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 Çorlu Ticaret ve Sanayi Odası — Afet &amp; İş Sürekliliği Skorkartı</p>
      </footer>
    </div>
  );
}
