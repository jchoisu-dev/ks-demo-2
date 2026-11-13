import { useState } from "react";
import { Button, SearchField, Spinner } from "@/shared/components/ui";
import Table from '@/shared/components/table';
import { CalendarPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateLabel } from "@/app/i18n";
import { useGetHolidays } from '../hooks';
import { openModal, useAppDispatch } from "@/app/store";
const List = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchObject, setsearchObject] = useState({ name: "" });
  const [search, setSearch] = useState(searchObject);
  const { isPending, data } = useGetHolidays({ page, search });
  const columns = [
    { id: 'id', name: 'ID', hidden: true },
    { id: "name", name: t("holiday.columnName") },
    { id: "date", name: t("holiday.date") },
    { id: "type", name: t("holiday.type") },
    { id: "rate", name: t("holiday.rate") },
    { id: "createdAt", name: t("common.created") },
    { id: "actions", name: t("common.actions") }
  ];
  if (isPending) return <Spinner />;
  type SearchFieldKey = keyof typeof searchFields;
  const searchFields = {
    'name': t('holiday.columnName')
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
          aria-label={t('holiday.addButton')}
          onPress={() => dispatch(
            openModal({
              title: t('holiday.add'),
              size: 'md',
              modalComponent: "CREATE_OR_EDIT_HOLIDAY_FORM",
              modalProps: {}
            })
          )}
        >
          <CalendarPlus className="sm:hidden" size={18} />
          <span className="hidden sm:inline">{t('holiday.addButton')}</span>
        </Button>
      </div>
    </div>

    <Table
      columns={columns}
      rows={(data?.data || []).map(row => ({
        ...row,
        type: translateLabel('holidayTypes', row.type)
      }))}
      onModalEdit={{
        title: t('holiday.edit'),
        modalComponent: "CREATE_OR_EDIT_HOLIDAY_FORM",
        size: 'sm'
      }}
      onModalDelete={{
        title: t('holiday.deleteTitle'),
        modalComponent: "DELETE_HOLIDAY",
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