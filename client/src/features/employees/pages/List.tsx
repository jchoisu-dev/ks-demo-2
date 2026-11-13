import { useState } from "react";
import { Button, SearchField, Spinner } from "@/shared/components/ui";
import Table from '@/shared/components/table';
import { openModal } from "@/app/store";
import { useGetEmployees } from '../hooks';
import { useAppDispatch } from "@/app/store";
import { UserPlus, Search, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateLabel } from "@/app/i18n";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
const List = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { canEdit } = usePermissions();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState({ q: "" });
  const runSearch = () => {
    setPage(1);
    setSearch({ q: query.trim() });
  };
  const { isPending, data } = useGetEmployees({ page, search });
  const columns = [
    { id: 'id', name: 'ID', hidden: true },
    { id: "lastName", name: t("employee.lastName") },
    { id: "firstName", name: t("employee.firstName") },
    { id: "phone", name: t("employee.phone") },
    { id: "hiredAt", name: t("employee.dateOfHire") },
    { id: 'type', name: t('employee.type') },
    { id: 'pay_type', name: t('employee.pay') },
    { id: 'currency', name: t('employee.currency') },
    { id: 'amount', name: t('employee.amount') },
    { id: "createdAt", name: t("common.created") },
    { id: "actions", name: t("common.actions"), hidden: !canEdit }
  ];
  if (isPending) return <Spinner />;
  return <div>
    <div className='flex items-center gap-2 mb-2'>
      <SearchField
        className="flex-1 min-w-0 md:flex-none md:w-72"
        inputClassName="w-full min-w-0"
        aria-label={t('employee.searchLabel')}
        placeholder={t('employee.searchPlaceholder')}
        value={query}
        onChange={(value: string) => setQuery(value)}
        onSubmit={runSearch}
      />

      <Button aria-label={t('common.search')} onPress={runSearch}>
        <Search className="sm:hidden" size={18} />
        <span className="hidden sm:inline">{t('common.search')}</span>
      </Button>

      <Button
        aria-label={t('common.reset')}
        className="bg-white text-black border"
        onPress={() => {
          setPage(1);
          setSearch({ q: "" });
          setQuery("");
        }}
      >
        <RotateCcw className="sm:hidden" size={18} />
        <span className="hidden sm:inline">{t('common.reset')}</span>
      </Button>

      {canEdit && <div className="md:ml-auto">
        <Button
          aria-label={t('employee.add')}
          onPress={() => dispatch(
            openModal({
              title: t('employee.add'),
              size: 'cover',
              modalComponent: "CREATE_OR_EDIT_EMPLOYEE",
              modalProps: {}
            })
          )}
        >
          <UserPlus className="sm:hidden" size={18} />
          <span className="hidden sm:inline">{t('employee.add')}</span>
        </Button>
      </div>}
    </div>

    <Table
      columns={columns}
      rows={(data?.data || []).map(row => ({
        ...row,
        type: translateLabel('employeeTypes', row.type),
        pay_type: translateLabel('payTypes', row.pay_type)
      }))}
      onModalEdit={{
        title: t('employee.edit'),
        modalComponent: "CREATE_OR_EDIT_EMPLOYEE",
        size: 'cover'
      }}
      onModalDelete={{
        title: t('employee.deleteTitle'),
        modalComponent: "DELETE_EMPLOYEE",
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

  </div>
}
export default List;