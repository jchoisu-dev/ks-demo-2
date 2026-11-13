import { useState } from "react";
import { Button, SearchField, Spinner } from "@/shared/components/ui";
import Table from '@/shared/components/table';
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { openModal } from "@/app/store";
import { useGetShifts } from '../hooks';
import { useAppDispatch } from "@/app/store";
const List = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchObject, setsearchObject] = useState({ name: "" });
  const [search, setSearch] = useState(searchObject);
  const { isPending, data } = useGetShifts({ page, search });
  const columns = [
    { id: 'id', name: 'ID', hidden: true },
    { id: "name", name: t("shift.columnName") },
    { id: "begin", name: t("shift.begin") },
    { id: "end", name: t("shift.end") },
    { id: "type", name: t("shift.type") },
    { id: "break", name: t("shift.break") },
    { id: "createdAt", name: t("common.created") },
    { id: "actions", name: t("common.actions") }
  ];
  if (isPending) return <Spinner />;
  type SearchFieldKey = keyof typeof searchFields;
  const searchFields = {
    'name': t('shift.columnName')
  };
  return <>
    <div className='flex items-center gap-2 mb-2'>
      {(Object.keys(searchFields) as SearchFieldKey[]).map((field) => (
        <SearchField
          key={field}
          className="flex-1 min-w-0 md:flex-none md:w-64"
          inputClassName="w-full min-w-0"
          aria-label={`shift-search-${field}`}
          placeholder={searchFields[field] + '...'}
          value={searchObject[field] || ""}
          onChange={(e: string) => {
            setsearchObject((prev) => ({
              ...prev,
              [field]: e
            }));
          }}
        />
      ))}

      <Button
        onPress={() => {
          setPage(1);
          setSearch(searchObject);
        }}
      >
        {t('common.search')}
      </Button>

      <Button
        className="bg-white text-black border"
        onPress={() => {
          setPage(1);
          setSearch({ name: "" });
          setsearchObject({ name: ""});
        }}
      >
        {t('common.reset')}
      </Button>

      <div className="md:ml-auto">
        <Button
          aria-label={t('shift.addButton')}
          onPress={() => dispatch(
            openModal({
              title: t('shift.add'),
              size: 'md',
              modalComponent: "CREATE_OR_EDIT_SHIFT_FORM",
              modalProps: {}
            })
          )}
        >
          <Clock className="sm:hidden" size={18} />
          <span className="hidden sm:inline">{t('shift.addButton')}</span>
        </Button>
      </div>
    </div>

    <Table
      columns={columns}
      rows={data?.data || []}
      renderCell={(row: { type?: string }, columnId: string) => columnId == "type"
        ? <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (row.type == "overtime" ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-700")}>{t(`shift.types.${row.type == "overtime" ? "overtime" : "work"}`)}</span>
        : undefined}
      onModalEdit={{
        title: t('shift.edit'),
        modalComponent: "CREATE_OR_EDIT_SHIFT_FORM",
        size: 'sm'
      }}
      onModalDelete={{
        title: t('shift.deleteTitle'),
        modalComponent: "DELETE_SHIFT",
        size:'sm'
      }}
      pagination={{
        page: data?.meta?.page || 1,
        limit: data?.meta?.limit || 15,
        totalRecords: data?.meta?.totalRecords || 0,
        totalPages: data?.meta?.totalPages || 0,
        hasNextPage: data?.meta?.hasNextPage || false,
        hasPreviousPage: data?.meta?.hasPreviousPage || false,
        onPageChange: setPage
      }}
    />

  </>
}
export default List;