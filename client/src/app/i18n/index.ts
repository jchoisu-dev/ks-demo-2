import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/zh-cn";
import "dayjs/locale/es";
import { z } from "zod";
import zodEn from "zod/v4/locales/en.js";
import zodZhCN from "zod/v4/locales/zh-CN.js";
import zodEs from "zod/v4/locales/es.js";
import en from "./locales/en.json";
import cn from "./locales/cn.json";
import es from "./locales/es.json";
dayjs.extend(localizedFormat);
export const LANGUAGES = [
  { code: "en", label: "English", locale: "en-US", dayjs: "en", zod: zodEn },
  { code: "cn", label: "中文", locale: "zh-CN", dayjs: "zh-cn", zod: zodZhCN },
] as const;
export type LanguageCode = typeof LANGUAGES[number]["code"];
const getLanguage = (code?: string) => LANGUAGES.find(language => language.code == code) || LANGUAGES[0];
export const getLocale = (code?: string) => getLanguage(code).locale;
export const formatMonth = (month: string, code?: string) =>
  new Intl.DateTimeFormat(getLocale(code), { year: "numeric", month: "long" }).format(new Date(`${month}-01T12:00:00`));
export const tr = (key: string) => () => i18n.t(key);
export const translateLabel = (group: "employeeTypes" | "payTypes" | "holidayTypes", value?: string) => {
  if (!value) return value;
  const labels: Record<string, string> = en[group];
  const key = Object.keys(labels).find(k => k.toLowerCase() == value.toLowerCase() || labels[k].toLowerCase() == value.toLowerCase());
  return key ? i18n.t(`${group}.${key}`) : value;
};
const applyLanguage = (code?: string) => {
  const language = getLanguage(code);
  dayjs.locale(language.dayjs);
  z.config(language.zod());
  document.documentElement.lang = language.locale;
};
i18n.on("languageChanged", applyLanguage);
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      cn: {
        translation: cn
      },
      es: {
        translation: es
      }
    },

    supportedLngs: LANGUAGES.map(language => language.code),
    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage"],
      caches: ["localStorage"]
    }
  });
export default i18n;
