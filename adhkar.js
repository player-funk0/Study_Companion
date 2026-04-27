const ADHKAR = [
  {
    id: "tasbeeh-100",
    category: "daily",
    title: "التسبيح 100 مرة",
    text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    count: "100 مرة يوميًا",
    time: "اليوم كله",
    grade: "صحيح",
    sanad: "السند المختصر: عبد الله بن مسلمة ← مالك ← سُمَيّ ← أبو صالح ← أبو هريرة رضي الله عنه.",
    source: "صحيح البخاري (6405)، صحيح مسلم (2692).",
    link: "https://sunnah.com/bukhari:6405",
  },
  {
    id: "tahleel-100",
    category: "daily",
    title: "التهليل 100 مرة",
    text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
    count: "100 مرة يوميًا",
    time: "اليوم كله",
    grade: "صحيح",
    sanad: "السند المختصر: عبد الله بن مسلمة ← مالك ← سُمَيّ ← أبو صالح ← أبو هريرة رضي الله عنه.",
    source: "صحيح البخاري (6403).",
    link: "https://sunnah.com/bukhari:6403",
  },
  {
    id: "sayyid-istighfar",
    category: "morning",
    title: "سيد الاستغفار",
    text: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت...",
    count: "مرة صباحًا ومرة مساءً",
    time: "الصباح والمساء",
    grade: "صحيح",
    sanad: "السند المختصر: أبو معمر ← عبد الوارث ← الحسين المعلم ← عبد الله بن بريدة ← بشير بن كعب ← شداد بن أوس رضي الله عنه.",
    source: "صحيح البخاري (6306).",
    link: "https://sunnah.com/bukhari:6306",
  },
  {
    id: "last-two-baqarah",
    category: "sleep",
    title: "آخر آيتين من سورة البقرة",
    text: "قراءة الآيتين (285-286) من سورة البقرة عند النوم.",
    count: "مرة كل ليلة",
    time: "قبل النوم",
    grade: "صحيح",
    sanad: "السند المختصر: أبو نعيم ← سفيان ← منصور ← إبراهيم ← عبد الرحمن بن يزيد ← أبو مسعود رضي الله عنه.",
    source: "صحيح البخاري (5009)، صحيح مسلم (807).",
    link: "https://sunnah.com/bukhari:5009",
  },
  {
    id: "sleep-33-33-34",
    category: "sleep",
    title: "تسبيح النوم",
    text: "سبحان الله (33)، الحمد لله (33)، الله أكبر (34).",
    count: "قبل النوم يوميًا",
    time: "قبل النوم",
    grade: "صحيح",
    sanad: "السند المختصر: علي بن عبد الله ← سفيان ← ابن أبي نجيح ← مجاهد ← ابن أبي ليلى ← علي بن أبي طالب رضي الله عنه.",
    source: "صحيح البخاري (6318).",
    link: "https://sunnah.com/bukhari:6318",
  },
  {
    id: "hawqala",
    category: "daily",
    title: "الحوقلة",
    text: "لا حول ولا قوة إلا بالله.",
    count: "بدون عدد محدد",
    time: "اليوم كله",
    grade: "صحيح",
    sanad: "السند المختصر: سعيد بن عفير ← ابن وهب ← يونس ← ابن شهاب ← سعيد بن المسيب ← أبو هريرة رضي الله عنه.",
    source: "صحيح البخاري (6409).",
    link: "https://sunnah.com/bukhari:6409",
  },
  {
    id: "kalimatan-habibatan",
    category: "daily",
    title: "كلمتان خفيفتان",
    text: "سبحان الله وبحمده، سبحان الله العظيم.",
    count: "بدون عدد محدد",
    time: "اليوم كله",
    grade: "صحيح",
    sanad: "السند المختصر: أحمد بن يونس ← زهير ← أبو الزناد ← الأعرج ← أبو هريرة رضي الله عنه.",
    source: "صحيح البخاري (6406).",
    link: "https://sunnah.com/bukhari:6406",
  },
  {
    id: "asbahna",
    category: "morning",
    title: "ذكر الصباح: أصبحنا وأصبح الملك لله",
    text: "أصبحنا وأصبح الملك لله، والحمد لله...",
    count: "مرة صباحًا",
    time: "الصباح",
    grade: "صحيح",
    sanad: "السند المختصر: عثمان بن أبي شيبة ← جرير ← حسن بن عبيد الله ← إبراهيم بن سويد ← عبد الرحمن بن يزيد ← عبد الله بن مسعود رضي الله عنه.",
    source: "صحيح مسلم (2723b).",
    link: "https://sunnah.com/muslim:2723b",
  },
];

const elements = {
  search: document.getElementById("adhkarSearch"),
  category: document.getElementById("adhkarCategory"),
  list: document.getElementById("adhkarList"),
  empty: document.getElementById("adhkarEmpty"),
};

init();

function init() {
  elements.search.addEventListener("input", render);
  elements.category.addEventListener("change", render);
  render();
}

function render() {
  const term = elements.search.value.trim().toLowerCase();
  const category = elements.category.value;

  const filtered = ADHKAR.filter((item) => {
    const categoryMatch = category === "all" || item.category === category;
    const textMatch =
      term.length === 0 ||
      normalize(item.title).includes(normalize(term)) ||
      normalize(item.text).includes(normalize(term)) ||
      normalize(item.source).includes(normalize(term));
    return categoryMatch && textMatch;
  });

  elements.list.innerHTML = "";

  if (filtered.length === 0) {
    elements.empty.classList.remove("hidden");
    return;
  }

  elements.empty.classList.add("hidden");

  for (const item of filtered) {
    const card = document.createElement("article");
    card.className = "adhkar-card";
    card.innerHTML = `
      <div class="adhkar-card-header">
        <h3>${escapeHtml(item.title)}</h3>
        <span class="adhkar-badge">${escapeHtml(item.grade)}</span>
      </div>
      <p class="adhkar-text">${escapeHtml(item.text)}</p>
      <p class="adhkar-meta"><strong>العدد:</strong> ${escapeHtml(item.count)}</p>
      <p class="adhkar-meta"><strong>الوقت:</strong> ${escapeHtml(item.time)}</p>
      <p class="adhkar-meta"><strong>السند:</strong> ${escapeHtml(item.sanad)}</p>
      <p class="adhkar-meta"><strong>المصدر:</strong> ${escapeHtml(item.source)}</p>
      <a class="adhkar-link" target="_blank" rel="noopener noreferrer" href="${escapeHtml(item.link)}">فتح المصدر</a>
    `;
    elements.list.appendChild(card);
  }
}

function normalize(value) {
  return value
    .toLowerCase()
    .replaceAll("أ", "ا")
    .replaceAll("إ", "ا")
    .replaceAll("آ", "ا")
    .replaceAll("ة", "ه")
    .replaceAll("ى", "ي")
    .replaceAll("ؤ", "و")
    .replaceAll("ئ", "ي");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
