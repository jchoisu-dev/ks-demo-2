import { Mail, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import { useGetEmployee } from "@/features/employees/hooks/useEmployee";
import { useDeliveryOptions, useEmailPayslip } from "../hooks";
import type { PayslipPDF } from "../payroll.types";
const COUNTRY_CODE = "597";
const whatsappNumber = (phone?: string) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length == 7) digits = COUNTRY_CODE + digits;
  return digits.length >= 8 ? digits : "";
};
const SendPayslip = ({ pdf }: { pdf: PayslipPDF }) => {
  const { t } = useTranslation();
  const { data: employee } = useGetEmployee(pdf.employeeId);
  const { data: delivery } = useDeliveryOptions();
  const { mutate: email, isPending } = useEmailPayslip();
  const profile = (employee as any)?.data ?? employee;
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const number = whatsappNumber(profile?.phone);
  const period = pdf.beginDay && pdf.endDay ? `${pdf.beginDay} – ${pdf.endDay}` : t("payroll.currentMonth");
  const fileName = `payslip_${(name || "employee").replace(/\s+/g, "_")}_${pdf.beginDay || "month"}.pdf`;
  const shareWhatsApp = async () => {
    const message = t("payroll.whatsappMessage", { name: profile?.firstName || name, period });
    const blob = await fetch(pdf.url).then(response => response.blob());
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: message, title: fileName });
        return;
      } catch (error) {
        if ((error as DOMException)?.name == "AbortError") return;
      }
    }
    const link = document.createElement("a");
    link.href = pdf.url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    toast(t("payroll.whatsappAttach"), { icon: "📎", duration: 6000 });
  };
  return <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
    <p className="text-sm font-medium text-gray-900">{t("payroll.sendTitle")}</p>
    <div className="flex flex-wrap gap-2">
      <Button
        className="bg-white text-black border"
        isDisabled={!delivery?.email || !profile?.email || isPending}
        isPending={isPending}
        onPress={() => email({ employeeId: pdf.employeeId, beginDay: pdf.beginDay, endDay: pdf.endDay })}
      >
        <Mail size={16} /> {isPending ? t("payroll.sending") : t("payroll.sendEmail")}
      </Button>
      <Button className="bg-white text-black border" isDisabled={!number} onPress={shareWhatsApp}>
        <MessageCircle size={16} className="text-green-600" /> {t("payroll.sendWhatsApp")}
      </Button>
    </div>
    <p className="text-xs text-gray-500">
      {!delivery?.email ? t("payroll.emailNotConfigured") : !profile?.email ? t("payroll.noEmail") : t("payroll.emailTo", { to: profile.email })}
      {!number && <> · {t("payroll.noPhone")}</>}
    </p>
  </div>;
};
export default SendPayslip;
