import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/authSlice';
import { loginUser } from '../services';
import { homePath } from './usePermissions';
import { useAppDispatch } from "@/app/store";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
export const useLogin = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: loginUser,
    onMutate:(d) => { },
    onSuccess: async(data) => {
      const { firstName, lastName, email, role, profileImage, active, mustChangePassword, token } = data;
      dispatch(
        setCredentials({
          firstName, lastName, email, role, profileImage, active, mustChangePassword, token
        })
      );
      toast.success(i18n.t('auth.loginSuccess'));
      navigate(homePath(role));
    },

    onError: (error) => {
      // @ts-ignore
      toast.error(error?.response?.data?.message);
    }
  });
};