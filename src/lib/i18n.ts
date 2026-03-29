export type Lang = "ru" | "en";

const translations: Record<Lang, Record<string, string>> = {
  ru: {
    // Nav
    "nav.feed": "Лента",
    "nav.search": "Поиск",
    "nav.lost": "Пропажи",
    "nav.profile": "Профиль",
    "nav.favorites": "Избранное",
    "nav.messages": "Сообщения",
    // Auth
    "auth.login": "Войти",
    "auth.register": "Регистрация",
    "auth.logout": "Выйти",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.name": "Имя",
    "auth.phone": "Телефон",
    "auth.role": "Тип аккаунта",
    "auth.role.user": "Частное лицо",
    "auth.role.shelter": "Приют / организация",
    "auth.forgot": "Забыли пароль?",
    "auth.reset": "Сбросить пароль",
    "auth.no_account": "Нет аккаунта?",
    "auth.has_account": "Уже есть аккаунт?",
    "auth.send_link": "Отправить ссылку",
    // Animals
    "animal.lost": "Потерялся",
    "animal.found": "Найден",
    "animal.adopt": "Отдам в добрые руки",
    "animal.dog": "Собака",
    "animal.cat": "Кошка",
    "animal.rabbit": "Кролик",
    "animal.bird": "Птица",
    "animal.other": "Другое",
    "animal.male": "Мальчик",
    "animal.female": "Девочка",
    "animal.unknown": "Неизвестно",
    "animal.small": "Маленький",
    "animal.medium": "Средний",
    "animal.large": "Большой",
    "animal.xlarge": "Очень большой",
    "animal.vaccinated": "Привит",
    "animal.sterilized": "Стерилизован",
    "animal.chipped": "Чипирован",
    "animal.passport": "Есть паспорт",
    "animal.status.active": "Активно",
    "animal.status.adopted": "Пристроен",
    "animal.status.found": "Нашёлся",
    "animal.status.closed": "Закрыто",
    "animal.status.pending": "На проверке",
    // Filters
    "filter.all": "Все",
    "filter.sort.date_desc": "Сначала новые",
    "filter.sort.date_asc": "Сначала старые",
    "filter.sort.distance": "По близости",
    // Actions
    "action.contact": "Связаться",
    "action.add_favorite": "В избранное",
    "action.remove_favorite": "Убрать из избранного",
    "action.write": "Написать",
    "action.save": "Сохранить",
    "action.cancel": "Отмена",
    "action.create": "Создать объявление",
    "action.edit": "Редактировать",
    "action.approve": "Одобрить",
    "action.reject": "Отклонить",
    // Profile
    "profile.my_posts": "Мои объявления",
    "profile.settings": "Настройки",
    "profile.shelter_profile": "Профиль приюта",
    "profile.admin_panel": "Панель администратора",
    // Misc
    "misc.loading": "Загрузка...",
    "misc.no_results": "Ничего не найдено",
    "misc.error": "Произошла ошибка",
    "misc.verified": "Проверенный приют",
    "misc.views": "просмотров",
    "misc.age_months": "мес.",
    "misc.age_years": "лет",
  },
  en: {
    "nav.feed": "Feed",
    "nav.search": "Search",
    "nav.lost": "Lost",
    "nav.profile": "Profile",
    "nav.favorites": "Favorites",
    "nav.messages": "Messages",
    "auth.login": "Sign in",
    "auth.register": "Register",
    "auth.logout": "Sign out",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Name",
    "auth.phone": "Phone",
    "auth.role": "Account type",
    "auth.role.user": "Individual",
    "auth.role.shelter": "Shelter / organization",
    "auth.forgot": "Forgot password?",
    "auth.reset": "Reset password",
    "auth.no_account": "No account?",
    "auth.has_account": "Have an account?",
    "auth.send_link": "Send link",
    "animal.lost": "Lost",
    "animal.found": "Found",
    "animal.adopt": "For adoption",
    "animal.dog": "Dog",
    "animal.cat": "Cat",
    "animal.rabbit": "Rabbit",
    "animal.bird": "Bird",
    "animal.other": "Other",
    "animal.male": "Male",
    "animal.female": "Female",
    "animal.unknown": "Unknown",
    "animal.small": "Small",
    "animal.medium": "Medium",
    "animal.large": "Large",
    "animal.xlarge": "Extra large",
    "animal.vaccinated": "Vaccinated",
    "animal.sterilized": "Sterilized",
    "animal.chipped": "Chipped",
    "animal.passport": "Has passport",
    "animal.status.active": "Active",
    "animal.status.adopted": "Adopted",
    "animal.status.found": "Found",
    "animal.status.closed": "Closed",
    "animal.status.pending": "Pending review",
    "filter.all": "All",
    "filter.sort.date_desc": "Newest first",
    "filter.sort.date_asc": "Oldest first",
    "filter.sort.distance": "By distance",
    "action.contact": "Contact",
    "action.add_favorite": "Save",
    "action.remove_favorite": "Unsave",
    "action.write": "Message",
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.create": "Post ad",
    "action.edit": "Edit",
    "action.approve": "Approve",
    "action.reject": "Reject",
    "profile.my_posts": "My ads",
    "profile.settings": "Settings",
    "profile.shelter_profile": "Shelter profile",
    "profile.admin_panel": "Admin panel",
    "misc.loading": "Loading...",
    "misc.no_results": "No results",
    "misc.error": "An error occurred",
    "misc.verified": "Verified shelter",
    "misc.views": "views",
    "misc.age_months": "mo.",
    "misc.age_years": "yr.",
  },
};

let currentLang: Lang = (localStorage.getItem("lang") as Lang) || "ru";

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: string): string {
  return translations[currentLang]?.[key] ?? translations.ru[key] ?? key;
}

export function formatAge(months: number | null | undefined, lang: Lang = currentLang): string {
  if (!months) return "";
  if (months < 12) return `${months} ${lang === "ru" ? "мес." : "mo."}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ${lang === "ru" ? "лет" : "yr."}`;
  return `${years} ${lang === "ru" ? "лет" : "yr."} ${rem} ${lang === "ru" ? "мес." : "mo."}`;
}
