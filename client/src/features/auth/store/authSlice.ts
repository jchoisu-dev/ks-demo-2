import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Profile } from "../auth.types";
const initialState: User = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  profileImage: "",
  active: undefined,
  mustChangePassword: false,
  token: ""
};
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<User>
    ) => {
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.profileImage = action.payload.profileImage;
      state.active = action.payload.active;
      state.mustChangePassword = Boolean(action.payload.mustChangePassword);
      state.token = action.payload.token;
    },

    updateProfile: (
      state,
      action: PayloadAction<Profile>
    ) => {
      const { firstName, lastName, email, role, profileImage, active, mustChangePassword } = action.payload;
      Object.assign(state, { firstName, lastName, email, role, profileImage, active, mustChangePassword: Boolean(mustChangePassword) });
    },
    
    clearCredentials: (state) => {
      state.firstName = "";
      state.lastName = "";
      state.email = "";
      state.role = "";
      state.profileImage = "";
      state.active = undefined;
      state.mustChangePassword = false;
      state.token = "";
    }
  }
});
export const { setCredentials, clearCredentials, updateProfile } = authSlice.actions;
export default authSlice.reducer;