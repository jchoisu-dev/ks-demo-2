import type { ReactNode } from 'react';
import { PaginationMeta } from '@/shared/api/types';
export type Column = {
  id: string;
  name: string;
  hidden?: boolean | undefined;
};
interface onModalActionProps {
  rowId?: string;
  title: string;
  size?: "xs" | "sm" | "md" | "lg" | "cover" | "full";
  modalComponent: string;
}
export type onModalEditProps = onModalActionProps;
export type onModalDeleteProps = onModalActionProps;
export type onActionClickProps = onModalActionProps & {
  modalProps: any;
};
export type TableProps<T extends { id?: string }> = {
  columns: Column[];
  rows: T[];
  onModalEdit?: onModalEditProps;
  onModalDelete?: onModalDeleteProps;
  onPrint?: ({ employeeId }: { employeeId: string }) => any;
  onGift?: ({ employeeId }: { employeeId: string }) => void;
  onDeduct?: ({ employeeId }: { employeeId: string }) => void;
  renderCell?: (row: T, columnId: string) => ReactNode | undefined;
  pagination: PaginationMeta;
};