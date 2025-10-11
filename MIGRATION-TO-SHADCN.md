# 🔄 Миграция на shadcn/ui - План действий

## 📋 Чек-лист миграции

Вот что нужно обновить в вашем `admin.js` для полного использования shadcn/ui:

---

## 1. Замена alert() на toast уведомления

### ❌ Найдите в коде:
```javascript
alert('Сохранено');
alert('Ошибка');
```

### ✅ Замените на:
```javascript
window.adminShadcn.showSuccessToast('Сохранено');
window.adminShadcn.showErrorToast('Ошибка');
```

### 🔍 Где искать:
- Функции сохранения данных
- Обработчики успешных операций
- Обработчики ошибок

---

## 2. Замена confirm() на showConfirmDialog()

### ❌ Найдите:
```javascript
if (confirm('Удалить?')) {
  // действие
}
```

### ✅ Замените на:
```javascript
const confirmed = await window.adminShadcn.showConfirmDialog({
  title: 'Удалить запись?',
  description: 'Это действие нельзя отменить',
  confirmText: 'Удалить',
  cancelText: 'Отмена'
});

if (confirmed) {
  // действие
}
```

⚠️ **Важно**: Функцию нужно сделать `async`:
```javascript
// Было:
function deleteItem() {
  if (confirm('...')) {}
}

// Стало:
async function deleteItem() {
  const confirmed = await window.adminShadcn.showConfirmDialog({...});
}
```

---

## 3. Добавление loading состояний

### ❌ Было:
```javascript
async function loadData() {
  const data = await fetchData();
  renderData(data);
}
```

### ✅ Стало:
```javascript
async function loadData() {
  const container = document.getElementById('data-container');
  
  // Показываем loading
  window.adminShadcn.showLoadingState(container, 'Загрузка данных...');
  
  try {
    const data = await fetchData();
    renderData(data);
  } catch (error) {
    window.adminShadcn.showErrorToast('Не удалось загрузить данные');
  }
}
```

### Для таблиц:
```javascript
const tableBody = document.querySelector('#table tbody');
window.adminShadcn.showTableSkeleton(tableBody, 5, 6);
```

---

## 4. Добавление Empty States

### ❌ Было:
```javascript
if (bikes.length === 0) {
  tableBody.innerHTML = '<tr><td colspan="5">Нет данных</td></tr>';
}
```

### ✅ Стало:
```javascript
if (bikes.length === 0) {
  const emptyState = window.adminShadcn.createEmptyState({
    icon: '🚲',
    title: 'Нет велосипедов',
    description: 'Добавьте первый велосипед для начала работы',
    actionText: 'Добавить велосипед',
    onAction: openAddBikeModal
  });
  
  tableBody.innerHTML = '';
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = 5;
  td.appendChild(emptyState);
  tr.appendChild(td);
  tableBody.appendChild(tr);
}
```

---

## 5. Обновление статус-бейджей

### ❌ Было:
```javascript
statusCell.textContent = bike.status;
statusCell.className = bike.status === 'available' ? 'status-available' : 'status-rented';
```

### ✅ Стало:
```javascript
const statusMap = {
  'available': 'success',
  'rented': 'info',
  'maintenance': 'warning',
  'unavailable': 'danger'
};

const badge = window.shadcnUtils.createBadge({
  text: bike.status,
  variant: statusMap[bike.status] || 'neutral'
});

statusCell.innerHTML = '';
statusCell.appendChild(badge);

// Или просто через HTML:
statusCell.innerHTML = `<span class="status-badge ${statusMap[bike.status]}">${bike.status}</span>`;
```

---

## 6. Обновление кнопок действий

### ❌ Было:
```javascript
const editBtn = document.createElement('button');
editBtn.textContent = 'Изменить';
editBtn.className = 'edit-btn';
```

### ✅ Стало:
```javascript
const editBtn = window.shadcnUtils.createButton({
  text: 'Изменить',
  variant: 'outline',
  size: 'sm',
  onClick: () => editItem(id)
});

// Или через HTML:
actionsCell.innerHTML = `
  <div class="table-actions">
    <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="editItem('${id}')">Изменить</button>
    <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteItem('${id}')">Удалить</button>
  </div>
`;
```

---

## 7. Модальные окна

Стили модалок уже обновлены автоматически! Но можете улучшить:

### Добавьте анимацию закрытия:
```javascript
function closeModal(modal) {
  modal.classList.add('animate-fade-out');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('animate-fade-out');
  }, 200);
}
```

---

## 8. Анимированные счётчики на Dashboard

### ❌ Было:
```javascript
valueElement.textContent = totalBikes;
```

### ✅ Стало:
```javascript
window.adminShadcn.animateNumber(valueElement, 0, totalBikes, 1000);
```

---

## 📝 Пример полной функции ДО и ПОСЛЕ

### ❌ ДО:
```javascript
function deleteBike(bikeId) {
  if (confirm('Удалить велосипед?')) {
    fetch(`/api/bikes/${bikeId}`, { method: 'DELETE' })
      .then(response => {
        if (response.ok) {
          alert('Велосипед удалён');
          loadBikes();
        } else {
          alert('Ошибка удаления');
        }
      });
  }
}
```

### ✅ ПОСЛЕ:
```javascript
async function deleteBike(bikeId) {
  const confirmed = await window.adminShadcn.showConfirmDialog({
    title: 'Удалить велосипед?',
    description: 'Это действие нельзя отменить. Велосипед будет удалён из системы.',
    confirmText: 'Удалить',
    cancelText: 'Отмена'
  });

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/bikes/${bikeId}`, { method: 'DELETE' });
    
    if (response.ok) {
      window.adminShadcn.showSuccessToast('Велосипед успешно удалён');
      loadBikes();
    } else {
      throw new Error('Ошибка сервера');
    }
  } catch (error) {
    window.adminShadcn.showErrorToast('Не удалось удалить велосипед');
    console.error(error);
  }
}
```

---

## 🔍 Поиск и замена (regex)

Используйте в VSCode / любом редакторе:

### 1. Найти все alert:
```regex
alert\(['"](.+?)['"]\)
```

### 2. Найти все confirm:
```regex
if\s*\(\s*confirm\(['"](.+?)['"]\)\s*\)
```

---

## ✅ Финальный чек-лист

- [ ] Заменить все `alert()` на toast
- [ ] Заменить все `confirm()` на showConfirmDialog
- [ ] Добавить loading states для async операций
- [ ] Добавить empty states для пустых таблиц
- [ ] Обновить статус-бейджи
- [ ] Обновить кнопки (добавить классы)
- [ ] Добавить анимации на счётчики dashboard
- [ ] Протестировать все функции

---

## 🎯 Приоритет обновления

### 🔴 Высокий (сделайте первым):
1. Toast уведомления вместо alert
2. Confirm dialogs
3. Loading states

### 🟡 Средний:
4. Empty states
5. Статус-бейджи
6. Кнопки

### 🟢 Низкий (опционально):
7. Анимированные счётчики
8. Ripple эффекты

---

## 💡 Совет

Не нужно переписывать весь код сразу! Обновляйте постепенно:
1. Начните с одной страницы (например, "Велосипеды")
2. Протестируйте изменения
3. Переходите к следующей странице

**Удачи в миграции! 🚀**

