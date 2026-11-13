import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import modalReducer, { openModal, closeModal, setModalPending } from "./slices/modal";
import authReducer, { setCredentials, clearCredentials, updateProfile } from "@/features/auth/store/authSlice";
const persistConfig = {
  key: "auth",
  storage
};
const rootReducer = combineReducers({
  auth: persistReducer(persistConfig, authReducer),
  modal: modalReducer
});
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER
        ]
      }
    })
});
export const persistor = persistStore(store);
type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export {
  openModal, closeModal, setModalPending,
  setCredentials, clearCredentials, updateProfile
};