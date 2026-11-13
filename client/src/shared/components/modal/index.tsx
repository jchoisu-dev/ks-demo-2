import { Suspense } from "react";
import { Modal } from "@heroui/react";
import { Button, Spinner } from '@/shared/components/ui';
import { useAppSelector, useAppDispatch } from "@/app/store";
import { closeModal } from "@/app/store/slices/modal";
import { modalRegistry } from "./registry";
import { useTranslation } from "react-i18next";
const SharedModal = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { modalComponent, modalProps, isOpen, title, size, isFormPending, hideFooter } = useAppSelector((state) => state.modal);
    if (!modalComponent) return <></>;
    const Component = modalRegistry[modalComponent];
    if (!Component) return <></>;
    const ModalFooter = () => {
        if(hideFooter) return <></>;
        return <Modal.Footer>
            <Button
                className='bg-white text-black border'
                onPress={() => dispatch(closeModal())}
            >
                {t("common.cancel")}
            </Button>
            <Button
                isPending={isFormPending}
                form={modalComponent}
                type="submit"
            >
                {isFormPending ? t("common.loading") + "..." : t("common.save")}
            </Button>
        </Modal.Footer>
    }
    return <Modal.Backdrop
        isOpen={isOpen}
        className="pointer-events-none"
    >
        <Modal.Container size={size} placement="center">
            <Modal.Dialog className="bg-white">
                <Modal.CloseTrigger onPress={() => dispatch(closeModal())} />
                <Modal.Header>
                    <Modal.Heading>{title}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                    <Suspense fallback={<Spinner size="sm" />}>
                        <Component {...modalProps} />
                    </Suspense>
                </Modal.Body>
                <ModalFooter />
            </Modal.Dialog>
        </Modal.Container>
    </Modal.Backdrop>
}
export default SharedModal;