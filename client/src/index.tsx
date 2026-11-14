import './global.css';
import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Spinner } from '@/shared/components/ui';
import { ReduxProvider, QueryProvider, ToasterProvider } from '@/app/providers';
import ModalGlobal from './shared/components/modal';
import "./app/i18n";
import { startDevtoolsGuard } from "./shared/utils/devtoolsGuard";
// startDevtoolsGuard();
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <ReduxProvider>
        <QueryProvider>
            <Suspense fallback={<Spinner className='fixed inset-0' />}>
                <App />
                <ModalGlobal />
            </Suspense>
            <ToasterProvider />
        </QueryProvider>
    </ReduxProvider>
);