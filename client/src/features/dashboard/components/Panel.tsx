import type { ReactNode } from "react";
type PanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}
const Panel = ({ title, subtitle, action, className = "", children }: PanelProps) => {
  return <div className={"rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm min-w-0 " + className}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
}
export default Panel;
