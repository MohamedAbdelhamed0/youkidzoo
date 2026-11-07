import { Link } from "react-router-dom";
import { useLanguage } from "../../core/i18n/i18n";
export function JournalPage() {
  const { t } = useLanguage();
  return (
    <article className="journal-page">
      <span className="eyebrow">
        {t("LITTLE IDEAS, BIG ADVENTURES", "أفكار صغيرة، مغامرات كبيرة")}
      </span>
      <h1>{t("Make room for imagination", "مساحة للخيال")}</h1>
      <p>
        {t(
          "The best adventures often begin at home. A blanket becomes a castle, a cardboard box becomes a spaceship, and a simple story opens a whole new world.",
          "أجمل المغامرات تبدأ أحيانًا في المنزل. تصبح البطانية قلعة، والصندوق مركبة فضاء، وتفتح قصة بسيطة عالمًا جديدًا.",
        )}
      </p>
      <h2>{t("Build something together", "ابنوا شيئًا معًا")}</h2>
      <p>
        {t(
          "Let your child choose what to build, then follow their lead. Ask open questions and give them time to experiment.",
          "دع طفلك يختار ما يريد بناءه، ثم شاركه أفكاره. اسأل أسئلة مفتوحة وامنحه الوقت للتجربة.",
        )}
      </p>
      <h2>
        {t("Turn the everyday into a story", "حوّلوا اليوم العادي إلى قصة")}
      </h2>
      <p>
        {t(
          "Choose a favorite toy and imagine its next journey. Take turns adding a sentence and see where the adventure leads.",
          "اختاروا لعبة مفضلة وتخيلوا رحلتها القادمة. تناوبوا على إضافة جملة واكتشفوا إلى أين تقودكم المغامرة.",
        )}
      </p>
      <Link className="pink-button" to="/shop">
        {t("Explore learning & play", "اكتشف التعلم واللعب")}
      </Link>
    </article>
  );
}
