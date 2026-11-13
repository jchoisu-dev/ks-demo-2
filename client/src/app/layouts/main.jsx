import { lazy, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { LanguageSwitcher } from '@/shared/components/ui';
const SideBar = lazy(() => import('./sidebar'));
const Main = () =>
{
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { pathname } = useLocation();
    const { t } = useTranslation();
    useEffect(() => setIsDrawerOpen(false), [pathname]);
    const isModalOpen = useSelector((state) => state.modal.isOpen);
    useEffect(() => { if (isModalOpen) setIsDrawerOpen(false); }, [isModalOpen]);
    return <div className="lg:h-dvh bg-white">

        <div className="lg:hidden sticky top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-gray-200 bg-white/95 px-2 py-1.5 backdrop-blur">
            <button
                type="button"
                aria-label={t('common.openMenu')}
                className="p-2 cursor-pointer justify-self-start"
                onClick={() => setIsDrawerOpen(true)}
            >
                <Menu />
            </button>
            <Link to="/dashboard" aria-label={t('navigation.dashboard')}>
                <img
                    src="/logo.svg"
                    width={110}
                    alt=""
                />
            </Link>
            <LanguageSwitcher className="justify-self-end [&>svg]:hidden min-[360px]:[&>svg]:block" />
        </div>

        {isDrawerOpen && <div className="lg:hidden fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white p-2 overflow-y-auto border-r border-gray-200 shadow-xl">
                <button
                    type="button"
                    aria-label={t('common.closeMenu')}
                    className="absolute right-2 top-2 z-10 p-2 cursor-pointer"
                    onClick={() => setIsDrawerOpen(false)}
                >
                    <X />
                </button>
                <SideBar />
            </div>
        </div>}

        <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:h-full">
            <aside className="hidden lg:block lg:overflow-y-auto border-r border-gray-200 bg-white p-2">
                <SideBar />
            </aside>
            <main className="relative min-w-0 lg:overflow-auto bg-white p-3 lg:p-5">
                <Outlet />
            </main>
        </div>
    </div>
}
export default Main;
