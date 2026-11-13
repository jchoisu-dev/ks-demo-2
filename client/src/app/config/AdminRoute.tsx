import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
const AdminRoute = () => 
{
    const { role, isAdmin } = usePermissions();
    if (role && !isAdmin) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
};
export default AdminRoute;
