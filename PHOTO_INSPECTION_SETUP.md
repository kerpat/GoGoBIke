# Настройка фотоконтроля велосипедов

## Изменения в базе данных Supabase

### 1. Добавить поле в таблицу `rentals`

Выполните следующий SQL запрос в Supabase SQL Editor:

```sql
-- Добавляем поле для хранения данных фотоконтроля
ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS pre_rental_photos jsonb DEFAULT NULL;

-- Добавляем комментарий к полю
COMMENT ON COLUMN rentals.pre_rental_photos IS 'Фотографии и видео фотоконтроля велосипеда перед арендой';
```

### 2. Создать storage bucket для фотоконтроля

1. Перейдите в Supabase Dashboard → Storage
2. Создайте новый bucket с именем `rental-inspections`
3. Настройки bucket:
   - **Public**: No (приватный)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, video/mp4, video/webm`

### 3. Настроить политики доступа для storage

Выполните следующий SQL:

```sql
-- Политика для загрузки файлов (пользователи могут загружать только свои файлы)
CREATE POLICY "Users can upload their own inspection photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rental-inspections' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Политика для чтения файлов (пользователи могут видеть свои файлы, админы - все)
CREATE POLICY "Users can view their own inspection photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rental-inspections' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = auth.uid() 
      AND clients.is_admin = true
    )
  )
);

-- Политика для удаления (только админы)
CREATE POLICY "Only admins can delete inspection photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rental-inspections' 
  AND EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = auth.uid() 
    AND clients.is_admin = true
  )
);
```

## Структура данных pre_rental_photos

```json
{
  "photo_front": "https://...",
  "photo_back": "https://...",
  "photo_left": "https://...",
  "photo_right": "https://...",
  "video_inspection": "https://...",
  "completed_at": "2025-10-10T15:30:00.000Z"
}
```

## Проверка настройки

После выполнения всех шагов, проверьте:

1. В таблице `rentals` появилось поле `pre_rental_photos` типа `jsonb`
2. В Storage появился bucket `rental-inspections`
3. Политики доступа настроены корректно

## Откат изменений (если нужно)

```sql
-- Удалить поле из таблицы
ALTER TABLE rentals DROP COLUMN IF EXISTS pre_rental_photos;

-- Удалить bucket можно через Dashboard или:
-- Storage → rental-inspections → Delete bucket
```


