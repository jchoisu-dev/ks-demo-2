import { getToken, setToken, removeToken } from './token.service';
import { login, getProfile, changePassword } from "../api/login";
import type { LoginPayload, LoginResponse, ChangePasswordPayload } from "../auth.types";
const loginUser = async({email, password}: LoginPayload): Promise<LoginResponse> => {
    const loginUser = await login({email, password});
    return loginUser;
};
const fetchProfile = async () => {
    const profile = await getProfile();
    return profile;
};
const updatePassword = async (payload: ChangePasswordPayload) => {
    const profile = await changePassword(payload);
    return profile;
};
export {
    getToken, setToken, removeToken, 
    loginUser,
    fetchProfile,
    updatePassword
}