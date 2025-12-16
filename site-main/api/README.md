# RobBob News API

API сервер для управления новостями в лаунчере RobBob.

## Быстрый старт

### 1. Установка зависимостей
```bash
cd api
npm install
```

### 2. Настройка API ключа
Измените API ключ в `server.js` или задайте через переменную окружения:
```bash
export API_KEY="ваш-секретный-ключ"
```

**ВАЖНО:** Измените стандартный ключ перед деплоем!

### 3. Запуск сервера
```bash
npm start
```

Сервер запустится на порту 3000 (или `PORT` из окружения).

## Деплой на сервер

### Вариант 1: VPS (Ubuntu/Debian)

1. Скопируйте папку `api` на сервер
2. Установите Node.js 16+
3. Установите зависимости: `npm install`
4. Настройте systemd сервис:

```ini
# /etc/systemd/system/robbob-api.service
[Unit]
Description=RobBob News API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/robbob-api
Environment=PORT=3000
Environment=API_KEY=ваш-секретный-ключ
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

5. Запустите сервис:
```bash
sudo systemctl enable robbob-api
sudo systemctl start robbob-api
```

6. Настройте nginx как reverse proxy:
```nginx
server {
    listen 80;
    server_name api.robbob.ru;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Вариант 2: Существующий сервер robbob.ru

Если у вас уже есть сервер на robbob.ru:

1. Скопируйте папку `api` в `/var/www/robbob.ru/api`
2. Настройте nginx location:
```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## API Endpoints

### Публичные (без авторизации)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | /api/news | Получить все новости |
| GET | /api/health | Проверка работоспособности |

### Защищенные (требуют X-API-Key)

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /api/auth/verify | Проверить API ключ |
| POST | /api/news | Создать новость |
| PUT | /api/news/:id | Обновить новость |
| DELETE | /api/news/:id | Удалить новость |
| PATCH | /api/news/:id/pin | Переключить закрепление |

## Примеры запросов

### Получить новости (для лаунчера)
```bash
curl https://robbob.ru/api/news
```

### Создать новость
```bash
curl -X POST https://robbob.ru/api/news \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ваш-ключ" \
  -d '{
    "title": "Обновление v1.1.0",
    "content": "Добавлены новые функции...",
    "emoji": "update",
    "pinned": false
  }'
```

## Настройка админ-панели

1. Откройте админ-панель сайта: `https://robbob.ru/admin`
2. Перейдите в раздел "Лаунчер"
3. Введите:
   - **URL API сервера:** `https://robbob.ru` (или `https://api.robbob.ru`)
   - **API ключ:** ваш секретный ключ
4. Нажмите "Сохранить и проверить"

## Структура файлов

```
api/
├── server.js       # Основной сервер
├── package.json    # Зависимости
├── README.md       # Документация
└── data/
    └── news.json   # Файл с новостями (создается автоматически)
```

## Доступные emoji

| ID | Emoji | Описание |
|----|-------|----------|
| rocket | 🚀 | Релиз |
| shield | 🛡️ | Безопасность |
| zap | ⚡ | Скорость |
| star | ⭐ | Важное |
| fire | 🔥 | Горячее |
| gift | 🎁 | Подарок |
| warning | ⚠️ | Внимание |
| info | ℹ️ | Информация |
| check | ✅ | Готово |
| new | 🆕 | Новое |
| update | 📦 | Обновление |
| bug | 🐛 | Баг |
| fix | 🔧 | Исправление |
| sparkles | ✨ | Улучшение |
| game | 🎮 | Игры |
| network | 🌐 | Сеть |

## Безопасность

- **Смените API ключ** перед деплоем!
- Используйте HTTPS в продакшене
- Не храните API ключ в коде на GitHub
- Рекомендуется использовать переменные окружения для ключей
