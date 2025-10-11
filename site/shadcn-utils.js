/**
 * shadcn/ui Utilities for Vanilla JS
 * Утилиты для работы с компонентами shadcn/ui в Vanilla JavaScript
 */

/**
 * cn() - классический helper из shadcn/ui для объединения классов
 * Альтернатива clsx + tailwind-merge для Vanilla JS
 * 
 * @param {...(string|Object|Array)} classes - классы для объединения
 * @returns {string} - объединённые классы
 * 
 * @example
 * cn('btn-shadcn', 'btn-primary') // => 'btn-shadcn btn-primary'
 * cn('btn-shadcn', { 'btn-lg': isLarge }) // => 'btn-shadcn btn-lg'
 * cn(['btn-shadcn', 'btn-primary'], 'rounded') // => 'btn-shadcn btn-primary rounded'
 */
export function cn(...classes) {
  const result = [];

  classes.forEach(cls => {
    if (!cls) return;

    // Строка
    if (typeof cls === 'string') {
      result.push(cls);
    }
    // Массив
    else if (Array.isArray(cls)) {
      const nested = cn(...cls);
      if (nested) result.push(nested);
    }
    // Объект (условные классы)
    else if (typeof cls === 'object') {
      Object.entries(cls).forEach(([key, value]) => {
        if (value) result.push(key);
      });
    }
  });

  return result.join(' ');
}

/**
 * Создаёт кнопку в стиле shadcn/ui
 * 
 * @param {Object} options - опции кнопки
 * @param {string} options.text - текст кнопки
 * @param {string} [options.variant='primary'] - вариант кнопки (primary|secondary|outline|ghost|destructive)
 * @param {string} [options.size='default'] - размер кнопки (sm|default|lg|icon)
 * @param {boolean} [options.disabled=false] - отключить кнопку
 * @param {Function} [options.onClick] - обработчик клика
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLButtonElement}
 * 
 * @example
 * const btn = createButton({
 *   text: 'Нажми меня',
 *   variant: 'primary',
 *   size: 'lg',
 *   onClick: () => alert('Clicked!')
 * });
 */
export function createButton({
  text,
  variant = 'primary',
  size = 'default',
  disabled = false,
  onClick,
  className = '',
  icon = null
}) {
  const button = document.createElement('button');

  const classes = cn(
    'btn-shadcn',
    {
      'btn-primary': variant === 'primary',
      'btn-secondary': variant === 'secondary',
      'btn-outline': variant === 'outline',
      'btn-ghost': variant === 'ghost',
      'btn-destructive': variant === 'destructive',
      'btn-sm': size === 'sm',
      'btn-lg': size === 'lg',
      'btn-icon': size === 'icon',
    },
    className
  );

  button.className = classes;
  
  if (icon) {
    button.innerHTML = `${icon} <span>${text}</span>`;
  } else {
    button.textContent = text;
  }
  
  button.disabled = disabled;

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}

/**
 * Создаёт карточку в стиле shadcn/ui
 * 
 * @param {Object} options - опции карточки
 * @param {string} [options.title] - заголовок карточки
 * @param {string} [options.description] - описание карточки
 * @param {string|HTMLElement} options.content - содержимое карточки
 * @param {string|HTMLElement} [options.footer] - футер карточки
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLDivElement}
 * 
 * @example
 * const card = createCard({
 *   title: 'Заголовок',
 *   description: 'Описание карточки',
 *   content: 'Основное содержимое',
 *   footer: '<button>Действие</button>'
 * });
 */
export function createCard({
  title,
  description,
  content,
  footer,
  className = ''
}) {
  const card = document.createElement('div');
  card.className = cn('card-shadcn', className);

  if (title || description) {
    const header = document.createElement('div');
    header.className = 'card-header';

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'card-title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (description) {
      const descEl = document.createElement('p');
      descEl.className = 'card-description';
      descEl.textContent = description;
      header.appendChild(descEl);
    }

    card.appendChild(header);
  }

  if (content) {
    const contentEl = document.createElement('div');
    contentEl.className = 'card-content';
    
    if (typeof content === 'string') {
      contentEl.innerHTML = content;
    } else {
      contentEl.appendChild(content);
    }
    
    card.appendChild(contentEl);
  }

  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'card-footer';
    
    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else {
      footerEl.appendChild(footer);
    }
    
    card.appendChild(footerEl);
  }

  return card;
}

/**
 * Создаёт badge в стиле shadcn/ui
 * 
 * @param {Object} options - опции badge
 * @param {string} options.text - текст badge
 * @param {string} [options.variant='primary'] - вариант (primary|secondary|outline|destructive)
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLSpanElement}
 * 
 * @example
 * const badge = createBadge({ text: 'Новое', variant: 'primary' });
 */
export function createBadge({
  text,
  variant = 'primary',
  className = ''
}) {
  const badge = document.createElement('span');

  const classes = cn(
    'badge-shadcn',
    {
      'badge-primary': variant === 'primary',
      'badge-secondary': variant === 'secondary',
      'badge-outline': variant === 'outline',
      'badge-destructive': variant === 'destructive',
    },
    className
  );

  badge.className = classes;
  badge.textContent = text;

  return badge;
}

/**
 * Создаёт alert в стиле shadcn/ui
 * 
 * @param {Object} options - опции alert
 * @param {string} [options.title] - заголовок alert
 * @param {string} options.description - текст alert
 * @param {string} [options.variant='info'] - вариант (info|destructive|success)
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLDivElement}
 * 
 * @example
 * const alert = createAlert({
 *   title: 'Внимание!',
 *   description: 'Это важное сообщение',
 *   variant: 'destructive'
 * });
 */
export function createAlert({
  title,
  description,
  variant = 'info',
  className = ''
}) {
  const alert = document.createElement('div');

  const classes = cn(
    'alert-shadcn',
    {
      'alert-info': variant === 'info',
      'alert-destructive': variant === 'destructive',
      'alert-success': variant === 'success',
    },
    className
  );

  alert.className = classes;

  let html = '<div>';
  if (title) {
    html += `<div class="alert-title">${title}</div>`;
  }
  html += `<div class="alert-description">${description}</div>`;
  html += '</div>';

  alert.innerHTML = html;

  return alert;
}

/**
 * Создаёт input в стиле shadcn/ui
 * 
 * @param {Object} options - опции input
 * @param {string} [options.type='text'] - тип input
 * @param {string} [options.placeholder] - placeholder
 * @param {string} [options.value] - начальное значение
 * @param {boolean} [options.disabled=false] - отключить input
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLInputElement}
 * 
 * @example
 * const input = createInput({
 *   type: 'email',
 *   placeholder: 'Введите email',
 *   className: 'w-full'
 * });
 */
export function createInput({
  type = 'text',
  placeholder = '',
  value = '',
  disabled = false,
  className = ''
}) {
  const input = document.createElement('input');

  input.type = type;
  input.className = cn('input-shadcn', className);
  input.placeholder = placeholder;
  input.value = value;
  input.disabled = disabled;

  return input;
}

/**
 * Создаёт progress bar в стиле shadcn/ui
 * 
 * @param {Object} options - опции progress
 * @param {number} options.value - значение (0-100)
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLDivElement}
 * 
 * @example
 * const progress = createProgress({ value: 75 });
 */
export function createProgress({
  value = 0,
  className = ''
}) {
  const container = document.createElement('div');
  container.className = cn('progress-shadcn', className);

  const indicator = document.createElement('div');
  indicator.className = 'progress-indicator';
  indicator.style.transform = `translateX(-${100 - value}%)`;

  container.appendChild(indicator);

  return container;
}

/**
 * Обновляет значение progress bar
 * 
 * @param {HTMLDivElement} progressElement - элемент progress
 * @param {number} value - новое значение (0-100)
 */
export function updateProgress(progressElement, value) {
  const indicator = progressElement.querySelector('.progress-indicator');
  if (indicator) {
    indicator.style.transform = `translateX(-${100 - value}%)`;
  }
}

/**
 * Создаёт switch в стиле shadcn/ui
 * 
 * @param {Object} options - опции switch
 * @param {boolean} [options.checked=false] - начальное состояние
 * @param {Function} [options.onChange] - callback при изменении
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLDivElement}
 * 
 * @example
 * const toggle = createSwitch({
 *   checked: true,
 *   onChange: (checked) => console.log('Switch:', checked)
 * });
 */
export function createSwitch({
  checked = false,
  onChange,
  className = ''
}) {
  const container = document.createElement('div');
  container.className = cn('switch-shadcn', { active: checked }, className);
  container.setAttribute('role', 'switch');
  container.setAttribute('aria-checked', checked);

  const thumb = document.createElement('span');
  thumb.className = 'switch-thumb';
  container.appendChild(thumb);

  container.addEventListener('click', () => {
    const isActive = container.classList.contains('active');
    container.classList.toggle('active');
    container.setAttribute('aria-checked', !isActive);

    if (onChange) {
      onChange(!isActive);
    }
  });

  return container;
}

/**
 * Создаёт skeleton loader в стиле shadcn/ui
 * 
 * @param {Object} options - опции skeleton
 * @param {string} [options.width='100%'] - ширина
 * @param {string} [options.height='20px'] - высота
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLDivElement}
 * 
 * @example
 * const skeleton = createSkeleton({ width: '200px', height: '40px' });
 */
export function createSkeleton({
  width = '100%',
  height = '20px',
  className = ''
}) {
  const skeleton = document.createElement('div');
  skeleton.className = cn('skeleton-shadcn', className);
  skeleton.style.width = width;
  skeleton.style.height = height;

  return skeleton;
}

/**
 * Создаёт separator в стиле shadcn/ui
 * 
 * @param {Object} options - опции separator
 * @param {string} [options.orientation='horizontal'] - ориентация (horizontal|vertical)
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLDivElement}
 * 
 * @example
 * const separator = createSeparator({ orientation: 'horizontal' });
 */
export function createSeparator({
  orientation = 'horizontal',
  className = ''
}) {
  const separator = document.createElement('div');

  const classes = cn(
    'separator-shadcn',
    {
      'separator-horizontal': orientation === 'horizontal',
      'separator-vertical': orientation === 'vertical',
    },
    className
  );

  separator.className = classes;

  return separator;
}

/**
 * Создаёт avatar в стиле shadcn/ui
 * 
 * @param {Object} options - опции avatar
 * @param {string} [options.src] - URL изображения
 * @param {string} [options.alt='Avatar'] - alt текст
 * @param {string} [options.fallback] - текст fallback (инициалы)
 * @param {string} [options.className] - дополнительные классы
 * @returns {HTMLDivElement}
 * 
 * @example
 * const avatar = createAvatar({
 *   src: 'https://example.com/avatar.jpg',
 *   alt: 'User Avatar',
 *   fallback: 'AB'
 * });
 */
export function createAvatar({
  src,
  alt = 'Avatar',
  fallback = '?',
  className = ''
}) {
  const container = document.createElement('div');
  container.className = cn('avatar-shadcn', className);

  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'avatar-image';

    img.onerror = () => {
      img.style.display = 'none';
      const fallbackEl = document.createElement('span');
      fallbackEl.className = 'avatar-fallback';
      fallbackEl.textContent = fallback;
      container.appendChild(fallbackEl);
    };

    container.appendChild(img);
  } else {
    const fallbackEl = document.createElement('span');
    fallbackEl.className = 'avatar-fallback';
    fallbackEl.textContent = fallback;
    container.appendChild(fallbackEl);
  }

  return container;
}

/**
 * Toast notification система
 */
class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
  }

  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 420px;
    `;
    document.body.appendChild(this.container);
  }

  show({
    title,
    description,
    variant = 'info',
    duration = 3000
  }) {
    this.init();

    const toast = createAlert({ title, description, variant });
    toast.classList.add('animate-slide-in');
    toast.style.cssText = `
      margin-bottom: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;

    this.container.appendChild(toast);
    this.toasts.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }

    return toast;
  }

  remove(toast) {
    toast.classList.add('animate-fade-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 200);
  }
}

// Глобальный экземпляр Toast
export const toast = new ToastManager();

/**
 * Показывает toast уведомление
 * 
 * @param {Object} options - опции toast
 * @param {string} [options.title] - заголовок
 * @param {string} options.description - текст
 * @param {string} [options.variant='info'] - вариант (info|success|destructive)
 * @param {number} [options.duration=3000] - длительность в мс
 * 
 * @example
 * showToast({
 *   title: 'Успех!',
 *   description: 'Данные сохранены',
 *   variant: 'success'
 * });
 */
export function showToast(options) {
  return toast.show(options);
}

// Экспорт для использования в глобальной области видимости
if (typeof window !== 'undefined') {
  window.shadcnUtils = {
    cn,
    createButton,
    createCard,
    createBadge,
    createAlert,
    createInput,
    createProgress,
    updateProgress,
    createSwitch,
    createSkeleton,
    createSeparator,
    createAvatar,
    showToast,
    toast
  };
}

