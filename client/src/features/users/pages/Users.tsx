import { useState } from "react";
import { UserPlus, SquarePen, KeyRound, Trash2, Power, Search, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, SearchField, Spinner } from "@/shared/components/ui";
import Table from "@/shared/components/table";
import { getLocale } from "@/app/i18n";
import { openModal, useAppDispatch, useAppSelector } from "@/app/store";
import { useGetUsers, useToggleUser } from "../hooks";
import type { StaffUser } from "../users.types";
const ROLE_STYLES: Record<string, string> = {
  admin: "bg-[#f6ebe1] text-[#7a4719]",
  payroll: "bg-blue-50 text-blue-700",
  manager: "bg-blue-50 text-blue-700",
  viewer: "bg-gray-100 text-gray-700"
};
const Users = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const dispatch = useAppDispatch();
  const myEmail = useAppSelector((state) => state.auth.email);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const { data, isPending } = useGetUsers({ page, q });
  const { mutate: toggle, isPending: isToggling } = useToggleUser();
  const fullName = (user: StaffUser) => [user.firstName, user.lastName].filter(Boolean).join(" ");
  const lastLogin = (value: string | null) => value
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
    : t("users.neverLoggedIn");
  const open = (modalComponent: string, title: string, user?: StaffUser, size: "sm" | "md" = "md") => dispatch(openModal({
    title,
    size,
    modalComponent,
    modalProps: user ? { rowId: user.id, label: fullName(user), user } : {}
  }));
  const runSearch = () => {
    setPage(1);
    setQ(query.trim());
  };
  const columns = [
    { id: "id", name: "ID", hidden: true },
    { id: "name", name: t("users.name") },
    { id: "email", name: t("users.emailColumn") },
    { id: "role", name: t("users.role") },
    { id: "status", name: t("users.status") },
    { id: "lastLoginAt", name: t("users.lastLogin") },
    { id: "userActions", name: t("common.actions") }
  ];
  const iconButton = "grid place-items-center size-8 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";
  const renderCell = (user: StaffUser, columnId: string) => {
    const isMe = user.email == myEmail;
    switch (columnId) {
      case "name":
        return <span className={user.active ? "text-gray-900" : "text-gray-500"}>
          {fullName(user)}
          {isMe && <span className="ml-1.5 text-xs text-gray-500">({t("users.you")})</span>}
        </span>;
      case "role":
        return <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (ROLE_STYLES[user.role] || ROLE_STYLES.viewer)}>{t(`roles.${user.role}`)}</span>;
      case "status":
        return <span className="flex flex-wrap gap-1.5">
          <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (user.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            {user.active ? t("users.active") : t("users.inactive")}
          </span>
          {user.mustChangePassword && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{t("users.mustChange")}</span>}
        </span>;
      case "lastLoginAt":
        return lastLogin(user.lastLoginAt);
      case "userActions":
        return <div className="flex items-center gap-1.5">
          <button type="button" className={iconButton} title={t("users.edit")} aria-label={t("users.edit")} onClick={() => open("USER_FORM", t("users.edit"), user)}>
            <SquarePen size={15} />
          </button>
          <button type="button" className={iconButton} title={t("users.resetPassword")} aria-label={t("users.resetPassword")} onClick={() => open("USER_RESET_PASSWORD", t("users.resetPassword"), user, "sm")}>
            <KeyRound size={15} />
          </button>
          <button
            type="button"
            className={iconButton}
            disabled={isMe || isToggling}
            title={user.active ? t("users.deactivate") : t("users.activate")}
            aria-label={user.active ? t("users.deactivate") : t("users.activate")}
            onClick={() => toggle({ id: user.id, payload: { active: !user.active } })}
          >
            <Power size={15} className={user.active ? "" : "text-green-700"} />
          </button>
          <button
            type="button"
            className={iconButton + " hover:bg-red-50 hover:text-red-600"}
            disabled={isMe}
            title={t("users.delete")}
            aria-label={t("users.delete")}
            onClick={() => open("DELETE_USER", t("users.delete"), user, "sm")}
          >
            <Trash2 size={15} />
          </button>
        </div>;
      default:
        return undefined;
    }
  };
  if (isPending) return <Spinner />;
  return <div>
    <div className="flex items-center gap-2 mb-2">
      <SearchField
        className="flex-1 min-w-0 md:flex-none md:w-72"
        inputClassName="w-full min-w-0"
        aria-label={t("users.searchLabel")}
        placeholder={t("users.searchPlaceholder")}
        value={query}
        onChange={(value: string) => setQuery(value)}
        onSubmit={runSearch}
      />
      <Button aria-label={t("common.search")} onPress={runSearch}>
        <Search className="sm:hidden" size={18} />
        <span className="hidden sm:inline">{t("common.search")}</span>
      </Button>
      <Button
        aria-label={t("common.reset")}
        className="bg-white text-black border"
        onPress={() => {
          setQuery("");
          setQ("");
          setPage(1);
        }}
      >
        <RotateCcw className="sm:hidden" size={18} />
        <span className="hidden sm:inline">{t("common.reset")}</span>
      </Button>
      <div className="md:ml-auto">
        <Button aria-label={t("users.add")} onPress={() => open("USER_FORM", t("users.add"))}>
          <UserPlus className="sm:hidden" size={18} />
          <span className="hidden sm:inline">{t("users.add")}</span>
        </Button>
      </div>
    </div>

    <Table
      columns={columns}
      rows={data?.data || []}
      renderCell={renderCell}
      pagination={{
        page: data?.meta?.page || 1,
        limit: data?.meta?.limit || 10,
        totalRecords: data?.meta?.totalRecords || 0,
        totalPages: data?.meta?.totalPages || 0,
        hasNextPage: data?.meta?.hasNextPage || false,
        hasPreviousPage: data?.meta?.hasPreviousPage || false,
        onPageChange: setPage
      }}
    />
  </div>;
};
export default Users;
