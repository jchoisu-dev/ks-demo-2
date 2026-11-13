const ACCESS_TOKEN_KEY = 'hr-demo-jwt';
export const getToken = async() => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setToken = async(token: string) => {
  return localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export const removeToken = async() => {
  return localStorage.removeItem(ACCESS_TOKEN_KEY);
}