import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/app/store";
import { useSyncProfile } from "@/features/auth/hooks/useProfile";
import ForcedPasswordChange from "@/features/account/components/ForcedPasswordChange";
const ProtectedRoute = () => 
{
    const token = useAppSelector((state) => state.auth.token);
    const mustChangePassword = useAppSelector((state) => state.auth.mustChangePassword);
    useSyncProfile();
    if (!token) return <Navigate to="/login" replace />;
    if (mustChangePassword) return <ForcedPasswordChange />;
    return <Outlet />;
};
export default ProtectedRoute;
