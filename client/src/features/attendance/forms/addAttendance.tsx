import { lazy } from 'react';
import { Tabs } from '@heroui/react';
import { tabs } from '../constants';
import { useTranslation } from 'react-i18next';
const Standard = lazy(() => import('../components/Standard'));
const Manual = lazy(() => import('../components/Manual'));
const Other = lazy(() => import('../components/Other'));
const EmployeeAttendance = lazy(() => import('../components/EmployeeAttendance'));
const ShiftCreateOrUpdate = () => {
  type TabsType = keyof typeof tabs;
  const { t } = useTranslation();
  const tabComponents = {
    'standard': <Standard />,
    'manual': <Manual />,
    'other': <Other />
  };
  return <Tabs variant="secondary">

    <EmployeeAttendance />

    <Tabs.ListContainer>
      <Tabs.List aria-label="Options">
        {(Object.keys(tabs) as TabsType[]).map(tab => (
          <Tabs.Tab id={tab} key={tab}>
            {t(`attendance.tabs.${tab}`)}
            <Tabs.Indicator />
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.ListContainer>
    {(Object.keys(tabs) as TabsType[]).map(tab => (
      <Tabs.Panel key={tab} id={tab}>
        {tabComponents[tab]}
      </Tabs.Panel>
    ))}
  </Tabs>
}
export default ShiftCreateOrUpdate;