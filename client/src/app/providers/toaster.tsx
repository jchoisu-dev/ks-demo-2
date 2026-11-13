import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
const ToasterProvider = ({ children }: { children?: ReactNode }) => {
    return <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={2}
        containerClassName=""
        containerStyle={{}}
        toasterId="default"
        toastOptions={{
            className: '',
            duration: 1000,
            removeDelay: 1000,
            style: {
                background: '#363636',
                color: '#fff',
                fontSize: '12px'
            },
            success: {
                duration: 1000,
                iconTheme: {
                    primary: 'green',
                    secondary: 'black'
                }
            }
        }}
    />
}
export default ToasterProvider;