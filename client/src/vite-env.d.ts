/// <reference types="vite/client" />
interface ViteTypeOptions {
}

interface ImportMetaEnv {
  readonly PUBLIC_BACKEND_URL: string;
  readonly VITE_PUBLIC_APP_NAME?: string;
  readonly VITE_PUBLIC_APP_VERSION?: string;
  readonly VITE_PUBLIC_RELEASED_APP_DATE?: string;
  readonly VITE_PUBLIC_UPDATED_APP_DATE?: string;
  readonly VITE_PUBLIC_DEVTOOLS_GUARD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
