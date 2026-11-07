import { useLanguage } from "../../core/i18n/i18n";
import { localizeError } from "../../core/i18n/errors";
export function ErrorText({ message }: { message: string }) {
  const { ar } = useLanguage();
  return <>{localizeError(message, ar)}</>;
}
