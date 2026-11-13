import { useState } from "react";
type DailyChartSeries = { key: "received" | "processed"; label: string; color: string };
type DailyChartProps = {
  days: { date: string; received: number; processed: number }[];
  series: DailyChartSeries[];
  locale: string;
  format: (value: number) => string;
  emptyText: string;
}
const niceMax = (value: number) => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find(factor => factor * magnitude >= value) || 10;
  return step * magnitude;
};
const DailyChart = ({ days, series, locale, format, emptyText }: DailyChartProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...days.flatMap(day => series.map(item => day[item.key]))));
  const hasData = days.some(day => series.some(item => day[item.key] > 0));
  const dayLabel = (date: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  const ticks = [max, max / 2, 0];
  const showLabel = (index: number) => index == 0 || (index + 1) % 5 == 0 || index == days.length - 1;
  return <div>
    <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-600" aria-hidden="true">
      {series.map(item => <span key={item.key} className="inline-flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-sm" style={{ background: item.color }} />
        {item.label}
      </span>)}
    </div>
    {!hasData
      ? <p className="py-10 text-center text-sm text-gray-500">{emptyText}</p>
      : <div className="flex gap-2" aria-hidden="true">
        <div className="flex h-44 flex-col justify-between py-0 text-right text-[10px] tabular-nums text-gray-500">
          {ticks.map(tick => <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{format(tick)}</span>)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-44">
            {[0, 50, 100].map(position => <div key={position} className="absolute inset-x-0 border-t border-gray-100" style={{ top: `${position}%` }} />)}
            <div className="absolute inset-0 flex items-end">
              {days.map((day, index) => <div
                key={day.date}
                className={"relative flex h-full flex-1 items-end justify-center gap-[2px] px-[1px] " + (hover == index ? "bg-gray-50" : "")}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
              >
                {series.map(item => {
                  const value = day[item.key];
                  return <span
                    key={item.key}
                    className="block w-full max-w-3 rounded-t-[4px]"
                    style={{ height: value > 0 ? `max(2px, ${(value / max) * 100}%)` : 0, background: item.color }}
                  />;
                })}
                {hover == index && <div className={"pointer-events-none absolute bottom-full z-10 mb-1 w-max rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md " + (index > days.length * 0.6 ? "right-0" : "left-0")}>
                  <p className="font-medium text-gray-900">{dayLabel(day.date, { weekday: "short", day: "numeric", month: "short" })}</p>
                  {series.map(item => <p key={item.key} className="flex items-center gap-1.5 text-gray-600">
                    <span className="inline-block size-2 rounded-sm" style={{ background: item.color }} />
                    {item.label}: <span className="font-medium tabular-nums text-gray-900">{format(day[item.key])}</span>
                  </p>)}
                </div>}
              </div>)}
            </div>
          </div>
          <div className="mt-1 flex">
            {days.map((day, index) => <span key={day.date} className="flex-1 text-center text-[10px] tabular-nums text-gray-500">{showLabel(index) ? Number(day.date.slice(8)) : ""}</span>)}
          </div>
        </div>
      </div>}
    {hasData && <table className="sr-only">
      <thead><tr><th>Date</th>{series.map(item => <th key={item.key}>{item.label}</th>)}</tr></thead>
      <tbody>{days.filter(day => series.some(item => day[item.key] > 0)).map(day => <tr key={day.date}><td>{day.date}</td>{series.map(item => <td key={item.key}>{format(day[item.key])}</td>)}</tr>)}</tbody>
    </table>}
  </div>;
};
export default DailyChart;
