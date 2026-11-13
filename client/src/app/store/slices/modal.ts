import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ModalState } from "../types";
const initialState: ModalState = {
  isOpen: false,
  title: "",
  size: "lg",
  modalComponent: null,
  modalProps: {},
  isFormPending: false,
  hideFooter: false
};
const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{
        title: string;
        size?: ModalState["size"];
        isOpen?: Boolean;
        modalComponent: string | null;
        modalProps?: Record<string, any>;
        hideFooter?: boolean;
      }>
    ) => {
      state.isOpen = true;
      state.title = action.payload.title;
      state.size = action.payload.size;
      state.modalComponent = action.payload.modalComponent;
      state.modalProps = action.payload.modalProps || {};
      state.isFormPending = false;
      state.hideFooter = action.payload.hideFooter;
    },

    closeModal: (state) => {
      state.isOpen = false;
      state.title = "";
      state.modalComponent = null;
      state.modalProps = {};
      state.isFormPending = false;
      state.hideFooter = false;
    },

    setModalPending: (state, action) => {
      state.isFormPending = action.payload;
    }
  }
});
export const { openModal, closeModal, setModalPending } = modalSlice.actions;
export default modalSlice.reducer;