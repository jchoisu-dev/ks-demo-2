import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { persistor } from "@/app/store";
import toast from 'react-hot-toast';
import i18n from '@/app/i18n';
import { useAppDispatch, clearCredentials } from "@/app/store";
export const useLogout = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const logout = async () => {
        queryClient.clear();
        dispatch(clearCredentials());
        toast.success(i18n.t('auth.logoutSuccess'));
        persistor.purge();
        navigate('/login');
    };
    return {
        logout
    };
};