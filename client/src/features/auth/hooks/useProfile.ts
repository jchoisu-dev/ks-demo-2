import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { useAppDispatch, useAppSelector, updateProfile } from "@/app/store";
import { apiErrorMessage } from '@/shared/utils/apiError';
import { fetchProfile, updatePassword } from "../services";
export const useSyncProfile = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const query = useQuery({
    queryKey: ["profile", token],
    queryFn: fetchProfile,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000
  });
  useEffect(() => {
    if (query.data) dispatch(updateProfile(query.data));
  }, [query.data, dispatch]);
  return query;
};
export const useChangePassword = () => {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: updatePassword,

    onSuccess: (profile) => {
      dispatch(updateProfile(profile));
      toast.success(i18n.t('account.passwordChanged'));
    },

    onError: (error) => {
      toast.error(apiErrorMessage(error));
    }
  });
};
