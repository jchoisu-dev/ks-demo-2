import { useTranslation } from "react-i18next";
const dateValue = (raw?: string) => raw?.includes(":") ? raw.slice(raw.indexOf(":") + 1).trim() : raw;
const AboutModal = () => {
  const { t } = useTranslation();
  const env = import.meta.env;
  const appName = env.VITE_PUBLIC_APP_NAME;
  const appVersion = env.VITE_PUBLIC_APP_VERSION?.replace(/^version\s*/i, "").replace(/^(\d)/, "v$1");
  const rows = [
    { label: t("common.version"), value: appVersion },
    { label: t("common.released"), value: dateValue(env.VITE_PUBLIC_RELEASED_APP_DATE) },
    { label: t("common.updated"), value: dateValue(env.VITE_PUBLIC_UPDATED_APP_DATE) }
  ].filter(({ value }) => value);
  return <div className="flex flex-col items-center gap-4 pb-2">
    <img src="/logo.svg" width={120} alt="" />
    {appName && <p className="text-center font-semibold text-gray-900">{appName}</p>}
    {rows.length > 0 && <dl className="w-full divide-y divide-gray-100 rounded-xl border border-gray-200">
      {rows.map(({ label, value }) => <div key={label} className="flex justify-between gap-3 px-3 py-2 text-sm">
        <dt className="text-gray-500">{label}</dt>
        <dd className="text-gray-900 tabular-nums">{value}</dd>
      </div>)}
    </dl>}
  </div>;
};
export default AboutModal;
