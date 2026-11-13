import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/app/store';
import { Button } from '@/shared/components/ui';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import SignatureCanvas from "react-signature-canvas";
import toast from 'react-hot-toast';
import { CheckCircle2, PenLine, Eraser, Printer, Download, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocale } from '@/app/i18n';
import { useSignPDF } from '../hooks';
import SendPayslip from './SendPayslip';
const SIGNATURE_HEIGHT = 160;
const isHandheld = () => {
    if (typeof navigator == "undefined") return false;
    const ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
};
const trimmedDataUrl = (canvas, margin = 8) => {
    const { width, height } = canvas;
    const pixels = canvas.getContext("2d").getImageData(0, 0, width, height).data;
    let top = height, left = width, right = -1, bottom = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (pixels[(y * width + x) * 4 + 3] === 0) continue;
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
        }
    }
    if (right < 0) return canvas.toDataURL("image/png");
    left = Math.max(0, left - margin); top = Math.max(0, top - margin);
    right = Math.min(width - 1, right + margin); bottom = Math.min(height - 1, bottom + margin);
    const cropped = document.createElement("canvas");
    cropped.width = right - left + 1;
    cropped.height = bottom - top + 1;
    cropped.getContext("2d").drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
    return cropped.toDataURL("image/png");
};
const EmployeePDF = () => {
    const { canEdit } = usePermissions();
    const { modalProps } = useAppSelector((state) => state.modal);
    const { t, i18n } = useTranslation();
    const locale = getLocale(i18n.resolvedLanguage);
    const { mutate, isPending } = useSignPDF();
    const [pdf, setPdf] = useState(modalProps?.PDF);
    const [isEmpty, setIsEmpty] = useState(true);
    const [width, setWidth] = useState(0);
    const signatureRef = useRef(null);
    const padRef = useRef(null);
    const frameRef = useRef(null);
    const [handheld] = useState(isHandheld);
    useEffect(() => {
        if (!padRef.current) return;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        observer.observe(padRef.current);
        return () => observer.disconnect();
    }, []);
    useEffect(() => () => { if (pdf?.url) window.URL.revokeObjectURL(pdf.url); }, [pdf?.url]);
    const clearSignature = () => {
        signatureRef.current?.clear();
        setIsEmpty(true);
    };
    const saveSignature = () => {
        if (!signatureRef.current || signatureRef.current.isEmpty()) {
            return toast.error(t('payroll.noSignature'));
        }
        const signature = trimmedDataUrl(signatureRef.current.getCanvas());
        mutate(
            { employeeId: pdf.employeeId, beginDay: pdf.beginDay, endDay: pdf.endDay, signature },
            {
                onSuccess: (signed) => {
                    setPdf(signed);
                    clearSignature();
                }
            }
        );
    };
    const fileName = `payslip-${modalProps?.label ? String(modalProps.label).toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" : ""}${pdf?.beginDay || ""}-${pdf?.endDay || ""}.pdf`.replace(/--+/g, "-");
    const downloadPdf = () => {
        const link = document.createElement("a");
        link.href = pdf.url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };
    const openPdf = () => {
        const opened = window.open(pdf.url, "_blank");
        if (!opened) downloadPdf();
    };
    const printPdf = () => {
        const frame = frameRef.current?.contentWindow;
        if (!handheld && frame) {
            try {
                frame.focus();
                frame.print();
                return;
            } catch {
            }
        }
        openPdf();
    };
    if (!pdf?.url) return <p className="p-4 text-sm text-gray-500">{t('payroll.pdfUnavailable')}</p>;
    const signedAt = pdf.signedAt
        ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(pdf.signedAt))
        : null;
    const actions = <div className="flex flex-wrap gap-2">
        <Button onPress={printPdf}>
            <Printer size={16} /> {t('payroll.printPdf')}
        </Button>
        <Button className="bg-white text-black border" onPress={downloadPdf}>
            <Download size={16} /> {t('payroll.downloadPdf')}
        </Button>
    </div>;
    return <div className='flex flex-col lg:flex-row gap-4 p-1 sm:p-2'>
        {handheld
            ? <div className="w-full lg:flex-1 rounded-xl border border-gray-200 bg-gray-50 p-5 flex flex-col items-center gap-3 text-center">
                <span className="grid place-items-center size-12 rounded-2xl bg-[#f6ebe1] text-[#a46023]">
                    <FileText size={24} />
                </span>
                <p className="font-semibold text-gray-900">{t('payroll.pdfReady')}</p>
                <p className="text-sm text-gray-500 max-w-sm">{t('payroll.pdfHandheldHint')}</p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button onPress={openPdf}>
                        <Printer size={16} /> {t('payroll.openPdf')}
                    </Button>
                    <Button className="bg-white text-black border" onPress={downloadPdf}>
                        <Download size={16} /> {t('payroll.downloadPdf')}
                    </Button>
                </div>
            </div>
            : <div className="w-full lg:flex-1 flex flex-col gap-2">
                {actions}
                <iframe
                    ref={frameRef}
                    key={pdf.url}
                    src={`${pdf.url}#toolbar=1&navpanes=0`}
                    title={t('payroll.pdfTitle')}
                    className="w-full h-[65vh] lg:h-[80vh] rounded-xl border border-gray-200 bg-white"
                />
            </div>}

        <aside className="lg:w-96 shrink-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col gap-4 self-start w-full">
            <div className="flex items-start gap-3">
                <span className="grid place-items-center size-9 shrink-0 rounded-xl bg-[#f6ebe1] text-[#a46023]">
                    <PenLine size={18} />
                </span>
                <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900">{t('payroll.signatureTitle')}</h2>
                    <p className="text-xs text-gray-500">{t('payroll.signatureHint')}</p>
                </div>
            </div>

            {signedAt
                ? <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 size={14} /> {t('payroll.signedOn', { date: signedAt })}
                </span>
                : <span className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    {t('payroll.notSigned')}
                </span>}

            {canEdit && <>
            <div ref={padRef} className="relative w-full" style={{ height: SIGNATURE_HEIGHT }}>
                {width > 0 && <SignatureCanvas
                    ref={signatureRef}
                    penColor="#111827"
                    clearOnResize
                    onEnd={() => setIsEmpty(signatureRef.current?.isEmpty() ?? true)}
                    canvasProps={{
                        width,
                        height: SIGNATURE_HEIGHT,
                        "aria-label": t('payroll.signatureTitle'),
                        className: "block rounded-xl border-2 border-dashed border-gray-300 bg-white touch-none"
                    }}
                />}
                {isEmpty && <span className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-gray-500">
                    {t('payroll.signHere')}
                </span>}
                <span className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-gray-300" />
            </div>

            <div className="flex flex-wrap gap-2">
                <Button className="bg-white text-black border" onPress={clearSignature} isDisabled={isPending}>
                    <Eraser size={16} /> {t('payroll.clearSignature')}
                </Button>
                <Button onPress={saveSignature} isPending={isPending} isDisabled={isEmpty}>
                    {isPending ? t('common.loading') + "..." : t('payroll.saveSignature')}
                </Button>
            </div>

            {signedAt && <p className="text-xs text-gray-500">{t('payroll.replaceNote')}</p>}
            <SendPayslip pdf={pdf} />
            </>}
        </aside>
    </div>
}
export default EmployeePDF;
