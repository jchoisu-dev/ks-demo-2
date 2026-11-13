import { useTranslation } from "react-i18next";
type LoaderProps = {
  className?: string;
  size?: "sm" | "md";
}
const CustomSpinner = ({ className = "", size = "md" }: LoaderProps) => {
  const { t } = useTranslation();
  const isSmall = size == "sm";
  return <div
    role="status"
    aria-live="polite"
    className={"flex flex-col items-center justify-center gap-4 " + (isSmall ? "py-8 " : "min-h-[calc(100dvh-11rem)] lg:min-h-[calc(100dvh-2rem)] ") + className}
  >
    <img
      src="/logo.svg"
      alt=""
      aria-hidden="true"
      className={(isSmall ? "w-14 " : "w-24 sm:w-28 ") + "select-none motion-safe:animate-[loader-breathe_2.4s_ease-in-out_infinite]"}
      draggable={false}
    />
    <div aria-hidden="true" className={(isSmall ? "w-16 " : "w-28 ") + "h-1 overflow-hidden rounded-full bg-[#f1e4d7]"}>
      <div className="h-full w-1/3 rounded-full bg-[#a46023] motion-safe:animate-[loader-bar_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:opacity-60" />
    </div>
    <span className="sr-only">{t("common.loading")}...</span>
  </div>
}
export default CustomSpinner;
