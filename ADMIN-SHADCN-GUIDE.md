# 🎨 Руководство по shadcn/ui в Админ-панели GoGoBike

## Что было сделано?

Админ-панель теперь использует современный дизайн-систему **shadcn/ui**, адаптированную под **Vanilla JavaScript** (без React!).

### 📦 Установленные файлы:

1. **`site/shadcn-adapter.css`** - CSS переменные и компоненты shadcn/ui
2. **`site/shadcn-utils.js`** - JavaScript утилиты для создания компонентов
3. **`site/admin-shadcn.css`** - Специальные стили для админ-панели
4. **`site/admin-shadcn-components.js`** - Улучшения компонентов админки

---

## 🎯 Основные возможности

### 1. Автоматические улучшения

После загрузки страницы **автоматически**:
- ✅ Все кнопки получают стиль shadcn/ui
- ✅ Таблицы становятся красивее
- ✅ Статус-бейджи получают правильные цвета
- ✅ Добавляются плавные анимации

### 2. Готовые компоненты

#### 🔘 Кнопки

```javascript
// Используйте готовые классы в HTML:
<button class="admin-btn admin-btn-primary">Сохранить</button>
<button class="admin-btn admin-btn-secondary">Отмена</button>
<button class="admin-btn admin-btn-outline">Подробнее</button>
<button class="admin-btn admin-btn-danger">Удалить</button>

// Или создавайте через JS:
const btn = window.shadcnUtils.createButton({
  text: 'Добавить велосипед',
  variant: 'primary',
  size: 'lg',
  onClick: () => console.log('Clicked!')
});
document.body.appendChild(btn);
```

**Варианты кнопок:**
- `admin-btn-primary` - основная зелёная кнопка
- `admin-btn-secondary` - серая кнопка
- `admin-btn-outline` - кнопка с обводкой
- `admin-btn-danger` - красная кнопка для удаления
- `admin-btn-sm` - маленькая кнопка
- `admin-btn-lg` - большая кнопка

#### 📊 Карточки статистики

```javascript
const statCard = window.adminShadcn.createDashboardStatCard({
  label: 'Всего велосипедов',
  value: '42',
  icon: '🚲',
  variant: 'success', // success | warning | danger | info
  onClick: () => {
    console.log('Card clicked!');
  }
});

document.getElementById('dashboard-stats').appendChild(statCard);
```

#### 🏷️ Статус бейджи

```html
<!-- В HTML -->
<span class="status-badge success">Доступен</span>
<span class="status-badge warning">На обслуживании</span>
<span class="status-badge danger">Недоступен</span>
<span class="status-badge info">В аренде</span>
<span class="status-badge neutral">Неизвестно</span>
```

```javascript
// Или через JS
const badge = window.shadcnUtils.createBadge({
  text: 'Активен',
  variant: 'success'
});
```

#### 🔔 Toast уведомления

```javascript
// Успех
window.adminShadcn.showSuccessToast('Данные успешно сохранены');

// Ошибка
window.adminShadcn.showErrorToast('Не удалось загрузить данные');

// Информация
window.adminShadcn.showInfoToast('Обработка может занять некоторое время');

// Кастомный toast
window.shadcnUtils.showToast({
  title: 'Внимание!',
  description: 'Велосипед был обновлён',
  variant: 'success',
  duration: 5000 // миллисекунды
});
```

#### ❓ Диалоги подтверждения

```javascript
// Вместо стандартного confirm():
const confirmed = await window.adminShadcn.showConfirmDialog({
  title: 'Удалить велосипед?',
  description: 'Это действие нельзя отменить. Велосипед будет удалён из базы данных.',
  confirmText: 'Удалить',
  cancelText: 'Отмена'
});

if (confirmed) {
  // Удаляем велосипед
  console.log('Deleted!');
}
```

#### 📋 Таблицы

```html
<!-- Таблицы автоматически стилизуются -->
<div class="admin-table-container">
  <table class="admin-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Название</th>
        <th>Статус</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>001</td>
        <td>Велосипед #1</td>
        <td><span class="status-badge success">Доступен</span></td>
        <td>
          <div class="table-actions">
            <button class="admin-btn admin-btn-outline admin-btn-sm">Изменить</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm">Удалить</button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

#### ⏳ Loading состояния

```javascript
// Показать skeleton loader в таблице
const tableBody = document.querySelector('#bikes-table tbody');
window.adminShadcn.showTableSkeleton(tableBody, 5, 6); // 5 строк, 6 колонок

// Показать loading в любом контейнере
const container = document.getElementById('stats-container');
window.adminShadcn.showLoadingState(container, 'Загружаем статистику...');
```

#### 📭 Empty State

```javascript
const emptyState = window.adminShadcn.createEmptyState({
  icon: '🚲',
  title: 'Нет велосипедов',
  description: 'Добавьте первый велосипед для начала работы',
  actionText: 'Добавить велосипед',
  onAction: () => {
    // Открыть модальное окно
  }
});

document.getElementById('bikes-list').appendChild(emptyState);
```

#### 🔢 Анимированные счётчики

```javascript
const valueElement = document.getElementById('total-bikes');
// Анимация от 0 до 42 за 1 секунду
window.adminShadcn.animateNumber(valueElement, 0, 42, 1000);
```

#### 💧 Ripple эффект

```javascript
// Добавить ripple эффект на любую кнопку
const button = document.getElementById('my-button');
window.adminShadcn.addRippleEffect(button);
```

---

## 🎨 Цветовая палитра

### Основные цвета (CSS переменные):

```css
/* Используйте в своих стилях */
var(--admin-primary)          /* Зелёный #29e29a */
var(--admin-success)          /* Успех (зелёный) */
var(--admin-warning)          /* Предупреждение (жёлтый) */
var(--admin-danger)           /* Ошибка (красный) */
var(--admin-info)             /* Информация (синий) */

var(--admin-bg)               /* Фон страницы */
var(--admin-surface)          /* Фон карточек */
var(--admin-border)           /* Цвет границ */
var(--admin-text)             /* Основной текст */
var(--admin-text-secondary)   /* Вторичный текст */
```

---

## 🔧 Утилитарные классы

### Flexbox:
```html
<div class="flex items-center justify-between gap-4">
  <span>Текст</span>
  <button>Кнопка</button>
</div>
```

### Отступы:
```html
<div class="p-4">Padding 1rem</div>
<div class="px-6 py-4">Padding X: 1.5rem, Y: 1rem</div>
<div class="m-4">Margin 1rem</div>
<div class="mx-auto">Центрирование</div>
```

### Текст:
```html
<h1 class="text-2xl font-bold text-center">Заголовок</h1>
<p class="text-sm text-muted">Описание</p>
```

### Скругления:
```html
<div class="rounded">Скруглённый</div>
<div class="rounded-lg">Больше скругления</div>
<div class="rounded-full">Полностью круглый</div>
```

### Тени:
```html
<div class="shadow">Лёгкая тень</div>
<div class="shadow-md">Средняя тень</div>
<div class="shadow-lg">Большая тень</div>
```

---

## 📱 Адаптивность

Админка автоматически адаптируется под:
- 🖥️ Десктоп (>1024px) - боковая навигация
- 📱 Планшет (768-1024px) - горизонтальная навигация
- 📱 Мобильные (<768px) - упрощённый вид

---

## 💡 Примеры использования в admin.js

### Пример 1: Обработка успешного сохранения

```javascript
// Было:
alert('Велосипед сохранён');

// Стало:
window.adminShadcn.showSuccessToast('Велосипед успешно сохранён');
bikeModal.classList.add('hidden');
```

### Пример 2: Подтверждение удаления

```javascript
// Было:
if (confirm('Удалить велосипед?')) {
  deleteBike(id);
}

// Стало:
const confirmed = await window.adminShadcn.showConfirmDialog({
  title: 'Удалить велосипед?',
  description: 'Это действие нельзя отменить.',
  confirmText: 'Удалить'
});

if (confirmed) {
  deleteBike(id);
  window.adminShadcn.showSuccessToast('Велосипед удалён');
}
```

### Пример 3: Загрузка данных

```javascript
async function loadBikes() {
  const tableBody = document.querySelector('#bikes-table tbody');
  
  // Показываем skeleton loader
  window.adminShadcn.showTableSkeleton(tableBody);
  
  try {
    const bikes = await fetchBikes();
    
    if (bikes.length === 0) {
      // Показываем empty state
      const emptyState = window.adminShadcn.createEmptyState({
        icon: '🚲',
        title: 'Нет велосипедов',
        description: 'Добавьте первый велосипед',
        actionText: 'Добавить',
        onAction: openAddBikeModal
      });
      tableBody.innerHTML = '';
      tableBody.appendChild(emptyState);
    } else {
      // Рендерим данные
      renderBikes(bikes);
    }
  } catch (error) {
    window.adminShadcn.showErrorToast('Не удалось загрузить велосипеды');
  }
}
```

---

## 🚀 Быстрый старт

### 1. Файлы уже подключены в `admin.html`:
```html
<link rel="stylesheet" href="shadcn-adapter.css">
<link rel="stylesheet" href="admin-shadcn.css">
<script src="shadcn-utils.js" type="module" defer></script>
<script src="admin-shadcn-components.js" type="module" defer></script>
```

### 2. Все компоненты доступны через:
- `window.shadcnUtils.*` - базовые утилиты
- `window.adminShadcn.*` - специфичные для админки

### 3. Автоматическая инициализация:
При загрузке страницы все компоненты автоматически улучшаются!

---

## 📚 Полезные ссылки

- [shadcn/ui документация](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Примеры компонентов](https://ui.shadcn.com/docs/components)

---

## ❓ FAQ

**Q: Как добавить новый цвет?**  
A: Добавьте CSS переменную в `:root` в файле `admin-shadcn.css`

**Q: Можно ли использовать shadcn/ui в основном приложении (не админке)?**  
A: Да! Используйте `shadcn-adapter.css` и `shadcn-utils.js` в любом HTML файле.

**Q: Как отключить автоматические улучшения?**  
A: Удалите импорт `admin-shadcn-components.js` из `admin.html`

---

## 🎉 Результат

Теперь ваша админка имеет:
- ✅ Современный дизайн в стиле shadcn/ui
- ✅ Плавные анимации и переходы
- ✅ Красивые уведомления (toast)
- ✅ Улучшенный UX
- ✅ Адаптивный дизайн
- ✅ Тёмная тема (опционально)
- ✅ Всё на Vanilla JavaScript!

**Приятной работы! 🚀**

