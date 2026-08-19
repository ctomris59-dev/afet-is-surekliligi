import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight, 
  ArrowLeft, 
  Printer, 
  RotateCcw, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  X,
  Activity,
  Layers,
  Database,
  Truck,
  Users,
  RefreshCw
} from "lucide-react";

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
  { key: "risk", label: "Risk & Tehlike Analizi", short: "Risk", ref: "ISO 22301 md.8.2 / Sendai Öncelik 1", icon: Activity },
  { key: "emergency", label: "Acil Durum Müdahale Planı", short: "Müdahale", ref: "6331 s. Kanun / İşyeri Acil Durum Yönetmeliği", icon: AlertTriangle },
  { key: "it", label: "Veri & BT Sürekliliği", short: "BT", ref: "NIST SP 800-34 / ISO 22301 md.8.4", icon: Database },
  { key: "supply", label: "Tedarik Zinciri & Operasyon", short: "Tedarik", ref: "ISO 22301 md.8.2.2 (BIA)", icon: Truck },
  { key: "people", label: "Çalışan Güvenliği & İletişim", short: "Çalışan", ref: "6331 s. Kanun / ISO 22301 md.8.4.3", icon: Users },
  { key: "testing", label: "Tatbikat & Sürekli İyileştirme", short: "Tatbikat", ref: "ISO 22301 md.8.5 / md.9-10", icon: RefreshCw },
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
  { min: 0, max: 20, name: "Habersiz / Reaktif", color: "#EF4444", bgLight: "#FEF2F2", desc: "Afet ve kriz hazırlığı büyük ölçüde tesadüfe bırakılmış. Herhangi bir kesinti işletmeyi ciddi risk altında bırakabilir." },
  { min: 21, max: 40, name: "Farkında / Başlangıç", color: "#F97316", bgLight: "#FFEDD5", desc: "Riskler kısmen biliniyor ama yazılı, sistematik bir hazırlık yok. İlk adım: temel riskleri ve kritik süreçleri yazılı hale getirmek." },
  { min: 41, max: 60, name: "Gelişmekte", color: "#F59E0B", bgLight: "#FEF3C7", desc: "Temel unsurlar (plan, yedekleme, roller) kısmen mevcut. Sıradaki öncelik: planları test etmek ve boşlukları kapatmak." },
  { min: 61, max: 80, name: "Yönetilen", color: "#3B82F6", bgLight: "#EFF6FF", desc: "İş sürekliliği kurumsallaşmaya başlamış; düzenli gözden geçirme ve test var. İnce ayar ve kapsam genişletme aşaması." },
  { min: 81, max: 100, name: "Dayanıklı / Optimize", color: "#10B981", bgLight: "#ECFDF5", desc: "ISO 22301 ruhuna uygun, olgun bir yönetim sistemi. Sürekli iyileştirme döngüsü işliyor." },
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
   Gauge — Yenilenmiş modern gösterge tasarımı
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
  const needle = polar(angle, 70);
  const ticks = [-180, -135, -90, -45, 0];

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 220 140" className="w-full max-w-[240px] drop-shadow-md">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Arka plan halkası */}
        <path d={arcPath(-180, 0, 84)} fill="none" stroke="#F1F5F9" strokeWidth="14" strokeLinecap="round" />

        {/* Aktif skor halkası */}
        <path 
          d={arcPath(-180, angle, 84)} 
          fill="none" 
          stroke={color} 
          strokeWidth="14" 
          strokeLinecap="round" 
          style={{ transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Çizgiler */}
        <g stroke="#CBD5E1" strokeWidth="1.5">
          {ticks.map((t, i) => {
            const o = polar(t, 94), inr = polar(t, 99);
            return <line key={i} x1={o.x} y1={o.y} x2={inr.x} y2={inr.y} strokeLinecap="round" />;
          })}
        </g>

        {/* İbre */}
        <g className="transition-all duration-700 ease-out">
          <line x1="110" y1="120" x2={needle.x} y2={needle.y} stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="110" cy="120" r="7" fill="#0F172A" />
          <circle cx="110" cy="120" r="3" fill="#FFFFFF" />
        </g>

        {/* Skor Metni */}
        <text x="110" y="110" textAnchor="middle" className="font-bold text-3xl fill-slate-900 tracking-tight">
          {Math.round(value)}
        </text>
      </svg>
    </div>
  );
}

/* ======================================================================
   Metodoloji modalı
   ====================================================================== */
function MethodologyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-8 shadow-2xl border border-slate-100 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Metodoloji &amp; Dayanaklar</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <p className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              ISO 22301:2019 — İş Sürekliliği Yönetim Sistemi
            </p>
            <p className="text-xs text-slate-500 pl-3.5">Risk değerlendirmesi, iş etki analizi (BIA), süreklilik stratejisi, plan geliştirme, tatbikat/test ve sürekli iyileştirme (PUKÖ) döngüsü bu standardın ana yapı taşlarıdır. Skorkartın 6 boyutu bu döngüyü esas alır.</p>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <p className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              UNDRR Sendai Afet Risk Azaltma Çerçevesi (2015-2030)
            </p>
            <p className="text-xs text-slate-500 pl-3.5">Birleşmiş Milletler'in afet risk azaltma çerçevesinin dört önceliğinden ilki olan "afet riskini anlamak", Risk &amp; Tehlike Analizi boyutunun temelini oluşturur.</p>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <p className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              6331 Sayılı İş Sağlığı ve Güvenliği Kanunu
            </p>
            <p className="text-xs text-slate-500 pl-3.5">Türkiye'de işverenlere acil durum planı hazırlama, tahliye düzenlemeleri yapma ve çalışanları bilgilendirme yükümlülüğü getiren temel mevzuattır; Acil Durum Müdahale Planı ve Çalışan Güvenliği boyutları bu yükümlülükleri esas alır.</p>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <p className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              NIST SP 800-34 — Olağanüstü Durum Planlama Rehberi
            </p>
            <p className="text-xs text-slate-500 pl-3.5">Bilgi sistemleri sürekliliği için ABD Ulusal Standartlar ve Teknoloji Enstitüsü'nün yayınladığı bu rehber, Veri &amp; BT Sürekliliği boyutundaki soruların çerçevesini oluşturur.</p>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-800 leading-normal">
            <strong>Not:</strong> Bu araç bir öz-değerlendirme aracıdır; ISO 22301 sertifikasyonu, resmi risk mühendisliği raporu veya AFAD/İSG denetimi yerine geçmez. Sonuçlar yalnızca yol haritası niteliğindedir.
          </div>
        </div>

        <button onClick={onClose} className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-sm font-medium transition shadow-lg shadow-slate-900/10">
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
    <div className="min-h-screen bg-slate-900/2 text-slate-800 flex flex-col justify-between font-sans antialiased">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/80 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-700 text-white p-2 rounded-xl shadow-md shadow-red-700/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900">Çorlu Ticaret ve Sanayi Odası</div>
              <div className="text-xs font-medium text-slate-500">Afet &amp; İş Sürekliliği Skorkartı</div>
            </div>
          </div>
          <button
            onClick={() => setShowMethodology(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 rounded-full px-3.5 py-1.5 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            Metodoloji
          </button>
        </div>
        {step === "quiz" && (
          <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-800 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 md:py-12 flex-1 w-full flex flex-col justify-center">
        {/* ---------------- INTRO ---------------- */}
        {step === "intro" && (
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-red-700 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <Layers className="w-3.5 h-3.5" />
              ISO 22301 · SENDAİ ÇERÇEVESİ · 6331 S. KANUN
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
              İşletmeniz bir kriz anında ne kadar dayanıklı?
            </h1>
            
            <p className="text-slate-600 max-w-xl mx-auto mb-10 leading-relaxed text-base">
              18 soruluk bu öz-değerlendirme, işletmenizin deprem, yangın, siber saldırı veya tedarik kesintisi
              gibi olaylar karşısındaki hazırlığını 6 boyutta ölçer ve size özel bir yol haritası sunar. Yaklaşık 6-8 dakika sürer.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 max-w-lg mx-auto mb-10 text-left">
              {DIMENSIONS.map((d) => {
                const IconComponent = d.icon;
                return (
                  <div key={d.key} className="flex items-center gap-2.5 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm hover:border-slate-300 transition">
                    <div className="p-2 bg-red-50 text-red-700 rounded-xl">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">{d.short}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep("quiz")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-700 to-red-800 text-white rounded-2xl px-8 py-4 font-semibold text-sm shadow-xl shadow-red-700/25 hover:shadow-red-700/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Değerlendirmeyi Başlat
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ---------------- QUIZ ---------------- */}
        {step === "quiz" && currentQ && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 transition-all">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold tracking-wider text-red-700 uppercase bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                {DIMENSIONS.find((d) => d.key === currentQ.dim)?.short}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-md">
                {qIndex + 1} / {QUESTIONS.length}
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 leading-snug">
              {currentQ.text}
            </h2>

            <div className="space-y-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = answers[currentQ.id] === i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i + 1)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 text-sm flex items-start gap-3 group relative ${
                      isSelected
                        ? "border-red-600 bg-red-50/50 text-red-950 font-medium shadow-sm ring-1 ring-red-600"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80 text-slate-700"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 transition ${
                      isSelected 
                        ? "bg-red-600 border-red-600 text-white" 
                        : "border-slate-300 text-slate-400 group-hover:border-slate-400"
                    }`}>
                      {i + 1}
                    </div>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {qIndex > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
                <button 
                  onClick={() => setQIndex(qIndex - 1)} 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Önceki soru
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- RESULTS ---------------- */}
        {step === "results" && (
          <div className="space-y-6">
            {/* Skor Özeti Kartı */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden print:shadow-none print:border-slate-300">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: level.color }} />
              
              <Gauge value={overall} color={level.color} />
              
              <div className="mt-4">
                <span 
                  className="inline-block text-xs font-extrabold tracking-wider px-3.5 py-1.5 rounded-full uppercase"
                  style={{ backgroundColor: level.bgLight, color: level.color }}
                >
                  SEVİYE {LEVELS.indexOf(level) + 1} — {level.name}
                </span>
              </div>

              <p className="text-slate-600 max-w-lg mx-auto mt-4 text-sm leading-relaxed font-normal">
                {level.desc}
              </p>
            </div>

            {/* Boyut Detayları */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 print:shadow-none print:border-slate-300">
              <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                Boyut Bazında Sonuçlar
              </h3>
              
              <div className="space-y-4">
                {DIMENSIONS.map((d) => {
                  const IconComponent = d.icon;
                  const dimScore = Math.round(byDim[d.key]);
                  return (
                    <div key={d.key} className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-medium mb-2">
                        <span className="text-slate-800 font-semibold flex items-center gap-2">
                          <IconComponent className="w-3.5 h-3.5 text-slate-500" />
                          {d.label}
                        </span>
                        <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {dimScore}%
                        </span>
                      </div>
                      
                      <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${dimScore}%`, backgroundColor: level.color }}
                        />
                      </div>
                      
                      <div className="text-[10px] text-slate-400 mt-1.5 font-mono">{d.ref}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Öncelikli Gelişim Alanları */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 print:shadow-none print:border-slate-300">
              <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                Öncelikli Gelişim Alanları
              </h3>
              
              <div className="space-y-3">
                {weakestDims.map((d) => (
                  <div key={d.key} className="flex gap-3.5 p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl">
                    <div className="w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: level.color }} />
                    <div>
                      <div className="text-sm font-bold text-slate-900">{d.label}</div>
                      <div className="text-xs text-slate-600 mt-1 leading-relaxed">{DIM_RECS[d.key]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eylemler */}
            <div className="flex flex-col sm:flex-row gap-3 print:hidden pt-2">
              <button 
                onClick={() => window.print()} 
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 text-sm font-semibold shadow-lg shadow-slate-900/10 transition"
              >
                <Printer className="w-4 h-4" />
                PDF Raporu İndir
              </button>
              <button 
                onClick={restart} 
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl py-3.5 text-sm font-semibold transition"
              >
                <RotateCcw className="w-4 h-4" />
                Yeniden Başlat
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">
              Bu sonuç bir öz-değerlendirmedir; ISO 22301 sertifikasyonu veya resmi denetimin yerine geçmez.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 print:hidden">
        Çorlu Ticaret ve Sanayi Odası © Afet &amp; İş Sürekliliği Skorkartı
      </footer>

      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
    </div>
  );
}
