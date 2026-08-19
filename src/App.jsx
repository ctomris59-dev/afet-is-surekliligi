import React, { useState, useMemo } from "react";

/* ======================================================================
   ÇORLU TSO — AFET & İŞ SÜREKLİLİĞİ SKORKARTI
   ------------------------------------------------------------------
   Metodoloji ve dayanaklar (bkz. MethodologyModal içeriği):
   - ISO 22301:2019 İş Sürekliliği Yönetim Sistemleri
   - UNDRR Sendai Afet Risk Azaltma Çerçevesi 2015-2030 (4 öncelik alanı)
   - 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve İşyerlerinde Acil
     Durumlar Hakkında Yönetmelik kapsamındaki asgari yükümlülükler
   - NIST SP 800-34 (Bilgi Sistemleri İçin Olağanüstü Durum Planlama
     Rehberi) — BT sürekliliği boyutu için referans alınmıştır
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

/* ---------------- Soru bankası ----------------
   Her soru 5 kademeli, olgunluk seviyesi tanımlı seçeneklerle
   (Likert "katılıyorum/katılmıyorum" yerine davranışsal ifade tercih
   edildi — daha isabetli öz-değerlendirme sağlar). value: 1-5           */
const QUESTIONS = [
  // RISK
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

  // EMERGENCY
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

  // IT / DATA
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

  // SUPPLY / OPERATION
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

  // PEOPLE
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

  // TESTING
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

/* ---------------- Olgunluk seviyeleri (0-100 skor) ---------------- */
const LEVELS = [
  { min: 0, max: 20, name: "Habersiz / Reaktif", color: "#7C2D12", desc: "Afet ve kriz hazırlığı büyük ölçüde tesadüfe bırakılmış. Herhangi bir kesinti işletmeyi ciddi risk altında bırakabilir." },
  { min: 21, max: 40, name: "Farkında / Başlangıç", color: "#B91C1C", desc: "Riskler kısmen biliniyor ama yazılı, sistematik bir hazırlık yok. İlk adım: temel riskleri ve kritik süreçleri yazılı hale getirmek." },
  { min: 41, max: 60, name: "Gelişmekte", color: "#C2410C", desc: "Temel unsurlar (plan, yedekleme, roller) kısmen mevcut. Sıradaki öncelik: planları test etmek ve boşlukları kapatmak." },
  { min: 61, max: 80, name: "Yönetilen", color: "#B45309", desc: "İş sürekliliği kurumsallaşmaya başlamış; düzenli gözden geçirme ve test var. İnce ayar ve kapsam genişletme aşaması." },
  { min: 81, max: 100, name: "Dayanıklı / Optimize", color: "#0F766E", desc: "ISO 22301 ruhuna uygun, olgun bir yönetim sistemi. Sürekli iyileştirme döngüsü işliyor." },
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

/* ======================================================================
   Gauge — diğer üç Çorlu TSO aracıyla aynı geometri (cx110,cy120,r88)
   ====================================================================== */
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
  const ticks = [-180, -135, -90, -45, 0];
  return (
    <svg viewBox="0 0 220 136" className="w-full max-w-[220px] mx-auto">
      <path d={arcPath(-180, 0, 88)} fill="none" stroke="#E2E8F0" strokeWidth="11" strokeLinecap="round" />
      <path d={arcPath(-180, angle, 88)} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" />
      <g stroke="#94A3B8" strokeWidth="1.4">
        {ticks.map((t, i) => {
          const o = polar(t, 97), inr = polar(t, 105);
          return <line key={i} x1={o.x} y1={o.y} x2={inr.x} y2={inr.y} />;
        })}
      </g>
      <g>
        <line x1="110" y1="120" x2={needle.x} y2={needle.y} stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        <circle cx="110" cy="120" r="6" fill="#0F172A" />
      </g>
      <text x="110" y="112" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="26" fontWeight="600" fill="#0F172A">
        {Math.round(value)}
      </text>
    </svg>
  );
}

/* ======================================================================
   Metodoloji modalı
   ====================================================================== */
function MethodologyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-7" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Metodoloji &amp; Dayanaklar</h3>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div>
            <p className="font-semibold text-slate-800 mb-1">ISO 22301:2019 — İş Sürekliliği Yönetim Sistemi</p>
            <p>Risk değerlendirmesi, iş etki analizi (BIA), süreklilik stratejisi, plan geliştirme, tatbikat/test ve sürekli iyileştirme (PUKÖ) döngüsü bu standardın ana yapı taşlarıdır. Skorkartın 6 boyutu bu döngüyü esas alır.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-1">UNDRR Sendai Afet Risk Azaltma Çerçevesi (2015-2030)</p>
            <p>Birleşmiş Milletler'in afet risk azaltma çerçevesinin dört önceliğinden ilki olan "afet riskini anlamak", Risk &amp; Tehlike Analizi boyutunun temelini oluşturur.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-1">6331 Sayılı İş Sağlığı ve Güvenliği Kanunu</p>
            <p>Türkiye'de işverenlere acil durum planı hazırlama, tahliye düzenlemeleri yapma ve çalışanları bilgilendirme yükümlülüğü getiren temel mevzuattır; Acil Durum Müdahale Planı ve Çalışan Güvenliği boyutları bu yükümlülükleri esas alır.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-1">NIST SP 800-34 — Olağanüstü Durum Planlama Rehberi</p>
            <p>Bilgi sistemleri sürekliliği için ABD Ulusal Standartlar ve Teknoloji Enstitüsü'nün yayınladığı bu rehber, Veri &amp; BT Sürekliliği boyutundaki soruların çerçevesini oluşturur.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500">
            <strong>Not:</strong> Bu araç bir öz-değerlendirme aracıdır; ISO 22301 sertifikasyonu, resmi risk mühendisliği raporu veya AFAD/İSG denetimi yerine geçmez. Sonuçlar yalnızca yol haritası niteliğindedir.
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-slate-800 transition">
          Kapat
        </button>
      </div>
    </div>
  );
}

/* ======================================================================
   Ana uygulama
   ====================================================================== */
export default function App() {
  const [step, setStep] = useState("intro"); // intro | quiz | results
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showMethodology, setShowMethodology] = useState(false);

  const currentQ = QUESTIONS[qIndex];
  const progress = Math.round((qIndex / QUESTIONS.length) * 100);

  const handleAnswer = (value) => {
    const next = { ...answers, [currentQ.id]: value };
    setAnswers(next);
    if (qIndex < QUESTIONS.length - 1) {
      setTimeout(() => setQIndex(qIndex + 1), 180);
    } else {
      setTimeout(() => setStep("results"), 180);
    }
  };

  const { overall, byDim } = useMemo(() => {
    const dimScores = {};
    DIMENSIONS.forEach((d) => {
      const qs = QUESTIONS.filter((q) => q.dim === d.key);
      const vals = qs.map((q) => answers[q.id]).filter(Boolean);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      dimScores[d.key] = ((avg - 1) / 4) * 100; // 1-5 -> 0-100
    });
    const allVals = Object.values(answers);
    const overallAvg = allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;
    return { overall: ((overallAvg - 1) / 4) * 100, byDim: dimScores };
  }, [answers]);

  const level = getLevel(overall);
  const weakestDims = [...DIMENSIONS].sort((a, b) => byDim[a.key] - byDim[b.key]).slice(0, 3);

  const restart = () => { setAnswers({}); setQIndex(0); setStep("intro"); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Google Fonts index.html <head> içinde yükleniyor */}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Çorlu Ticaret ve Sanayi Odası</div>
            <div className="text-xs text-slate-500">Afet &amp; İş Sürekliliği Skorkartı</div>
          </div>
          <button
            onClick={() => setShowMethodology(true)}
            className="text-xs font-medium text-slate-500 border border-slate-200 rounded-full px-3 py-1.5 hover:border-slate-400 transition"
          >
            Metodoloji
          </button>
        </div>
        {step === "quiz" && (
          <div className="h-1 bg-slate-100">
            <div className="h-1 bg-red-700 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* ---------------- INTRO ---------------- */}
        {step === "intro" && (
          <div className="text-center">
            <span className="inline-block text-[11px] font-mono font-semibold tracking-wider text-red-800 bg-red-50 rounded-full px-3 py-1 mb-5">
              ISO 22301 · SENDAİ ÇERÇEVESİ · 6331 S. KANUN
            </span>
            <h1 className="text-3xl font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              İşletmeniz bir kriz anında ne kadar dayanıklı?
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
              18 soruluk bu öz-değerlendirme, işletmenizin deprem, yangın, siber saldırı veya tedarik kesintisi
              gibi olaylar karşısındaki hazırlığını 6 boyutta ölçer ve size özel bir yol haritası sunar. Yaklaşık 6-8 dakika sürer.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-10 text-left">
              {DIMENSIONS.slice(0, 3).map((d) => (
                <div key={d.key} className="text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-700 mb-1.5" />
                  {d.short}
                </div>
              ))}
              {DIMENSIONS.slice(3).map((d) => (
                <div key={d.key} className="text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-700 mb-1.5" />
                  {d.short}
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("quiz")}
              className="bg-red-700 text-white rounded-xl px-8 py-3.5 font-semibold hover:bg-red-800 transition"
            >
              Değerlendirmeyi Başlat →
            </button>
          </div>
        )}

        {/* ---------------- QUIZ ---------------- */}
        {step === "quiz" && currentQ && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-red-800 bg-red-50 rounded-full px-3 py-1">
                {DIMENSIONS.find((d) => d.key === currentQ.dim)?.short.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 font-mono">{qIndex + 1} / {QUESTIONS.length}</span>
            </div>
            <h2 className="text-xl font-semibold mb-6 leading-snug">{currentQ.text}</h2>
            <div className="space-y-2.5">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i + 1)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl border transition text-sm
                    ${answers[currentQ.id] === i + 1
                      ? "border-red-700 bg-red-50 text-red-900"
                      : "border-slate-200 hover:border-slate-400 text-slate-700"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {qIndex > 0 && (
              <button onClick={() => setQIndex(qIndex - 1)} className="mt-6 text-xs text-slate-400 hover:text-slate-600">
                ← Önceki soru
              </button>
            )}
          </div>
        )}

        {/* ---------------- RESULTS ---------------- */}
        {step === "results" && (
          <div>
            <div className="text-center mb-8 print:mb-4">
              <Gauge value={overall} color={level.color} />
              <div className="text-sm font-mono font-semibold tracking-wider mt-1" style={{ color: level.color }}>
                SEVİYE {LEVELS.indexOf(level) + 1} — {level.name.toUpperCase()}
              </div>
              <p className="text-slate-600 max-w-lg mx-auto mt-3 text-sm leading-relaxed">{level.desc}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Boyut Bazında Sonuçlar</h3>
              <div className="space-y-3.5">
                {DIMENSIONS.map((d) => (
                  <div key={d.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{d.label}</span>
                      <span className="font-mono font-semibold text-slate-500">{Math.round(byDim[d.key])}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${byDim[d.key]}%`, background: level.color }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">{d.ref}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Öncelikli Gelişim Alanları</h3>
              <div className="space-y-3">
                {weakestDims.map((d) => (
                  <div key={d.key} className="flex gap-3">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ background: level.color }} />
                    <div>
                      <div className="text-sm font-medium text-slate-800">{d.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{DIM_RECS[d.key]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
              <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-slate-800 transition">
                PDF Raporu İndir
              </button>
              <button onClick={restart} className="flex-1 border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-600 hover:border-slate-400 transition">
                Yeniden Başlat
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-6 leading-relaxed">
              Bu sonuç bir öz-değerlendirmedir; ISO 22301 sertifikasyonu veya resmi denetimin yerine geçmez.
            </p>
          </div>
        )}
      </main>

      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
    </div>
  );
}
