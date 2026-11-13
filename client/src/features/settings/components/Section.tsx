import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
type SectionProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  className?: string;
  children: ReactNode;
}
const Section = ({ title, description, icon: Icon, className = "", children }: SectionProps) => (
  <section className={"rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm min-w-0 " + className}>
    <div className="flex items-start gap-3 mb-5">
      <span className="grid place-items-center size-9 shrink-0 rounded-xl bg-[#f6ebe1] text-[#a46023]">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
    <div className="flex flex-col gap-4">
      {children}
    </div>
  </section>
);
export default Section;
