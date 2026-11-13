import { EmptyState, Pagination, Table, Button } from "@heroui/react";
import { SquarePen, Trash2, Printer, HandCoins } from 'lucide-react';
import { useAppDispatch } from "@/app/store";
import { useTranslation } from "react-i18next";
import { openModal } from "@/app/store/slices/modal";
import type { onActionClickProps, TableProps } from "./types";
const SharedTable = <T extends { id: string }>({ columns, rows, onModalEdit, onModalDelete, onPrint, onGift, renderCell, pagination }: TableProps<T>) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { page, limit, totalPages, totalRecords, hasNextPage, hasPreviousPage, onPageChange } = pagination;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalRecords);
    const startEndExists = totalRecords ? true : false;
    const visibleColumns = columns.filter(c => !c.hidden);
    const onActionClickConfig = [
        {
            config: onModalEdit,
            icon: SquarePen,
            variant: "tertiary" as const
        },
        {
            config: onModalDelete,
            icon: Trash2,
            variant: "danger-soft" as const
        }
    ];
    const onActionClick = (onActionClick: onActionClickProps) => {
        dispatch(openModal({ ...onActionClick }));
    };
    return <Table variant="secondary">
        <Table.ScrollContainer>
            <Table.Content aria-label="Shared Table">
                <Table.Header columns={visibleColumns}>
                    {column => {
                        return <Table.Column isRowHeader className="whitespace-nowrap">
                            {column.name}
                        </Table.Column>
                    }}
                </Table.Header>
                <Table.Body
                    items={rows}
                    renderEmptyState={() => (
                        <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                            <span className="text-sm text-muted mt-2">
                                {t('common.noResults')}
                            </span>
                        </EmptyState>
                    )}
                >
                    {(row) => (
                        <Table.Row>
                            <Table.Collection items={visibleColumns}>
                                {column => {
                                    const custom = renderCell?.(row, column.id);
                                    if (custom !== undefined) {
                                        return <Table.Cell className="whitespace-nowrap">{custom}</Table.Cell>
                                    }
                                    if (column.id === "actions") {
                                        return <Table.Cell className="whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {onActionClickConfig.map(({ config: { title, size, modalComponent }, icon: Icon, variant }: any) => (
                                                    <Button
                                                        key={modalComponent}
                                                        isIconOnly
                                                        size="sm"
                                                        variant={variant}
                                                        onPress={() => onActionClick({
                                                            title,
                                                            size,
                                                            modalComponent,
                                                            modalProps: { rowId: row.id }
                                                        })
                                                        }
                                                    >
                                                        <Icon className="size-4" />
                                                    </Button>
                                                ))}
                                            </div>
                                        </Table.Cell>
                                    }
                                    if (column.id == 'print') {
                                        return <Table.Cell key='print' className="whitespace-nowrap">
                                            <Printer
                                                className="cursor-pointer"
                                                size={32}
                                                onClick={async() => {
                                                    const PDF = await onPrint?.({ employeeId: row.id });
                                                    dispatch(
                                                        openModal({
                                                            title: t('payroll.pdfTitle'),
                                                            size: 'cover',
                                                            modalComponent: "EMPLOYEE_PAYROLL_PDF",
                                                            modalProps: { PDF, label: (row as { employee?: string }).employee },
                                                            hideFooter: true
                                                        })
                                                    )
                                                }}
                                            />
                                        </Table.Cell>
                                    }
                                    if (column.id == 'adjust') {
                                        return <Table.Cell key='adjust' className="whitespace-nowrap">
                                            <HandCoins
                                                className="cursor-pointer"
                                                size={32}
                                                onClick={()=>onGift?.({ employeeId: row?.id })}
                                            />
                                        </Table.Cell>
                                    }
                                    return <Table.Cell className="whitespace-nowrap">
                                        {String((row as Record<string, unknown>)[column.id] || "-")}
                                    </Table.Cell>
                                }}
                            </Table.Collection>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer>
            <Pagination size="sm">
                <Pagination.Summary>
                    {startEndExists && t('common.paginationSummary', { start, end, total: totalRecords })}
                </Pagination.Summary>
                <Pagination.Content className="flex-wrap">
                    <Pagination.Item>
                        {hasPreviousPage && <Pagination.Previous
                            isDisabled={!hasPreviousPage}
                            onPress={() => onPageChange(Math.max(1, page - 1))}
                        >
                            <Pagination.PreviousIcon />
                            {t('common.prev')}
                        </Pagination.Previous>}
                    </Pagination.Item>
                    {pages.map((p) => (
                        <Pagination.Item key={p}>
                            <Pagination.Link
                                isActive={p === page}
                                onPress={() => onPageChange(p)}
                            >
                                {p}
                            </Pagination.Link>
                        </Pagination.Item>
                    ))}
                    {hasNextPage && <Pagination.Item>
                        <Pagination.Next
                            isDisabled={!hasNextPage}
                            onPress={() => { onPageChange(page + 1) }}
                        >
                            {t('common.next')}
                            <Pagination.NextIcon />
                        </Pagination.Next>
                    </Pagination.Item>}
                </Pagination.Content>
            </Pagination>
        </Table.Footer>
    </Table>
}
export default SharedTable;