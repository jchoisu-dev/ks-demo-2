import { RouterProvider } from "react-router-dom";
import { I18nProvider } from "react-aria-components";
import router from '@/app/config/routes.jsx';
import { getLocale } from '@/app/i18n';
import { useTranslation } from "react-i18next";
const App = () => 
{
    const { i18n } = useTranslation();
    return <I18nProvider locale={getLocale(i18n.resolvedLanguage)}>
        <RouterProvider 
            future={{ v7_startTransition: true }}
            router={router}
        />
    </I18nProvider>
}
export default App;
