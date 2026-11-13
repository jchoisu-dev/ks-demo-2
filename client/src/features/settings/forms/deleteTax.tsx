import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Spinner } from '@/shared/components/ui';
import { useAppSelector } from '@/app/store';
import { useDeleteTaxVersion } from '../hooks';
const TaxVersionDelete = () => {
  const { modalProps } = useAppSelector((state) => state.modal);
  const taxId = modalProps?.rowId;
  const { mutate, isPending } = useDeleteTaxVersion();
  const { handleSubmit } = useForm();
  const { t } = useTranslation();
  if (isPending) return <Spinner size="sm" />;
  return <div>
    <form
      id="DELETE_TAX_VERSION"
      onSubmit={handleSubmit(() => mutate(taxId))}
      noValidate
    >
      {t('tax.deleteConfirm', { date: modalProps?.label })}
    </form>
  </div>
}
export default TaxVersionDelete;
