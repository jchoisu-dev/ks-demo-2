import axios from '@/shared/api/axios';
import type { LoginPayload, LoginResponse, Profile, ChangePasswordPayload } from '../auth.types';
export const login = async (payload: LoginPayload): Promise<LoginResponse> => 
{
  const response = await axios.post('auth/login', payload);
  return response.data;
};
export const getProfile = async (): Promise<Profile> => {
  const response = await axios.get('auth/me');
  return response.data;
};
export const changePassword = async (payload: ChangePasswordPayload): Promise<Profile> => {
  const response = await axios.put('auth/password', payload);
  return response.data;
};
