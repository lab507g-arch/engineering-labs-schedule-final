import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, QrCode, X, Printer, Wrench } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { LabSession, DayKey } from '@/types';
import { getLabColor } from '@/utils/labColors';
import { isTimeInRange } from '@/utils/dates';
import { useLang } from '@/context/LanguageContext';

const LAB_EMAILS: Record<string, string> = {
  '312': 'lab312@placeholder.com',
  '328': 'lab328@placeholder.com',
  '330': 'lab330@placeholder.com',
  '339': 'lab339@placeholder.com',
  '408': 'lab408@placeholder.com',
  '507': 'lab507@placeholder.com',
};

const FAULT_TYPES = [
  'جهاز كمبيوتر',
  'شاشة',
  'لوحة مفاتيح / ماوس',
  'طابعة',
  'إضاءة',
  'تكييف',
  'كهرباء',
  'إنترنت / شبكة',
  'أثاث',
  'أخرى',
];

interface FaultForm {
  name: string;
  studentId: string;
  faultType: string;
  description: string;
}

interface LabsOverviewProps {
  sessions: LabSession[];
  onSelectLab: (lab: string) => void;
  currentDay: DayKey;
  currentMinutes: number;
}

export default function LabsOverview({
  sessions,
  onSelectLab,
  currentDay,
  currentMinutes,
}: LabsOverviewProps) {
  const { t } = useLang();
  const [qrLab, setQrLab] = useState<string | null>(null);
  const [faultLab, setFaultLab] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FaultForm>({ name: '', studentId: '', faultType: '', description: '' });
  const [errors, setErrors] = useState<Partial<FaultForm>>({});

  const labCounts = new Map<string, number>();
  for (const s of sessions) {
    labCounts.set(s.lab, (labCounts.get(s.lab) ?? 0) + 1);
  }
  const labs = Array.from(labCounts.keys()).sort();

  const runningByLab = new Map<string, LabSession>();
  for (const s of sessions) {
    if (s.day !== currentDay) continue;
    if (!isTimeInRange(currentMinutes, s.startTime, s.endTime)) continue;
    if (!runningByLab.has(s.lab)) runningByLab.set(s.lab, s);
  }

  const qrUrl =
    qrLab && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?lab=${encodeURIComponent(qrLab)}`
      : '';

  const handlePrintQR = useCallback(() => {
    document.body.classList.add('printing-qr');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-qr'), 500);
  }, []);

  function openFault(lab: string) {
    setFaultLab(lab);
    setSubmitted(false);
    setForm({ name: '', studentId: '', faultType: '', description: '' });
    setErrors({});
  }

  function validate(): boolean {
    const e: Partial<FaultForm> = {};
    if (!form.name.trim()) e.name = 'مطلوب';
    if (!form.studentId.trim()) e.studentId = 'مطلوب';
    if (!form.faultType) e.faultType = 'مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate() || !faultLab) return;
    const email = LAB_EMAILS[faultLab] ?? 'lab507@placeholder.com';
    const now = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' });
    const subject = encodeURIComponent(`بلاغ عطل - ${faultLab}`);
    const body = encodeURIComponent(
      `الاسم: ${form.name}\nرقم الطالب: ${form.studentId}\nالمعمل: ${faultLab}\nنوع العطل: ${form.faultType}\nالوصف: ${form.description || 'لا يوجد'}\nالتوقيت: ${now}`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <div className="no-print">
      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(130px, 100%), 1fr))' }}
      >
        {labs.map((lab) => {
          const count = labCounts.get(lab) ?? 0;
          const color = getLabColor(lab);
          const running = runningByLab.get(lab);
          return (
            <div
              key={lab}
              className="glass-card glass-card-hover rounded-xl p-3 sm:p-4 flex flex-col items-center gap-2 transition-all group relative"
            >
              {/* QR button */}
              <button
                type="button"
                aria-label={`QR ${lab}`}
                data-testid={`qr-button-${lab}`}
                onClick={() => setQrLab(lab)}
                className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {/* Fault button */}
              <button
                type="button"
                aria-label={`أبلغ عن عطل ${lab}`}
                onClick={() => openFault(lab)}
                className="absolute top-1.5 left-1.5 rtl:left-auto rtl:right-1.5 p-1.5 rounded-lg bg-red-700/30 hover:bg-red-600/50 transition-colors cursor-pointer"
                title="أبلغ عن عطل"
              >
                <Wrench className="w-3.5 h-3.5 text-red-300" />
              </button>

              <button
                type="button"
                onClick={() => onSelectLab(lab)}
                className="flex flex-col items-center gap-2 w-full cursor-pointer"
              >
                <div
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl border transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${color}20`, borderColor: `${color}40` }}
                >
                  <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
                </div>
                <span className="text-xs font-medium text-slate-300 text-center truncate w-full">{lab}</span>
                <span className="text-[10px] text-slate-500">{count} {t.lectures}</span>
              </button>

              <span
                data-testid={`availability-${lab}`}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  running
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : 'bg-green-500/15 border-green-500/40 text-green-300'
                }`}
              >
                {running ? `🔴 مشغول — ${running.endTime}` : '🟢 متاح الآن'}
              </span>
            </div>
          );
        })}
      </div>

      {/* QR Modal */}
      {qrLab && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="qr-modal fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-label={`QR ${qrLab}`}
            onClick={() => setQrLab(null)}
          >
            <div
              className="qr-modal-body bg-white rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-bold text-slate-900 text-center">{qrLab}</p>
              <QRCodeSVG value={qrUrl} size={200} />
              <p className="text-[10px] text-slate-500 break-all text-center" dir="ltr">{qrUrl}</p>
              <div className="flex items-center gap-2 qr-modal-actions">
                <button
                  type="button"
                  onClick={handlePrintQR}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {t.print}
                </button>
                <button
                  type="button"
                  aria-label="close"
                  onClick={() => setQrLab(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 text-slate-800 text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Fault Report Modal */}
      {faultLab && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            onClick={() => setFaultLab(null)}
          >
            <div
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              {submitted ? (
                <>
                  <p className="text-center text-2xl">🙏</p>
                  <p className="text-center text-sm text-green-300 font-medium leading-relaxed">
                    شكراً {form.name} على اهتمامك!<br />
                    تم إرسال بلاغك بنجاح وسيتم مراجعته قريباً.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFaultLab(null)}
                    className="mt-2 w-full py-2 rounded-xl bg-slate-700 text-white text-sm cursor-pointer hover:bg-slate-600"
                  >
                    إغلاق
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white">🔧 أبلغ عن عطل — {faultLab}</h2>
                    <button type="button" onClick={() => setFaultLab(null)} className="text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">الاسم <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-400"
                      placeholder="الاسم الكامل"
                    />
                    {errors.name && <span className="text-[10px] text-red-400">{errors.name}</span>}
                  </div>

                  {/* Student ID */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">رقم الطالب <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={form.studentId}
                      onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-400"
                      placeholder="رقم الطالب"
                    />
                    {errors.studentId && <span className="text-[10px] text-red-400">{errors.studentId}</span>}
                  </div>

                  {/* Fault Type */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">نوع العطل <span className="text-red-400">*</span></label>
                    <select
                      value={form.faultType}
                      onChange={e => setForm(f => ({ ...f, faultType: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-400"
                    >
                      <option value="">اختر نوع العطل</option>
                      {FAULT_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                    </select>
                    {errors.faultType && <span className="text-[10px] text-red-400">{errors.faultType}</span>}
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">وصف العطل (اختياري)</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-400 resize-none"
                      rows={3}
                      placeholder="اكتب وصفاً للعطل..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold cursor-pointer transition-colors"
                  >
                    إرسال البلاغ
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
