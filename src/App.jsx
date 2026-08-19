import React, { useState, useMemo } from "react";

/* ======================================================================
   ÇORLU TSO — AFET & İŞ SÜREKLİLİĞİ SKORKARTI (LINEAR / VERCEL SAAS STİLİ)
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
  { min: 0, max: 20, name: "Habersiz / Reaktif", color: "#EF4444", border: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-400", desc: "Afet ve kriz hazırlığı büyük ölçüde tesadüfe bırakılmış. Herhangi bir kesinti işletmeyi ciddi risk altında bırakabilir." },
  { min: 21, max: 40, name: "Farkında / Başlangıç", color: "#F97316", border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-400", desc: "Riskler kısmen biliniyor ama yazılı, sistematik bir hazırlık yok. İlk adım: temel riskleri ve kritik süreçleri yazılı hale getirmek." },
  { min: 41, max: 60, name: "Gelişmekte", color: "#F59E0B", border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", desc: "Temel unsurlar (plan, yedekleme, roller) kısmen mevcut. Sıradaki öncelik: planları test etmek ve boşlukları kapatmak." },
  { min: 61, max: 80, name: "Yönetilen", color: "#3B82F6", border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", desc: "İş sürekliliği kurumsallaşmaya başlamış; düzenli gözden geçirme ve test var. İnce ayar ve kapsam genişletme aşaması." },
  { min: 81, max: 100, name: "Dayanıklı / Optimize", color: "#10B981", border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400", desc: "ISO 22301 ruhuna uygun, olgun bir yönetim sistemi. Sürekli iyileştirme döngüsü işliyor." },
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
  const needle = polar(angle, 70);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 220 135" className="w-full max-w-[210px]">
        <path d={arcPath(-180, 0, 84)} fill="none" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
        <path d={arcPath(-180, angle, 84)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" style={{ transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} />
        <line x1="110" y1="120" x2={needle.x} y2={needle.y} stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
        <circle cx="110" cy="120" r="6" fill="#F8FAFC" />
      </svg>
      <div className="absolute bottom-2 text-center">
        <span className="text-4xl font-extrabold tracking-tight text-white font-mono">{Math.round(value)}</span>
        <span className="text-xs text-slate-500 block font-mono font-medium mt-0.5">/ 100 SKOR</span>
      </div>
    </div>
  );
}

function MethodologyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-[#0D1117] border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <h3 className="text-base font-semibold text-white tracking-tight">Metodoloji &amp; Dayanaklar</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition text-sm font-mono">✕</button>
        </div>
        <div className="space-y-4 text-xs leading-relaxed">
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
            <p className="font-semibold text-slate-100 mb-1">ISO 22301:2019 — İş Sürekliliği Yönetim Sistemi</p>
            <p className="text-slate-400">Risk değerlendirmesi, iş etki analizi (BIA), süreklilik stratejisi, plan geliştirme, tatbikat/test ve sürekli iyileştirme (PUKÖ) döngüsü bu standardın ana yapı taşlarıdır.</p>
          </div>
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
            <p className="font-semibold text-slate-100 mb-1">UNDRR Sendai Afet Risk Azaltma Çerçevesi (2015-2030)</p>
            <p className="text-slate-400">BM çerçevesinin ilk önceliği olan "afet riskini anlamak", Risk &amp; Tehlike Analizi boyutunun temelidir.</p>
          </div>
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
            <p className="font-semibold text-slate-100 mb-1">6331 Sayılı İSG Kanunu</p>
            <p className="text-slate-400">Acil durum planı hazırlama, tahliye ve çalışanları bilgilendirme yükümlülüklerini esas alır.</p>
          </div>
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
            <p className="font-semibold text-slate-100 mb-1">NIST SP 800-34</p>
            <p className="text-slate-400">BT ve veri sürekliliği sorularının teknik çerçevesini oluşturur.</p>
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-2.5 text-xs font-semibold transition border border-slate-700">
          Kapat
        </button>
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
  const progress = Math.round((qIndex / QUESTIONS.length) * 100);

  const handleAnswer = (value) => {
    const next = { ...answers, [currentQ.id]: value };
    setAnswers(next);
    if (qIndex < QUESTIONS.length - 1) {
      setTimeout(() => setQIndex(qIndex + 1), 140);
    } else {
      setTimeout(() => setStep("results"), 140);
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
    <div className="min-h-screen bg-[#070A0F] text-slate-200 font-sans selection:bg-red-500 selection:text-white flex flex-col justify-between">
      
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#070A0F]/80 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-red-900/20 border border-red-500/30">
              Ç
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight text-white uppercase">Çorlu Ticaret ve Sanayi Odası</div>
              <div className="text-[11px] text-slate-500 font-mono">Afet &amp; İş Sürekliliği Skorkartı</div>
            </div>
          </div>
          <button
            onClick={() => setShowMethodology(true)}
            className="text-[11px] font-mono text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 transition"
          >
            Metodoloji
          </button>
        </div>
        {step === "quiz" && (
          <div className="w-full bg-slate-900 h-0.5">
            <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full flex items-center justify-center">
        <div className="w-full">

          {/* ---------------- INTRO ---------------- */}
          {step === "intro" && (
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[11px] font-mono mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                ISO 22301 · SENDAİ ÇERÇEVESİ · 6331 S. KANUN
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                İşletmeniz bir kriz anında ne kadar dayanıklı?
              </h1>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-10 max-w-2xl mx-auto">
                18 soruluk bu öz-değerlendirme; işletmenizin deprem, yangın, siber saldırı veya tedarik kesintisi karşısındaki hazırlığını 6 ana boyutta analiz eder.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10 text-left max-w-2xl mx-auto">
                {DIMENSIONS.map((d) => (
                  <div key={d.key} className="p-3 bg-[#0D1117] border border-slate-800/80 rounded-xl hover:border-slate-700 transition">
                    <div className="text-[10px] font-mono text-red-500 uppercase tracking-wider mb-1">{d.short}</div>
                    <div className="text-xs font-medium text-slate-300">{d.label}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep("quiz")}
                className="bg-white hover:bg-slate-200 text-slate-950 font-semibold px-8 py-3.5 rounded-xl text-sm transition shadow-xl shadow-white/5 active:scale-95"
              >
                Değerlendirmeyi Başlat →
              </button>
            </div>
          )}

          {/* ---------------- QUIZ ---------------- */}
          {step === "quiz" && currentQ && (
            <div className="max-w-2xl mx-auto bg-[#0D1117] border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl relative">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
                <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded">
                  {DIMENSIONS.find((d) => d.key === currentQ.dim)?.short}
                </span>
                <span className="text-xs font-mono text-slate-500">{qIndex + 1} / {QUESTIONS.length}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-medium text-white mb-8 leading-relaxed">
                {currentQ.text}
              </h2>

              <div className="space-y-3">
                {currentQ.options.map((opt, i) => {
                  const isSelected = answers[currentQ.id] === i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i + 1)}
                      className={`w-full text-left p-4 rounded-xl border transition text-xs sm:text-sm font-medium flex items-center justify-between group
                        ${isSelected
                          ? "border-red-500 bg-red-500/10 text-white shadow-lg shadow-red-950/30"
                          : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900 text-slate-300"}`}
                    >
                      <span className="pr-4 leading-normal">{opt}</span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] flex-shrink-0 transition
                        ${isSelected ? "border-red-500 bg-red-500 text-white" : "border-slate-700 group-hover:border-slate-500"}`}>
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {qIndex > 0 && (
                <button
                  onClick={() => setQIndex(qIndex - 1)}
                  className="mt-8 text-xs font-mono text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
                >
                  ← Önceki Soru
                </button>
              )}
            </div>
          )}

          {/* ---------------- RESULTS ---------------- */}
          {step === "results" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Top Banner Card */}
              <div className="bg-[#0D1117] border border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <Gauge value={overall} color={level.color} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider mb-3 ${level.bg} ${level.text} border ${level.border}`}>
                    SEVİYE {LEVELS.indexOf(level) + 1} — {level.name.toUpperCase()}
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Genel Olgunluk Durumu</h2>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">{level.desc}</p>
                </div>
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dimensions Score Card */}
                <div className="bg-[#0D1117] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400 mb-6 pb-3 border-b border-slate-800/80">
                    Boyut Bazında Analiz
                  </h3>
                  <div className="space-y-4">
                    {DIMENSIONS.map((d) => (
                      <div key={d.key}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-300 font-medium">{d.label}</span>
                          <span className="font-mono text-slate-400">{Math.round(byDim[d.key])}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${byDim[d.key]}%`, backgroundColor: level.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Areas Card */}
                <div className="bg-[#0D1117] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400 mb-6 pb-3 border-b border-slate-800/80">
                      Öncelikli Gelişim Alanları
                    </h3>
                    <div className="space-y-3">
                      {weakestDims.map((d) => (
                        <div key={d.key} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex gap-3">
                          <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: level.color }} />
                          <div>
                            <div className="text-xs font-bold text-white">{d.label}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 leading-normal">{DIM_RECS[d.key]}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 bg-white hover:bg-slate-200 text-slate-950 rounded-xl py-2.5 text-xs font-semibold transition"
                    >
                      PDF Raporu İndir
                    </button>
                    <button
                      onClick={restart}
                      className="flex-1 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded-xl py-2.5 text-xs font-semibold transition"
                    >
                      Yeniden Başlat
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 text-center pt-4">
                Bu sonuç bir öz-değerlendirmedir; ISO 22301 sertifikasyonu veya resmi denetimin yerine geçmez.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-[11px] text-slate-600 font-mono print:hidden">
        Çorlu Ticaret ve Sanayi Odası © 2026
      </footer>

      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
    </div>
  );
}
