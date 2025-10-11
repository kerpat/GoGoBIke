# 🚀 Быстрый старт: shadcn/ui в GoGoBike

## ✅ Что готово?

Ваша админ-панель **GoGoBike** теперь использует **shadcn/ui** дизайн-систему!

### 📦 Созданные файлы:

```
site/
├── shadcn-adapter.css           # Базовые компоненты shadcn/ui
├── shadcn-utils.js              # JavaScript утилиты
├── admin-shadcn.css             # Стили для админки
├── admin-shadcn-components.js   # Улучшения админки
└── shadcn-demo.html             # Демо всех компонентов
```

---

## 🎯 Как использовать?

### 1️⃣ **Откройте админку**

Просто откройте `site/admin.html` - все стили уже применены автоматически! ✨

### 2️⃣ **Посмотрите демо**

Откройте `site/shadcn-demo.html` чтобы увидеть все доступные компоненты.

### 3️⃣ **Используйте в коде**

Все компоненты доступны глобально:

```javascript
// Toast уведомления
window.adminShadcn.showSuccessToast('Сохранено!');
window.adminShadcn.showErrorToast('Ошибка!');

// Confirm dialog
const ok = await window.adminShadcn.showConfirmDialog({
  title: 'Удалить?',
  description: 'Это действие нельзя отменить'
});

// Loading состояния
window.adminShadcn.showTableSkeleton(tableBody, 5, 6);
```

---

## 🎨 Примеры изменений

### ❌ Было (старый alert):
```javascript
alert('Данные сохранены');
```

### ✅ Стало (красивый toast):
```javascript
window.adminShadcn.showSuccessToast('Данные сохранены');
```

---

### ❌ Было (стандартный confirm):
```javascript
if (confirm('Удалить велосипед?')) {
  deleteBike(id);
}
```

### ✅ Стало (красивый dialog):
```javascript
const confirmed = await window.adminShadcn.showConfirmDialog({
  title: 'Удалить велосипед?',
  description: 'Это действие нельзя отменить'
});

if (confirmed) {
  deleteBike(id);
}
```

---

## 🔥 Ключевые возможности

### Готовые кнопки:
```html
<button class="admin-btn admin-btn-primary">Сохранить</button>
<button class="admin-btn admin-btn-outline">Отмена</button>
<button class="admin-btn admin-btn-danger">Удалить</button>
```

### Статус бейджи:
```html
<span class="status-badge success">Активен</span>
<span class="status-badge warning">Ожидание</span>
<span class="status-badge danger">Ошибка</span>
```

### Карточки:
```html
<div class="card-shadcn">
  <div class="card-header">
    <h3 class="card-title">Заголовок</h3>
  </div>
  <div class="card-content">Контент</div>
</div>
```

---

## 📱 Адаптивность

Дизайн автоматически адаптируется:
- 🖥️ **Desktop** - полная версия с боковой навигацией
- 📱 **Tablet** - горизонтальная навигация
- 📱 **Mobile** - компактная версия

---

## 🎨 Цветовая схема

Все цвета GoGoBike сохранены:
- 🟢 **Основной зелёный**: `#29e29a`
- 🟢 **Тёмно-зелёный**: `#083830`
- 🟢 **Акцент**: `#26b999`

---

## 📚 Документация

- **Полное руководство**: `ADMIN-SHADCN-GUIDE.md`
- **Демо компонентов**: `site/shadcn-demo.html`
- **Официальная документация shadcn/ui**: https://ui.shadcn.com/

---

## 🎉 Что дальше?

1. ✅ Откройте админку и посмотрите результат
2. ✅ Изучите `shadcn-demo.html` с примерами
3. ✅ Начните использовать компоненты в своём коде
4. ✅ Читайте `ADMIN-SHADCN-GUIDE.md` для деталей

---

## 💡 Совет

Все компоненты **автоматически** применяются к админке при загрузке страницы. Вам не нужно ничего настраивать дополнительно!

**Просто откройте админку и наслаждайтесь новым дизайном! 🚀**

