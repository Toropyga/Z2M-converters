# Z2M-converters 
Zigbee2MQTT converters for my devices.

![ZigBee2MQTT](https://img.shields.io/badge/ZigBee2MQTT-v2.0.0-yellow.svg)

- **DIYRuZ Zintercom** - [Zintercom](https://github.com/Toropyga/Z2M-converters/blob/main/converters/DIYRuZ_Zintercom_1.35.js) - Intercom converter. My modification. [Espdomofon](https://espdomofon.ru/category/diy/).
- **EFEKTA iAQ2 R2** - [EFEKTA iAQ2 R2](https://github.com/Toropyga/Z2M-converters/blob/main/converters/EFEKTA_iAQ2_R2.js) - EFEKTA iAQ2 R2 converter. My modification. [EFEKTA iAQ](https://github.com/smartboxchannel/EFEKTA_iAQ/tree/main/converter).
- **EFEKTA iAQ S III R4** - [EFEKTA iAQ S III R4](https://github.com/Toropyga/Z2M-converters/blob/main/converters/EFEKTA_iAQ_S_III_R4.js) - EFEKTA iAQ S III R4 converter. My modification. [EFEKTA iAQ](https://github.com/smartboxchannel/EFEKTA_iAQ/tree/main/converter).
- **zFlora ProMax R4** - [zFlora ProMax R4](https://github.com/Toropyga/Z2M-converters/blob/main/converters/zFlora_ProMax_R4.js) - zFlora ProMax R4 converter. My modification. [EFEKTA zFlora](https://github.com/smartboxchannel/EFEKTA-zFlora/tree/main/Z2M_Converter).
- **PTVO LED Informer** - [PTVO LED Informer](https://github.com/Toropyga/Z2M-converters/blob/main/converters/ptvo_led_inform.js) - PTVO LED Informer converter.  My modification. [Modkam](https://modkam.ru/2022/09/12/vizualnyj-zigbee-informer-v-korpuse-gx53/).\
\
~~**Perenio door sensor** - [Perenio door sensor](https://github.com/Toropyga/Z2M-converters/blob/main/converters/perenio.js) - Perenio Door and Window Sensor. My old converter. There is no more need.~~


**External converters and extensions** ([Full readme is here](https://github.com/Koenkk/zigbee2mqtt/discussions/24198))

- The external_converters setting is no longer used. Instead all external converters inside data/external_converters directory are now automatically loaded. Make sure to move all your external converters to this directory.
- External extensions are now loaded from data/external_extensions instead of data/extension. Make sure to rename your data/extension directory (if present) to data/external_extensions.