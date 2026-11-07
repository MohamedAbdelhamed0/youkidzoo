import { Menu, ChevronDown } from "lucide-react";
import { useLanguage } from "../../../core/i18n/i18n";
import { ErrorText } from "../../../shared/components/ErrorText";
import type { Category } from "../domain/Category";
import { categoryDepth } from "../domain/tree";
interface Props {
  categories: Category[];
  error: string;
  open: boolean;
  onToggle(): void;
  onSelect(id: string): void;
}
export function CategorySidebar({
  categories,
  error,
  open,
  onToggle,
  onSelect,
}: Props) {
  const { ar, t } = useLanguage();
  return (
    <aside className={open ? "categories open" : "categories"}>
      <button className="category-title" onClick={onToggle}>
        <Menu size={16} />
        {t("Browse All Categories", "تصفح جميع الفئات")}
        <ChevronDown size={13} />
      </button>
      <div className="category-list">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            style={{
              paddingInlineStart: 8 + categoryDepth(category, categories) * 10,
            }}
          >
            <span className="category-emoji">
              {category.iconUrl.startsWith("https://") ? (
                <img src={category.iconUrl} alt="" />
              ) : (
                category.iconUrl
              )}
            </span>
            <span>{category.name[ar ? "ar" : "en"]}</span>
            <span className="category-arrow">→</span>
          </button>
        ))}
        {error && (
          <small role="alert">
            <ErrorText message={error} />
          </small>
        )}
      </div>
    </aside>
  );
}
