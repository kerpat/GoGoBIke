/**
 * shadcn/ui Component Enhancements for Admin Panel
 * Улучшения компонентов для админ-панели
 */

// Импортируем утилиты
import { cn, showToast, createBadge, createButton, createSkeleton } from './shadcn-utils.js';

/**
 * Инициализация shadcn/ui компонентов для админки
 */
export function initAdminShadcnComponents() {
  console.log('🎨 Initializing shadcn/ui components for admin panel...');

  // Заменяем обычные кнопки на shadcn/ui стиль
  enhanceButtons();
  
  // Улучшаем таблицы
  enhanceTables();
  
  // Добавляем анимации
  addPageTransitions();
  
  // Улучшаем статус-бейджи
  enhanceStatusBadges();

  console.log('✅ shadcn/ui components initialized!');
}

/**
 * Улучшает все кнопки, добавляя классы shadcn/ui
 */
function enhanceButtons() {
  // Основные кнопки действий
  document.querySelectorAll('button[type="submit"], .primary-action').forEach(btn => {
    if (!btn.classList.contains('admin-btn')) {
      btn.classList.add('admin-btn', 'admin-btn-primary');
    }
  });

  // Вторичные кнопки
  document.querySelectorAll('.secondary-action, button[type="button"]:not(.admin-btn)').forEach(btn => {
    // Пропускаем кнопки навигации
    if (!btn.closest('#admin-nav') && !btn.classList.contains('admin-btn')) {
      btn.classList.add('admin-btn', 'admin-btn-secondary');
    }
  });

  // Кнопки удаления/опасные действия
  document.querySelectorAll('.delete-btn, .danger-action, button[data-action="delete"]').forEach(btn => {
    if (!btn.classList.contains('admin-btn')) {
      btn.classList.add('admin-btn', 'admin-btn-danger', 'admin-btn-sm');
    }
  });

  // Кнопки редактирования
  document.querySelectorAll('.edit-btn, button[data-action="edit"]').forEach(btn => {
    if (!btn.classList.contains('admin-btn')) {
      btn.classList.add('admin-btn', 'admin-btn-outline', 'admin-btn-sm');
    }
  });
}

/**
 * Улучшает таблицы
 */
function enhanceTables() {
  document.querySelectorAll('table').forEach(table => {
    // Добавляем класс admin-table
    if (!table.classList.contains('admin-table')) {
      table.classList.add('admin-table');
    }

    // Оборачиваем в контейнер если еще не обернута
    if (!table.parentElement.classList.contains('admin-table-container')) {
      const container = document.createElement('div');
      container.className = 'admin-table-container';
      table.parentElement.insertBefore(container, table);
      container.appendChild(table);
    }
  });
}

/**
 * Добавляет плавные переходы между страницами
 */
function addPageTransitions() {
  const sections = document.querySelectorAll('.admin-section');
  
  sections.forEach(section => {
    // Добавляем observer для анимации при появлении
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeIn 0.3s ease-in-out';
        }
      });
    }, { threshold: 0.1 });

    observer.observe(section);
  });
}

/**
 * Улучшает status badges
 */
function enhanceStatusBadges() {
  // Статусы велосипедов
  const statusMap = {
    'доступен': 'success',
    'available': 'success',
    'в аренде': 'info',
    'rented': 'info',
    'на обслуживании': 'warning',
    'maintenance': 'warning',
    'недоступен': 'danger',
    'unavailable': 'danger'
  };

  document.querySelectorAll('[data-status], .status, .bike-status').forEach(element => {
    const status = element.textContent.toLowerCase().trim();
    const variant = statusMap[status] || 'neutral';
    
    if (!element.classList.contains('status-badge')) {
      element.className = `status-badge ${variant}`;
    }
  });
}

/**
 * Создает skeleton loader для таблицы
 */
export function showTableSkeleton(tableBody, rows = 5, cols = 6) {
  tableBody.innerHTML = '';
  
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement('tr');
    
    for (let j = 0; j < cols; j++) {
      const td = document.createElement('td');
      const skeleton = createSkeleton({ 
        height: '20px',
        width: j === 0 ? '80px' : '100%'
      });
      td.appendChild(skeleton);
      tr.appendChild(td);
    }
    
    tableBody.appendChild(tr);
  }
}

/**
 * Показывает toast с успешным сохранением
 */
export function showSuccessToast(message = 'Данные успешно сохранены') {
  showToast({
    title: 'Успех!',
    description: message,
    variant: 'success',
    duration: 3000
  });
}

/**
 * Показывает toast с ошибкой
 */
export function showErrorToast(message = 'Произошла ошибка') {
  showToast({
    title: 'Ошибка',
    description: message,
    variant: 'destructive',
    duration: 5000
  });
}

/**
 * Показывает toast с информацией
 */
export function showInfoToast(message) {
  showToast({
    title: 'Информация',
    description: message,
    variant: 'info',
    duration: 3000
  });
}

/**
 * Создает красивую карточку статистики для дашборда
 */
export function createDashboardStatCard({ label, value, icon, variant = 'info', onClick }) {
  const card = document.createElement('div');
  card.className = 'dashboard-stat-card';
  
  if (onClick) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', onClick);
  }

  const statInfo = document.createElement('div');
  statInfo.className = 'stat-info';

  const statLabel = document.createElement('div');
  statLabel.className = 'stat-label';
  statLabel.textContent = label;

  const statValue = document.createElement('div');
  statValue.className = 'stat-value';
  statValue.textContent = value;

  statInfo.appendChild(statLabel);
  statInfo.appendChild(statValue);

  const statIcon = document.createElement('div');
  statIcon.className = `stat-icon ${variant}`;
  statIcon.textContent = icon || '📊';

  card.appendChild(statInfo);
  card.appendChild(statIcon);

  return card;
}

/**
 * Создает empty state для пустых таблиц
 */
export function createEmptyState({ icon = '📭', title, description, actionText, onAction }) {
  const container = document.createElement('div');
  container.className = 'empty-state';

  const iconEl = document.createElement('div');
  iconEl.className = 'empty-state-icon';
  iconEl.textContent = icon;

  const titleEl = document.createElement('div');
  titleEl.className = 'empty-state-title';
  titleEl.textContent = title;

  const descEl = document.createElement('div');
  descEl.className = 'empty-state-description';
  descEl.textContent = description;

  container.appendChild(iconEl);
  container.appendChild(titleEl);
  container.appendChild(descEl);

  if (actionText && onAction) {
    const btn = createButton({
      text: actionText,
      variant: 'primary',
      onClick: onAction
    });
    container.appendChild(btn);
  }

  return container;
}

/**
 * Показывает loading state в контейнере
 */
export function showLoadingState(container, message = 'Загрузка...') {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-container';
  loadingDiv.innerHTML = `
    <div class="loading-spinner"></div>
    <div style="color: var(--admin-text-secondary); font-size: 0.9375rem;">${message}</div>
  `;
  
  container.innerHTML = '';
  container.appendChild(loadingDiv);
}

/**
 * Анимирует число (счетчик)
 */
export function animateNumber(element, start, end, duration = 1000) {
  const range = end - start;
  const increment = range / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

/**
 * Добавляет ripple эффект на кнопку
 */
export function addRippleEffect(button) {
  button.style.position = 'relative';
  button.style.overflow = 'hidden';

  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });

  // Добавляем CSS для анимации
  if (!document.getElementById('ripple-animation-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-animation-style';
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Создает confirm dialog в стиле shadcn/ui
 */
export function showConfirmDialog({ title, description, confirmText = 'Подтвердить', cancelText = 'Отмена', onConfirm, onCancel }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '10000';

    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.maxWidth = '450px';

    modal.innerHTML = `
      <div class="modal-header">
        <h3>${title}</h3>
      </div>
      <div class="modal-body">
        <p style="color: var(--admin-text-secondary); line-height: 1.6;">${description}</p>
      </div>
      <div class="modal-footer">
        <button class="admin-btn admin-btn-outline" id="confirm-cancel">${cancelText}</button>
        <button class="admin-btn admin-btn-primary" id="confirm-ok">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const handleClose = (confirmed) => {
      overlay.classList.add('animate-fade-out');
      setTimeout(() => {
        overlay.remove();
      }, 200);

      if (confirmed && onConfirm) onConfirm();
      if (!confirmed && onCancel) onCancel();
      resolve(confirmed);
    };

    modal.querySelector('#confirm-ok').addEventListener('click', () => handleClose(true));
    modal.querySelector('#confirm-cancel').addEventListener('click', () => handleClose(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleClose(false);
    });
  });
}

// Экспортируем в глобальную область видимости для использования в admin.js
if (typeof window !== 'undefined') {
  window.adminShadcn = {
    initAdminShadcnComponents,
    showTableSkeleton,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    createDashboardStatCard,
    createEmptyState,
    showLoadingState,
    animateNumber,
    addRippleEffect,
    showConfirmDialog
  };
}

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminShadcnComponents);
} else {
  initAdminShadcnComponents();
}

