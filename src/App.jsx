import React, { useState, useRef, useId } from "react";
import {
  ScanLine, Camera, ClipboardCheck, Activity, AlertTriangle,
  CheckCircle2, XCircle, FileWarning, LayoutDashboard, Download, FileText,
  Paperclip, ChevronLeft, ChevronRight, Home, PackageSearch, Users, Calendar,
  StopCircle, BellRing, FlaskConical, ClipboardList, ShieldCheck
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from "recharts";

/* ---------------------------------------------------------
   QC LINE — v2: "ใบตรวจ QC" (Inspection Ticket / Rubber-stamp)
   Same 9-step user journey, new visual identity:
   worn paper ticket, hairline rules, ink rubber-stamps for
   pass/fail/hold decisions instead of an industrial panel.
--------------------------------------------------------- */

const FONTS = `
:root{
  --paper:        #F3EFE4;
  --paper-card:   #FBF9F3;
  --paper-edge:   #E4DCC8;
  --ink-900:      #221F1B;
  --ink-600:      #6E6656;
  --ink-400:      #A69C86;
  --stamp-green:      #2F6F4F;
  --stamp-green-wash: #E3ECE3;
  --stamp-red:         #AE3A2E;
  --stamp-red-wash:    #F3E3DE;
  --stamp-amber:       #B87A22;
  --stamp-amber-wash:  #F3E7CE;
  --stamp-blue:        #33587F;
  --stamp-blue-wash:   #E1E8EE;
}
.qc2-root, .qc2-root * { font-family:'Sarabun','IBM Plex Sans Thai',sans-serif; box-sizing:border-box; }
.qc2-display { font-family:'IBM Plex Sans Thai',sans-serif; }
.qc2-mono { font-family:'IBM Plex Mono',monospace; }
.qc2-root ::-webkit-scrollbar{ width:6px; }
.qc2-root ::-webkit-scrollbar-thumb{ background:var(--paper-edge); border-radius:4px; }
.qc2-grain{
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
}
.qc2-tear{
  background-image: repeating-linear-gradient(90deg, var(--ink-400) 0 6px, transparent 6px 12px);
  height: 1px;
  opacity: 0.5;
}
`;

/* ---------- mock data (shared shape with v1) ---------- */
const AQL_SPECS = {
  "SKU-1180": { name: "ขวดพลาสติก PET 250ml", param: "น้ำหนักขวด (g)", min: 11.8, max: 12.6, sampleSize: 20, aqlLevel: "AQL 2.5" },
  "SKU-3305": { name: "แผ่นฟิล์มบรรจุภัณฑ์ 40 mic", param: "ความหนา (micron)", min: 38, max: 42, sampleSize: 8, aqlLevel: "AQL 1.0" },
};

const initialLots = [
  { id: "LOT-260718-02", sku: "SKU-1180", line: "ไลน์ 1", stage: "pending" },
  { id: "LOT-260718-03", sku: "SKU-3305", line: "ไลน์ 3", stage: "pending" },
].map(l => ({
  ...l,
  incoming: null,
  spcReadings: [],
  final: null,
  decision: null,
  ncr: null,
}));

const STAGE_META = {
  pending:   { label: "รอเริ่มตรวจ",   tone: "ink" },
  incoming:  { label: "ตรวจขาเข้า",    tone: "blue" },
  inprocess: { label: "ระหว่างผลิต",   tone: "amber" },
  final:     { label: "ตรวจสำเร็จรูป", tone: "amber" },
  released:  { label: "ปล่อยผ่าน",     tone: "green" },
  held:      { label: "กักสินค้า",     tone: "red" },
};

function tone(t) {
  const map = {
    green: { fg: "var(--stamp-green)", wash: "var(--stamp-green-wash)" },
    amber: { fg: "var(--stamp-amber)", wash: "var(--stamp-amber-wash)" },
    red:   { fg: "var(--stamp-red)",   wash: "var(--stamp-red-wash)" },
    blue:  { fg: "var(--stamp-blue)",  wash: "var(--stamp-blue-wash)" },
    ink:   { fg: "var(--ink-600)",     wash: "#EAE5D8" },
  };
  return map[t] || map.ink;
}

/* ---------- Rubber-stamp signature element ---------- */
function Stamp({ text, sub, tone: t = "green", size = 96, rotate = -7 }) {
  const rid = useId().replace(/[:]/g, "");
  const c = tone(t).fg;
  return (
    <div style={{ transform: `rotate(${rotate}deg)`, width: size, height: size }} className="inline-block shrink-0">
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <filter id={`rough-${rid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
        </filter>
        <g filter={`url(#rough-${rid})`} fill="none" stroke={c}>
          <circle cx="60" cy="60" r="50" strokeWidth="4.5" />
          <circle cx="60" cy="60" r="41" strokeWidth="1.5" />
        </g>
        <text x="60" y="57" textAnchor="middle" fontSize="17" fontWeight="700" fill={c} className="qc2-display">{text}</text>
        {sub && <text x="60" y="74" textAnchor="middle" fontSize="8.5" fontWeight="600" letterSpacing="1" fill={c} className="qc2-mono">{sub}</text>}
      </svg>
    </div>
  );
}

function Tag({ stage }) {
  const meta = STAGE_META[stage] || STAGE_META.pending;
  const c = tone(meta.tone);
  return (
    <span
      className="qc2-display text-[11px] font-semibold px-2.5 py-1 rounded-sm tracking-wide"
      style={{ background: c.wash, color: c.fg, border: `1px solid ${c.fg}44` }}
    >
      {meta.label}
    </span>
  );
}

function Btn({ children, onClick, tone: t = "green", disabled, icon: Icon, full = true, outline = false }) {
  const c = tone(t);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} flex items-center justify-center gap-2 rounded-md py-4 px-5 text-[15px] font-semibold qc2-display tracking-wide transition-transform active:scale-[0.98] disabled:opacity-35`}
      style={
        outline
          ? { background: "transparent", color: disabled ? "var(--ink-400)" : c.fg, border: `2px solid ${disabled ? "var(--paper-edge)" : c.fg}` }
          : { background: disabled ? "var(--paper-edge)" : c.fg, color: disabled ? "var(--ink-400)" : "var(--paper-card)" }
      }
    >
      {Icon && <Icon size={18} strokeWidth={2.4} />}
      {children}
    </button>
  );
}

function Sheet({ children, className = "" }) {
  return (
    <div
      className={`rounded-md p-4 ${className}`}
      style={{ background: "var(--paper-card)", border: "1px solid var(--paper-edge)", boxShadow: "0 1px 0 var(--paper-edge)" }}
    >
      {children}
    </div>
  );
}

function ScreenHead({ eyebrow, title, subtitle, onBack }) {
  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        {onBack && (
          <button onClick={onBack} className="mt-1 shrink-0 rounded-full p-2" style={{ background: "var(--paper-edge)", color: "var(--ink-900)" }}>
            <ChevronLeft size={18} />
          </button>
        )}
        <div>
          {eyebrow && <div className="qc2-mono text-[10px] tracking-[0.15em] mb-0.5" style={{ color: "var(--ink-400)" }}>{eyebrow}</div>}
          <h1 className="qc2-display text-xl font-bold tracking-wide" style={{ color: "var(--ink-900)" }}>{title}</h1>
          {subtitle && <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-600)" }}>{subtitle}</p>}
        </div>
      </div>
      <div className="qc2-tear mt-3" />
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const show = (msg, t = "green") => {
    clearTimeout(timerRef.current);
    setToast({ msg, t });
    timerRef.current = setTimeout(() => setToast(null), 2600);
  };
  return [toast, show];
}

function Toast({ toast }) {
  if (!toast) return null;
  const c = tone(toast.t);
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 py-3 rounded-md shadow-lg text-[13px] font-medium max-w-[90%]"
      style={{ background: c.wash, color: c.fg, border: `1px solid ${c.fg}55` }}
    >
      {toast.msg}
    </div>
  );
}

/* ---------------- Ticket header (clipboard strip) ---------------- */
function TicketHeader({ lots, shiftLabel }) {
  const held = lots.filter(l => l.stage === "held").length;
  const active = lots.filter(l => l.stage !== "pending").length;
  let statusText = `กะปกติ · ${active} ล็อตกำลังตรวจ`;
  let statusTone = "green";
  if (held > 0) { statusText = `มีล็อตถูกกัก ${held} รายการ`; statusTone = "red"; }
  const c = tone(statusTone);

  return (
    <div className="qc2-grain" style={{ background: "var(--paper)" }}>
      <div className="flex justify-center pt-2">
        <div className="w-16 h-4 rounded-b-md" style={{ background: "var(--ink-400)" }} />
      </div>
      <div className="px-4 pt-2 pb-3 flex items-center justify-between">
        <div>
          <div className="qc2-display text-[15px] font-bold tracking-wide" style={{ color: "var(--ink-900)" }}>ใบตรวจ QC</div>
          <div className="qc2-mono text-[10px] tracking-wide" style={{ color: "var(--ink-400)" }}>{shiftLabel}</div>
        </div>
        <div
          className="qc2-display text-[11px] font-semibold px-2.5 py-1 rounded-sm"
          style={{ background: c.wash, color: c.fg, border: `1px solid ${c.fg}44` }}
        >
          {statusText}
        </div>
      </div>
      <div className="qc2-tear" />
    </div>
  );
}

/* ---------------- Folder-tab bottom nav ---------------- */
const NAV_ITEMS = [
  { key: "home", label: "หน้าแรก", icon: Home },
  { key: "incoming-scan", label: "ขาเข้า", icon: PackageSearch },
  { key: "inprocess", label: "ระหว่างผลิต", icon: Activity },
  { key: "final", label: "สำเร็จรูป", icon: FlaskConical },
  { key: "ncr", label: "NCR", icon: FileWarning },
  { key: "dashboard", label: "สรุปผล", icon: LayoutDashboard },
];

function TabNav({ screen, setScreen }) {
  const groupFor = (s) => {
    if (["home"].includes(s)) return "home";
    if (["incoming-scan", "incoming-result"].includes(s)) return "incoming-scan";
    if (["inprocess", "alert"].includes(s)) return "inprocess";
    if (["final", "decision"].includes(s)) return "final";
    if (["ncr"].includes(s)) return "ncr";
    if (["dashboard"].includes(s)) return "dashboard";
    return s;
  };
  const active = groupFor(screen);
  return (
    <div className="grid grid-cols-6" style={{ background: "var(--paper)", borderTop: "1px solid var(--paper-edge)" }}>
      {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => setScreen(key)}
            className="flex flex-col items-center gap-1 py-2.5 relative"
          >
            {isActive && <div className="absolute top-0 left-3 right-3 h-0.5" style={{ background: "var(--stamp-amber)" }} />}
            <Icon size={19} strokeWidth={isActive ? 2.6 : 2} color={isActive ? "var(--ink-900)" : "var(--ink-400)"} />
            <span className="text-[10px] qc2-display font-medium tracking-wide" style={{ color: isActive ? "var(--ink-900)" : "var(--ink-400)" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ================= SCREEN 1: HOME ================= */
function HomeScreen({ lots, goToLot }) {
  const [lineFilter, setLineFilter] = useState("ทั้งหมด");
  const lines = ["ทั้งหมด", ...Array.from(new Set(lots.map(l => l.line)))];
  const filtered = lineFilter === "ทั้งหมด" ? lots : lots.filter(l => l.line === lineFilter);

  const nextScreenForStage = (stage) => {
    if (stage === "pending") return "incoming-scan";
    if (stage === "incoming") return "inprocess";
    if (stage === "inprocess") return "final";
    if (stage === "final") return "decision";
    if (stage === "held") return "ncr";
    return "dashboard";
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ก่อนเริ่มกะ" title="เริ่มตรวจ QC" subtitle="เลือกไลน์ผลิต / ล็อตที่จะตรวจ" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {lines.map(l => (
          <button
            key={l}
            onClick={() => setLineFilter(l)}
            className="shrink-0 px-3.5 py-1.5 rounded-sm text-[12px] qc2-display font-semibold tracking-wide"
            style={{
              background: lineFilter === l ? "var(--ink-900)" : "var(--paper-edge)",
              color: lineFilter === l ? "var(--paper-card)" : "var(--ink-900)"
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>
        รายการตรวจในกะนี้ ({filtered.length})
      </div>

      <div className="space-y-3">
        {filtered.map(lot => {
          const spec = AQL_SPECS[lot.sku];
          return (
            <Sheet key={lot.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="qc2-mono text-[12px] font-semibold" style={{ color: "var(--ink-600)" }}>{lot.id}</div>
                  <div className="text-[14px] font-medium mt-0.5" style={{ color: "var(--ink-900)" }}>{spec.name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--ink-400)" }}>{lot.line} · {spec.aqlLevel}</div>
                </div>
                <Tag stage={lot.stage} />
              </div>
              <Btn
                tone={lot.stage === "held" ? "red" : "amber"}
                outline={lot.stage === "released"}
                icon={lot.stage === "held" ? FileWarning : ScanLine}
                disabled={lot.stage === "released"}
                onClick={() => goToLot(lot.id, nextScreenForStage(lot.stage))}
              >
                {lot.stage === "pending" && "เริ่มตรวจ QC"}
                {lot.stage === "incoming" && "ไปตรวจระหว่างผลิต"}
                {lot.stage === "inprocess" && "ไปตรวจสำเร็จรูป"}
                {lot.stage === "final" && "ไปตัดสินใจผ่าน/ไม่ผ่าน"}
                {lot.stage === "held" && "ดูเคส NCR"}
                {lot.stage === "released" && "ตรวจเสร็จแล้ว"}
              </Btn>
            </Sheet>
          );
        })}
      </div>
    </div>
  );
}

/* ================= SCREEN 2: INCOMING SCAN ================= */
function IncomingScanScreen({ lot, onScanned, goBack }) {
  const [code, setCode] = useState(lot?.id || "");
  const [photoTaken, setPhotoTaken] = useState(false);
  const spec = lot ? AQL_SPECS[lot.sku] : null;

  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ขั้นตอน 2" title="ตรวจวัตถุดิบขาเข้า" subtitle="สแกน/กรอกรหัสล็อต แล้วถ่ายรูปตัวอย่าง" onBack={goBack} />

      <Sheet className="space-y-3">
        <label className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>รหัสล็อตวัตถุดิบ</label>
        <div className="flex items-center gap-2 rounded-md px-3 py-3" style={{ background: "var(--paper)", border: "1px dashed var(--paper-edge)" }}>
          <ScanLine size={18} color="var(--stamp-blue)" />
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="สแกนบาร์โค้ด หรือพิมพ์รหัสล็อต"
            className="qc2-mono bg-transparent outline-none flex-1 text-[14px]"
            style={{ color: "var(--ink-900)" }}
          />
        </div>

        {code && spec && (
          <div className="rounded-md p-3 space-y-1" style={{ background: "var(--stamp-blue-wash)" }}>
            <div className="qc2-mono text-[10px] tracking-wide font-semibold" style={{ color: "var(--stamp-blue)" }}>
              ดึงสเปค AQL อัตโนมัติ
            </div>
            <div className="text-[13px]" style={{ color: "var(--ink-900)" }}>{spec.name}</div>
            <div className="qc2-mono text-[11px]" style={{ color: "var(--ink-600)" }}>
              {spec.param}: {spec.min}–{spec.max} · ตัวอย่าง {spec.sampleSize} ชิ้น · {spec.aqlLevel}
            </div>
          </div>
        )}
      </Sheet>

      <Sheet className="space-y-3">
        <label className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>ถ่ายรูปตัวอย่าง</label>
        <button
          onClick={() => setPhotoTaken(true)}
          className="w-full h-32 rounded-md flex flex-col items-center justify-center gap-1.5"
          style={{ border: `2px dashed ${photoTaken ? "var(--stamp-green)" : "var(--paper-edge)"}`, background: "var(--paper)" }}
        >
          {photoTaken ? (
            <>
              <CheckCircle2 size={26} color="var(--stamp-green)" />
              <span className="text-[12px]" style={{ color: "var(--stamp-green)" }}>แนบรูปแล้ว 1 ไฟล์</span>
            </>
          ) : (
            <>
              <Camera size={26} color="var(--ink-400)" />
              <span className="text-[12px]" style={{ color: "var(--ink-400)" }}>แตะเพื่อถ่ายรูปตัวอย่าง</span>
            </>
          )}
        </button>
      </Sheet>

      <Btn tone="blue" icon={ChevronRight} disabled={!code || !photoTaken} onClick={() => onScanned(code)}>
        ไปบันทึกผลตรวจ
      </Btn>
    </div>
  );
}

/* ================= SCREEN 3: INCOMING RESULT ================= */
function IncomingResultScreen({ lot, onSubmit, goBack, showToast }) {
  const spec = AQL_SPECS[lot.sku];
  const [result, setResult] = useState(null);
  const [coa, setCoa] = useState(false);
  const [touched, setTouched] = useState(false);
  const canSubmit = result && coa;

  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ขั้นตอน 3" title="บันทึกผลตรวจขาเข้า" subtitle={`${lot.id} · ${spec.name}`} onBack={goBack} />

      <Sheet className="space-y-3">
        <div className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>ผลตรวจ</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setResult("pass")}
            className="rounded-md py-4 flex flex-col items-center gap-1.5"
            style={{ border: `2px solid ${result === "pass" ? "var(--stamp-green)" : "var(--paper-edge)"}`, background: result === "pass" ? "var(--stamp-green-wash)" : "var(--paper)" }}
          >
            <CheckCircle2 size={22} color="var(--stamp-green)" />
            <span className="text-[13px] font-semibold qc2-display" style={{ color: "var(--ink-900)" }}>ผ่าน</span>
          </button>
          <button
            onClick={() => setResult("fail")}
            className="rounded-md py-4 flex flex-col items-center gap-1.5"
            style={{ border: `2px solid ${result === "fail" ? "var(--stamp-red)" : "var(--paper-edge)"}`, background: result === "fail" ? "var(--stamp-red-wash)" : "var(--paper)" }}
          >
            <XCircle size={22} color="var(--stamp-red)" />
            <span className="text-[13px] font-semibold qc2-display" style={{ color: "var(--ink-900)" }}>ไม่ผ่าน</span>
          </button>
        </div>
      </Sheet>

      <Sheet className="space-y-3">
        <div className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>เอกสารแนบ</div>
        <button onClick={() => setCoa(true)} className="w-full flex items-center gap-3 rounded-md px-3 py-3" style={{ background: "var(--paper)", border: "1px dashed var(--paper-edge)" }}>
          <Paperclip size={18} color={coa ? "var(--stamp-green)" : "var(--ink-400)"} />
          <span className="text-[13px] flex-1 text-left" style={{ color: "var(--ink-900)" }}>
            {coa ? "แนบแล้ว: CoA_CoC_260718.pdf" : "แนบเอกสาร CoA / CoC"}
          </span>
          {coa && <CheckCircle2 size={16} color="var(--stamp-green)" />}
        </button>
        {touched && !coa && (
          <div className="text-[12px] font-medium" style={{ color: "var(--stamp-red)" }}>
            ต้องแนบเอกสาร CoA/CoC ก่อนบันทึกผล
          </div>
        )}
      </Sheet>

      <Btn
        tone={result === "fail" ? "red" : "green"}
        icon={ClipboardCheck}
        onClick={() => {
          setTouched(true);
          if (!canSubmit) { showToast("กรอกข้อมูลให้ครบก่อนบันทึกผล", "red"); return; }
          onSubmit(result);
        }}
      >
        บันทึกผลตรวจขาเข้า
      </Btn>
    </div>
  );
}

/* ================= SCREEN 4: IN-PROCESS QC (SPC) ================= */
function InProcessScreen({ lot, spec, onReading, goBack, showToast }) {
  const [value, setValue] = useState("");
  const readings = lot.spcReadings;
  const chartData = readings.map((r, i) => ({ name: `รอบ ${i + 1}`, value: r.value }));

  const submit = () => {
    const v = parseFloat(value);
    if (isNaN(v)) { showToast("กรอกค่าพารามิเตอร์เป็นตัวเลข", "red"); return; }
    const inRange = v >= spec.min && v <= spec.max;
    onReading({ value: v, inRange, t: readings.length + 1 });
    setValue("");
    if (!inRange) showToast("ค่าออกนอกเกณฑ์ — กำลังแจ้งเตือนหัวหน้างาน", "red");
    else showToast("บันทึกค่าแล้ว อยู่ในเกณฑ์ควบคุม", "green");
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ขั้นตอน 4" title="ตรวจระหว่างผลิต" subtitle={`${lot.id} · ${spec.param} ตามรอบเวลา (SPC)`} onBack={goBack} />

      <Sheet>
        <div className="flex items-center justify-between mb-2">
          <div className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>แนวโน้มค่าเทียบ Control Limit</div>
          <div className="qc2-mono text-[11px]" style={{ color: "var(--ink-400)" }}>UCL {spec.max} / LCL {spec.min}</div>
        </div>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--paper-edge)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "var(--ink-400)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--ink-400)", fontSize: 10 }} domain={[spec.min - 1, spec.max + 1]} />
              <Tooltip contentStyle={{ background: "var(--paper-card)", border: "1px solid var(--paper-edge)", fontSize: 12 }} labelStyle={{ color: "var(--ink-900)" }} />
              <ReferenceLine y={spec.max} stroke="var(--stamp-red)" strokeDasharray="4 4" />
              <ReferenceLine y={spec.min} stroke="var(--stamp-red)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="value" stroke="var(--stamp-amber)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Sheet>

      <Sheet className="space-y-3">
        <div className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>
          กรอกค่าพารามิเตอร์ (รอบที่ {readings.length + 1})
        </div>
        <div className="flex items-center gap-2 rounded-md px-3 py-3" style={{ background: "var(--paper)", border: "1px dashed var(--paper-edge)" }}>
          <Activity size={18} color="var(--stamp-amber)" />
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            inputMode="decimal"
            placeholder={`เช่น ${((spec.min + spec.max) / 2).toFixed(1)}`}
            className="qc2-mono bg-transparent outline-none flex-1 text-[15px]"
            style={{ color: "var(--ink-900)" }}
          />
        </div>
        <Btn tone="amber" icon={ClipboardCheck} onClick={submit}>บันทึกค่า</Btn>
      </Sheet>

      <div className="grid grid-cols-3 gap-2">
        {readings.slice(-3).reverse().map((r, i) => (
          <Sheet key={i} className="!p-2.5 text-center">
            <div className="qc2-mono text-[15px] font-semibold" style={{ color: r.inRange ? "var(--stamp-green)" : "var(--stamp-red)" }}>{r.value}</div>
            <div className="text-[10px]" style={{ color: "var(--ink-400)" }}>รอบ {readings.length - i}</div>
          </Sheet>
        ))}
      </div>
    </div>
  );
}

/* ================= SCREEN 5: ALERT ================= */
function AlertScreen({ lot, reading, onAck, onStopLine, goBack }) {
  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ขั้นตอน 5" title="แจ้งเตือนค่าออกนอกเกณฑ์" subtitle={lot.id} onBack={goBack} />

      <Sheet style={{ background: "var(--stamp-red-wash)", borderColor: "var(--stamp-red)" }} className="space-y-3">
        <div className="flex items-center gap-2">
          <BellRing size={22} color="var(--stamp-red)" />
          <span className="qc2-display font-bold text-[14px]" style={{ color: "var(--stamp-red)" }}>ค่าพารามิเตอร์เกินเกณฑ์ควบคุม</span>
        </div>
        <div className="qc2-mono text-[26px] font-bold" style={{ color: "var(--ink-900)" }}>{reading?.value}</div>
        <div className="text-[12px]" style={{ color: "var(--ink-900)" }}>
          ระบบแจ้งเตือนหัวหน้างานผ่าน Push Notification แล้ว (ภายใน 30 วินาที)
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-3">
        <Btn tone="amber" icon={CheckCircle2} onClick={onAck}>รับทราบ — เฝ้าระวังรอบถัดไป</Btn>
        <Btn tone="red" icon={StopCircle} onClick={onStopLine}>สั่งหยุดไลน์ (Stop-line)</Btn>
      </div>
    </div>
  );
}

/* ================= SCREEN 6: FINAL INSPECTION ================= */
function FinalScreen({ lot, spec, onSubmit, goBack, showToast }) {
  const [checks, setChecks] = useState(Array(spec.sampleSize).fill(null));
  const passCount = checks.filter(c => c === "pass").length;
  const failCount = checks.filter(c => c === "fail").length;
  const doneCount = passCount + failCount;

  const toggle = (i) => {
    const next = [...checks];
    next[i] = next[i] === "pass" ? "fail" : next[i] === "fail" ? null : "pass";
    setChecks(next);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ขั้นตอน 6" title="ตรวจสินค้าสำเร็จรูป" subtitle={`${lot.id} · สุ่มตัวอย่าง ${spec.sampleSize} ชิ้น (${spec.aqlLevel})`} onBack={goBack} />

      <Sheet>
        <div className="flex items-center justify-between mb-3">
          <div className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>ทดสอบตามมาตรฐานผลิตภัณฑ์</div>
          <div className="qc2-mono text-[11px]" style={{ color: "var(--ink-400)" }}>{doneCount}/{spec.sampleSize}</div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {checks.map((c, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="aspect-square rounded-sm flex items-center justify-center qc2-mono text-[12px] font-semibold"
              style={{
                background: c === "pass" ? "var(--stamp-green-wash)" : c === "fail" ? "var(--stamp-red-wash)" : "var(--paper)",
                color: c === "pass" ? "var(--stamp-green)" : c === "fail" ? "var(--stamp-red)" : "var(--ink-400)",
                border: `1px solid ${c === "pass" ? "var(--stamp-green)" : c === "fail" ? "var(--stamp-red)" : "var(--paper-edge)"}`
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="text-[11px] mt-3" style={{ color: "var(--ink-400)" }}>แตะแต่ละชิ้น: ว่าง → ผ่าน → ไม่ผ่าน</div>
      </Sheet>

      <div className="grid grid-cols-2 gap-3">
        <Sheet className="text-center !py-3">
          <div className="qc2-mono text-[20px] font-bold" style={{ color: "var(--stamp-green)" }}>{passCount}</div>
          <div className="text-[11px]" style={{ color: "var(--ink-400)" }}>ผ่าน</div>
        </Sheet>
        <Sheet className="text-center !py-3">
          <div className="qc2-mono text-[20px] font-bold" style={{ color: "var(--stamp-red)" }}>{failCount}</div>
          <div className="text-[11px]" style={{ color: "var(--ink-400)" }}>ไม่ผ่าน</div>
        </Sheet>
      </div>

      <Btn
        tone="amber"
        icon={ClipboardCheck}
        disabled={doneCount < spec.sampleSize}
        onClick={() => {
          const result = failCount === 0 ? "pass" : "fail";
          showToast(result === "pass" ? "ผ่านเกณฑ์ AQL — ไปหน้าตัดสินใจ" : "ไม่ผ่านเกณฑ์ AQL — ต้องกักสินค้า", result === "pass" ? "green" : "red");
          onSubmit({ passCount, failCount, result });
        }}
      >
        คำนวณผลสรุป AQL
      </Btn>
    </div>
  );
}

/* ================= SCREEN 7: DECISION ================= */
function DecisionScreen({ lot, spec, onDecide, goBack }) {
  const suggested = lot.final?.result === "fail" ? "held" : "released";
  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ขั้นตอน 7" title="ตัดสินใจผ่าน/ไม่ผ่าน" subtitle={`${lot.id} · ${spec.name}`} onBack={goBack} />

      <Sheet className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="qc2-mono text-[11px] tracking-wide mb-1" style={{ color: "var(--ink-400)" }}>ผลตรวจสำเร็จรูป</div>
            <div className="flex items-center gap-4">
              <div><span className="qc2-mono text-[18px] font-bold" style={{ color: "var(--stamp-green)" }}>{lot.final?.passCount ?? 0}</span> <span className="text-[12px]" style={{ color: "var(--ink-400)" }}>ผ่าน</span></div>
              <div><span className="qc2-mono text-[18px] font-bold" style={{ color: "var(--stamp-red)" }}>{lot.final?.failCount ?? 0}</span> <span className="text-[12px]" style={{ color: "var(--ink-400)" }}>ไม่ผ่าน</span></div>
            </div>
          </div>
          <Stamp text={suggested === "held" ? "NG" : "OK"} sub={suggested === "held" ? "REJECT" : "PASS"} tone={suggested === "held" ? "red" : "green"} size={72} />
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-3">
        <Btn tone="green" icon={CheckCircle2} onClick={() => onDecide("released")}>ผ่าน — ปล่อยสินค้า (ออกใบ COA อัตโนมัติ)</Btn>
        <Btn tone="red" icon={FileWarning} onClick={() => onDecide("held")}>ไม่ผ่าน — กักสินค้า (ออกใบ NCR อัตโนมัติ)</Btn>
      </div>
    </div>
  );
}

/* ================= SCREEN 8: NCR TRACKING ================= */
const CAUSE_OPTIONS = ["วัตถุดิบไม่ได้มาตรฐาน", "เครื่องจักรปรับตั้งคลาดเคลื่อน", "ขั้นตอนปฏิบัติงานผิดพลาด", "สภาพแวดล้อมการผลิต", "อื่น ๆ"];

function NCRScreen({ lots, updateNCR, showToast }) {
  const ncrLots = lots.filter(l => l.stage === "held");
  const [openId, setOpenId] = useState(ncrLots[0]?.id || null);

  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ขั้นตอน 8" title="ติดตาม NCR" subtitle="กรณีไม่ผ่าน — ระบุสาเหตุ มอบหมายผู้รับผิดชอบ" />

      {ncrLots.length === 0 && (
        <Sheet className="text-center py-8">
          <ShieldCheck size={28} color="var(--stamp-green)" className="mx-auto mb-2" />
          <div className="text-[13px]" style={{ color: "var(--ink-900)" }}>ไม่มีเคส NCR ที่เปิดอยู่ในกะนี้</div>
        </Sheet>
      )}

      <div className="space-y-3">
        {ncrLots.map(lot => {
          const spec = AQL_SPECS[lot.sku];
          const ncr = lot.ncr || {};
          const isOpen = openId === lot.id;
          return (
            <Sheet key={lot.id} className="space-y-3">
              <button className="w-full flex items-center justify-between" onClick={() => setOpenId(isOpen ? null : lot.id)}>
                <div className="text-left">
                  <div className="qc2-mono text-[12px] font-semibold" style={{ color: "var(--stamp-red)" }}>{lot.id}</div>
                  <div className="text-[13px]" style={{ color: "var(--ink-900)" }}>{spec.name}</div>
                </div>
                <span
                  className="text-[11px] qc2-display font-semibold px-2.5 py-1 rounded-sm"
                  style={{
                    background: ncr.status === "closed" ? "var(--stamp-green-wash)" : "var(--stamp-amber-wash)",
                    color: ncr.status === "closed" ? "var(--stamp-green)" : "var(--stamp-amber)"
                  }}
                >
                  {ncr.status === "closed" ? "ปิดเคสแล้ว" : "กำลังดำเนินการ"}
                </span>
              </button>

              {isOpen && (
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="qc2-mono text-[10px] tracking-wide mb-1.5" style={{ color: "var(--ink-400)" }}>สาเหตุเบื้องต้น</div>
                    <div className="flex flex-wrap gap-2">
                      {CAUSE_OPTIONS.map(c => (
                        <button
                          key={c}
                          onClick={() => updateNCR(lot.id, { cause: c })}
                          className="text-[12px] px-3 py-1.5 rounded-sm"
                          style={{
                            background: ncr.cause === c ? "var(--stamp-blue)" : "var(--paper)",
                            color: ncr.cause === c ? "var(--paper-card)" : "var(--ink-900)",
                            border: `1px solid ${ncr.cause === c ? "var(--stamp-blue)" : "var(--paper-edge)"}`
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="qc2-mono text-[10px] tracking-wide mb-1.5" style={{ color: "var(--ink-400)" }}>ผู้รับผิดชอบแก้ไข</div>
                    <div className="flex items-center gap-2 rounded-md px-3 py-2.5" style={{ background: "var(--paper)", border: "1px dashed var(--paper-edge)" }}>
                      <Users size={16} color="var(--ink-400)" />
                      <input
                        defaultValue={ncr.owner || ""}
                        onBlur={e => updateNCR(lot.id, { owner: e.target.value })}
                        placeholder="ชื่อผู้รับผิดชอบ"
                        className="bg-transparent outline-none flex-1 text-[13px]"
                        style={{ color: "var(--ink-900)" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="qc2-mono text-[10px] tracking-wide mb-1.5" style={{ color: "var(--ink-400)" }}>กำหนดเวลาแก้ไข</div>
                    <div className="flex items-center gap-2 rounded-md px-3 py-2.5" style={{ background: "var(--paper)", border: "1px dashed var(--paper-edge)" }}>
                      <Calendar size={16} color="var(--ink-400)" />
                      <input
                        type="date"
                        defaultValue={ncr.dueDate || ""}
                        onChange={e => updateNCR(lot.id, { dueDate: e.target.value })}
                        className="bg-transparent outline-none flex-1 text-[13px] qc2-mono"
                        style={{ color: "var(--ink-900)" }}
                      />
                    </div>
                  </div>

                  <Btn
                    tone="blue"
                    icon={ClipboardList}
                    disabled={ncr.status === "closed"}
                    onClick={() => {
                      if (!ncr.cause || !ncr.owner || !ncr.dueDate) { showToast("กรอกสาเหตุ ผู้รับผิดชอบ และกำหนดเวลาให้ครบ", "red"); return; }
                      updateNCR(lot.id, { status: "closed" });
                      showToast("สร้าง case ติดตาม root cause สำเร็จ", "blue");
                    }}
                  >
                    {ncr.status === "closed" ? "ปิดเคสแล้ว" : "สร้าง Case ติดตาม"}
                  </Btn>
                </div>
              )}
            </Sheet>
          );
        })}
      </div>
    </div>
  );
}

/* ================= SCREEN 9: DASHBOARD ================= */
function DashboardScreen({ lots, showToast }) {
  const total = lots.length;
  const released = lots.filter(l => l.stage === "released").length;
  const held = lots.filter(l => l.stage === "held").length;
  const inProgress = total - released - held;

  const stats = [
    { label: "ล็อตทั้งหมดวันนี้", value: total, t: "ink" },
    { label: "ปล่อยผ่านแล้ว", value: released, t: "green" },
    { label: "กำลังตรวจ", value: inProgress, t: "amber" },
    { label: "กักสินค้า / NCR", value: held, t: "red" },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <ScreenHead eyebrow="ขั้นตอน 9" title="สรุปผล / Dashboard" subtitle="สถานะล็อตทั้งหมดในกะ · เรียลไทม์" />

      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => {
          const c = tone(s.t);
          return (
            <Sheet key={s.label} className="!p-3.5">
              <div className="qc2-mono text-[24px] font-bold" style={{ color: c.fg }}>{s.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-400)" }}>{s.label}</div>
            </Sheet>
          );
        })}
      </div>

      <Sheet className="space-y-3">
        <div className="qc2-mono text-[11px] tracking-wide" style={{ color: "var(--ink-400)" }}>รายการล็อตทั้งหมด</div>
        <div className="space-y-2">
          {lots.map(lot => (
            <div key={lot.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px dashed var(--paper-edge)" }}>
              <div>
                <div className="qc2-mono text-[12px]" style={{ color: "var(--ink-900)" }}>{lot.id}</div>
                <div className="text-[11px]" style={{ color: "var(--ink-400)" }}>{lot.line}</div>
              </div>
              <Tag stage={lot.stage} />
            </div>
          ))}
        </div>
      </Sheet>

      <div className="grid grid-cols-2 gap-3">
        <Btn tone="blue" outline icon={Download} onClick={() => showToast("ส่งออกรายงาน PDF สำเร็จ", "green")}>PDF</Btn>
        <Btn tone="blue" outline icon={FileText} onClick={() => showToast("ส่งออกรายงาน Excel สำเร็จ", "green")}>Excel</Btn>
      </div>
    </div>
  );
}

/* ================= APP ROOT ================= */
export default function AppV2() {
  const [lots, setLots] = useState(initialLots);
  const [screen, setScreen] = useState("home");
  const [activeLotId, setActiveLotId] = useState(null);
  const [pendingReading, setPendingReading] = useState(null);
  const [toast, showToast] = useToast();

  const activeLot = lots.find(l => l.id === activeLotId);

  const updateLot = (id, patch) => {
    setLots(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  };

  const goToLot = (id, targetScreen) => {
    setActiveLotId(id);
    setScreen(targetScreen);
  };

  let body = null;

  if (screen === "home") {
    body = <HomeScreen lots={lots} goToLot={goToLot} />;
  } else if (screen === "incoming-scan") {
    body = (
      <IncomingScanScreen
        lot={activeLot || lots[0]}
        goBack={() => setScreen("home")}
        onScanned={() => { setActiveLotId((activeLot || lots[0]).id); setScreen("incoming-result"); }}
      />
    );
  } else if (screen === "incoming-result") {
    body = (
      <IncomingResultScreen
        lot={activeLot}
        goBack={() => setScreen("incoming-scan")}
        showToast={showToast}
        onSubmit={(result) => {
          updateLot(activeLot.id, { stage: "incoming", incoming: { result, checkedAt: Date.now() } });
          showToast(result === "pass" ? "บันทึกผลตรวจขาเข้าสำเร็จ — ผ่าน" : "บันทึกผลตรวจขาเข้า — ไม่ผ่าน", result === "pass" ? "green" : "red");
          setScreen("home");
        }}
      />
    );
  } else if (screen === "inprocess") {
    const spec = AQL_SPECS[activeLot.sku];
    body = (
      <InProcessScreen
        lot={activeLot}
        spec={spec}
        goBack={() => setScreen("home")}
        showToast={showToast}
        onReading={(reading) => {
          const readings = [...activeLot.spcReadings, reading];
          updateLot(activeLot.id, { stage: "inprocess", spcReadings: readings });
          if (!reading.inRange) {
            setPendingReading(reading);
            setTimeout(() => setScreen("alert"), 500);
          }
        }}
      />
    );
  } else if (screen === "alert") {
    body = (
      <AlertScreen
        lot={activeLot}
        reading={pendingReading}
        goBack={() => setScreen("inprocess")}
        onAck={() => { showToast("รับทราบแล้ว — เฝ้าระวังรอบถัดไป", "amber"); setScreen("inprocess"); }}
        onStopLine={() => { updateLot(activeLot.id, { stage: "held" }); showToast("สั่งหยุดไลน์แล้ว — สร้างเคส NCR", "red"); setScreen("ncr"); }}
      />
    );
  } else if (screen === "final") {
    const spec = AQL_SPECS[activeLot.sku];
    body = (
      <FinalScreen
        lot={activeLot}
        spec={spec}
        goBack={() => setScreen("home")}
        showToast={showToast}
        onSubmit={(final) => { updateLot(activeLot.id, { stage: "final", final }); setScreen("decision"); }}
      />
    );
  } else if (screen === "decision") {
    const spec = AQL_SPECS[activeLot.sku];
    body = (
      <DecisionScreen
        lot={activeLot}
        spec={spec}
        goBack={() => setScreen("final")}
        onDecide={(stage) => {
          updateLot(activeLot.id, { stage });
          showToast(stage === "released" ? "ออกใบ COA อัตโนมัติ — ปล่อยสินค้าแล้ว" : "ออกใบ NCR อัตโนมัติ — กักสินค้าแล้ว", stage === "released" ? "green" : "red");
          setScreen(stage === "released" ? "dashboard" : "ncr");
        }}
      />
    );
  } else if (screen === "ncr") {
    body = (
      <NCRScreen
        lots={lots}
        showToast={showToast}
        updateNCR={(id, patch) => {
          const lot = lots.find(l => l.id === id);
          updateLot(id, { ncr: { ...lot.ncr, ...patch } });
        }}
      />
    );
  } else if (screen === "dashboard") {
    body = <DashboardScreen lots={lots} showToast={showToast} />;
  }

  return (
    <div className="qc2-root w-full h-full flex justify-center" style={{ background: "#DCD4BE" }}>
      <style>{FONTS}</style>
      <div className="w-full max-w-[430px] h-full flex flex-col shadow-2xl" style={{ background: "var(--paper)", minHeight: 720 }}>
        <TicketHeader lots={lots} shiftLabel="กะเช้า · โรงงานผลิต A · 08:00–16:00" />
        <div className="flex-1 overflow-y-auto pb-4 qc2-grain">
          {body}
        </div>
        <Toast toast={toast} />
        <TabNav screen={screen} setScreen={setScreen} />
      </div>
    </div>
  );
}
