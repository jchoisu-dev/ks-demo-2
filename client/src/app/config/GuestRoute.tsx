import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/app/store";
import { homePath } from "@/features/auth/hooks/usePermissions";
const GuestRoute = () => 
{
    const token = useAppSelector((state) => state.auth.token);
    const role = useAppSelector((state) => state.auth.role);
    if (token) return <Navigate to={homePath(role)} replace />;
    return <Outlet />;
};
export default GuestRoute;
