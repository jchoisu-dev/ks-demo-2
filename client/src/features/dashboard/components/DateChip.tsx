const DateChip = ({ date, locale }: { date: string; locale: string }) => {
  const value = new Date(`${date}T12:00:00`);
  return <span aria-hidden="true" className="flex flex-col items-center justify-center w-11 h-12 shrink-0 rounded-xl border border-gray-200 bg-white">
    <span className="text-[10px] font-medium uppercase text-[#a46023] leading-none">
      {new Intl.DateTimeFormat(locale, { month: "short" }).format(value)}
    </span>
    <span className="mt-1 text-base font-semibold text-gray-900 leading-none">{value.getDate()}</span>
  </span>
}
export default DateChip;
