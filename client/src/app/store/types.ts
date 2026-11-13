export type ModalState = {
  isOpen: boolean;
  title: string;
  size?: "xs" | "sm" | "md" | "lg" | "cover" | "full";
  modalComponent: string | null;
  modalProps?: Record<string, any>;
  isFormPending: boolean;
  hideFooter?: boolean;
};