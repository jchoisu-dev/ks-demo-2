import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Accordion } from '@heroui/react';
import {
  UserRoundCog, CalendarClock, BriefcaseBusiness, BanknoteArrowUp,
  Cog, PencilRuler, Building2, HandCoins, LogOut,
  ChartPie, Timer, Parasol, Clock, History, UsersRound, Palmtree, Info,
  ArrowLeftRight
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLogout } from "../../features/auth/hooks/useLogOut";
import { usePermissions } from "../../features/auth/hooks/usePermissions";
import { openModal } from "@/app/store";
import { useGetWorkHours } from "../../features/settings/hooks";
import { LanguageSwitcher } from "@/shared/components/ui";
const SideBar = () => {
  const router = useNavigate();
  const { logout } = useLogout();
  const { isAdmin } = usePermissions();
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const { data: workHours } = useGetWorkHours();
  const leaveEnabled = workHours?.leaveEnabled !== false;
  const { t } = useTranslation();
  const { firstName, lastName, role } = useSelector((state) => state.auth);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const menus =
  {
    'navigation.hr': {
      icon: <BriefcaseBusiness />,
      children: [
        {
          name: 'navigation.employees',
          icon: <UserRoundCog />,
          path: 'employee/list'
        },
        {
          name: 'navigation.timesheet',
          icon: <CalendarClock />,
          path: '/attendance/timesheet'
        },
        ...(leaveEnabled ? [{
          name: 'navigation.leave',
          icon: <Palmtree />,
          path: '/attendance/leave'
        }] : []),
        {
          name: 'navigation.payroll',
          icon: <BanknoteArrowUp />,
          path: 'payroll/overview'
        }
      ]
    },
    'navigation.configuration': {
      icon: <Cog />,
      children: [
        {
          name: 'navigation.company',
          icon: <Building2 />,
          path: 'settings/company'
        },
        {
          name: 'navigation.shifts',
          icon: <Timer />,
          path: 'settings/shifts'
        },
        {
          name: 'navigation.workHours',
          icon: <Clock />,
          path: 'settings/work-hours'
        },
        {
          name: 'navigation.holidays',
          icon: <Parasol />,
          path: 'settings/holidays/list'
        },
        {
          name: 'navigation.taxes',
          icon: <HandCoins />,
          path: 'settings/tax'
        },
        {
          name: 'navigation.currencies',
          icon: <ArrowLeftRight />,
          path: 'settings/currencies'
        },
        {
          name: 'navigation.users',
          icon: <UsersRound />,
          path: 'settings/users'
        }
      ]
    }
  }
  if (!isAdmin) delete menus['navigation.configuration'];
  const normalize = (path) => '/' + String(path).replace(/^\/+/, '');
  const activeSection = Object.keys(menus).find(menu => menus[menu].children.some(child => pathname.startsWith(normalize(child.path))));
  const topClass = (path) => "flex gap-2 rounded-lg " + (pathname.startsWith(path) ? "bg-[#f6ebe1] text-[#7a4719] font-medium" : "");
  return <div className="relative h-full flex flex-col">

    <div className="px-3 py-2">
      <Link to="/dashboard" aria-label={t('navigation.dashboard')} className="block w-fit m-auto">
        <img
          src="/logo.svg"
          width={175}
          alt=""
        />
      </Link>
      {fullName && <div className="mt-3 text-center">
        <p className="font-semibold text-gray-900 truncate" title={fullName}>{fullName}</p>
        {role && <p className="text-xs text-gray-500">{t(`roles.${role}`, { defaultValue: role })}</p>}
      </div>}
    </div>

    <Accordion key={activeSection || 'none'} defaultExpandedKeys={activeSection ? [activeSection] : []}>
      <Accordion.Item id="dashboard">
        <Accordion.Heading>
          <Accordion.Trigger
            className={topClass('/dashboard')}
            onClick={() => router('/dashboard')}
          >
            <p><ChartPie /></p>
            <p>{t('navigation.dashboard')}</p>
            <Accordion.Indicator className="text-white" />
          </Accordion.Trigger>
        </Accordion.Heading>
      </Accordion.Item>

      {Object.keys(menus).map(menu => (
        <Accordion.Item key={menu} id={menu}>
          <Accordion.Heading>
            <Accordion.Trigger className="flex gap-2">
              <p>{menus[menu]['icon']}</p>
              <p>{t(menu)}</p>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body className="flex flex-col gap-1">
              {menus[menu]['children'].map((v, k) => (
                <NavLink
                  key={k}
                  to={normalize(v.path)}
                  className={({ isActive }) => "flex gap-2 ml-2 rounded-lg px-2 py-1.5 transition-colors " + (isActive ? "bg-[#f6ebe1] text-[#7a4719] font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900")}
                >
                  <p>{v.icon}</p>
                  <p>{t(v.name)}</p>
                </NavLink>
              ))}
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}

      {isAdmin && <Accordion.Item id="logs">
        <Accordion.Heading>
          <Accordion.Trigger
            className={topClass('/logs')}
            onClick={() => router('/logs')}
          >
            <p><History /></p>
            <p>{t('navigation.logs')}</p>
            <Accordion.Indicator className="text-white" />
          </Accordion.Trigger>
        </Accordion.Heading>
      </Accordion.Item>}
    </Accordion>

    <div className="mt-auto px-2 pt-6 pb-1">

      <div className="border-t border-gray-200 pt-3 flex flex-col gap-1">
        <LanguageSwitcher className="px-2 py-1" />

        <button
          type="button"
          onClick={() => dispatch(openModal({
            title: t('common.about'),
            size: 'sm',
            modalComponent: 'ABOUT_APP',
            hideFooter: true
          }))}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Info size={18} />
          {t('common.about')}
        </button>

        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          {t('common.logout')}
        </button>
      </div>

    </div>

  </div>
};
export default SideBar;