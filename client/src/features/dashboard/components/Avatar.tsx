const Avatar = ({ name }: { name: string }) => {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return <span aria-hidden="true" className="grid place-items-center size-9 shrink-0 rounded-full bg-[#f6ebe1] text-[#7a4719] text-xs font-semibold">
    {initials || "?"}
  </span>
}
export default Avatar;
