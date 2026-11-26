import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../core/i18n/i18n";
import { useDialogAccessibility } from "./useDialogAccessibility";

export function StoreDialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  useDialogAccessibility(true, close);
  return (
    <div
      className="store-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className="store-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-dialog-title"
        tabIndex={-1}
      >
        <div className="store-dialog-heading">
          <h2 id="store-dialog-title">{title}</h2>
          <button
            type="button"
            className="store-icon"
            onClick={close}
            aria-label={t("Close", "إغلاق")}
          >
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
