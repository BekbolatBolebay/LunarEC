export type Language = 'kk' | 'ru';

export const translations = {
  kk: {
    // Apps
    app_crm: 'CRM & Сату',
    app_inventory: 'Қойма & Қалдықтар',
    app_bom: 'Техкарталар & BOM',
    app_purchase: 'Сатып алу & PO',
    app_hr: 'Кадрлар & Табель',
    app_pos: 'Зал & Үстелдер',
    app_loyalty: 'Адалдық & Маркетинг',
    app_analytics: 'Қаржы & Аналитика',
    app_odoo_sync: 'Odoo Синхронизация',

    // Global
    search_placeholder: 'Іздеу немесе сүзгілеу...',
    filters: 'Сүзгілер',
    group_by: 'Топтастыру',
    favorites: 'Таңдаулылар',
    create_new: 'Жаңа құру',
    import_data: 'Импорт',
    export_data: 'Экспорт',
    save: 'Сақтау',
    cancel: 'Болдырмау',
    delete: 'Жою',
    edit: 'Түзету',
    status: 'Мәртебесі',
    actions: 'Әрекеттер',
    total: 'Барлығы',
    loading: 'Жүктелуде...',

    // Chatter
    send_message: 'Хабарлама жіберу',
    log_note: 'Ескертпе жазу',
    schedule_activity: 'Әрекетті жоспарлау',
    activities: 'жоспарланған әрекеттер',
    no_activities: 'Әзірге әрекеттер жоқ',
  },
  ru: {
    // Apps
    app_crm: 'CRM и Продажи',
    app_inventory: 'Склад и Запасы',
    app_bom: 'Техкарты и BOM',
    app_purchase: 'Закупки и Поставщики',
    app_hr: 'Сотрудники и Табель',
    app_pos: 'Залы и Столы',
    app_loyalty: 'Лояльность и Маркетинг',
    app_analytics: 'Финансы и Аналитика',
    app_odoo_sync: 'Синхронизация Odoo',

    // Global
    search_placeholder: 'Поиск или фильтр...',
    filters: 'Фильтры',
    group_by: 'Группировка',
    favorites: 'Избранное',
    create_new: 'Создать',
    import_data: 'Импорт',
    export_data: 'Экспорт',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    status: 'Статус',
    actions: 'Действия',
    total: 'Всего',
    loading: 'Загрузка...',

    // Chatter
    send_message: 'Отправить сообщение',
    log_note: 'Заметка',
    schedule_activity: 'Запланировать действие',
    activities: 'запланированные действия',
    no_activities: 'Пока нет активности',
  },
};

export function t(key: string, lang: Language = 'kk'): string {
  const dict = translations[lang] || translations.kk;
  return (dict as any)[key] || key;
}
