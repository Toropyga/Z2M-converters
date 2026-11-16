# Документация по доработке конвертеров

В этой папке собраны технические отчёты о переработке внешних конвертеров Zigbee2MQTT
для устройств **DIYRuZ Zintercom** и **PTVO LED Informer**, подготовленные 16.11.2026
для Zigbee2MQTT 2.14.3 и библиотеки `zigbee-herdsman-converters` 26.125.0.

English version: [README.md](./README.md).

## Содержание

- [README_RU_Zintercom.md](./README_RU_Zintercom.md) — что изменено в `DIYRuZ_Zintercom.js`
  и как применить обновление.
- [README_RU_informer.md](./README_RU_informer.md) — что изменено в `ptvo_led_inform.js`
  и как применить обновление.

## Кратко

- **DIYRuZ Zintercom** — конвертер переведён на прямые импорты `converters/fromZigbee` и
  `converters/toZigbee`, `state` вынесен в отдельный read-only `toZigbee`, два запроса
  конфигурации батареи объединены в один, добавлена проверка входных значений, убран
  лишний read после записи режимов.
- **PTVO LED Informer** — конвертер переписан на CommonJS и восстанавливает полный набор
  функций оригинала для всех 8 endpoint (свет `l1`, автосмена эффектов `l2`, быстрые
  эффекты `l3`–`l8`) вместо упрощённого определения на одну CCT-лампу.

Оба конвертера проверены автоматическими тестами с имитацией Zigbee endpoint на реальной
версии библиотеки converters. См. раздел «Установка» в соответствующих отчётах.
