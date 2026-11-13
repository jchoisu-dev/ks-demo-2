import i18n from "@/app/i18n";
export const apiErrorMessage = (error: unknown) => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || i18n.t("common.somethingWentWrong");
};
