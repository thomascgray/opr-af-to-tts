import { useTranslation } from "react-i18next";

export const Maintenance = () => {
  const { t } = useTranslation();
  return (
    <div className="my-10">
      <h1 className="text-center text-2xl font-bold">
        {t("maintenance.heading")}
      </h1>
      <p className="text-center text-lg mt-4">{t("maintenance.body")}</p>
    </div>
  );
};
