# PTVO LED Informer — Zigbee2MQTT 2.14.3

Updated file — `ptvo_led_inform.js`. Compatible with `zigbee-herdsman-converters 26.125.0`, as pinned in the official Zigbee2MQTT 2.14.3 dependencies.

## Why the rewrite was needed

The previously used short definition based on `modernExtend.light` plus an icon describes a single RGB+CCT light and does not contain effect channels; it was also rejected with a library ESM import resolution error.

The Informer device (model `ptvo_led_inform`, firmware `2022-09-12`) uses endpoints 1-8. Endpoint 1 has OnOff, LevelControl and ColorControl; endpoints 2-8 have OnOff and AnalogInput. The color capabilities `colorCapabilities: 9` include XY and hue/saturation, but not color temperature. Therefore, the final version restores the functionality of the full legacy definition instead of adding a generic CCT light.

## Preserved functionality

| Channel | Purpose | MQTT properties |
|---|---|---|
| l1 | Light, brightness, XY color; RGB/Hue input is converted by the standard handler | state_l1, brightness_l1, color_l1 |
| l2 | Automatic effect cycling and selection | state_l2, l2 |
| l3-l8 | Effect shortcut commands and their number configuration | state_l3...state_l8, l3...l8 |

For switches, `ON`, `OFF`, `TOGGLE` are preserved. Effect numbers are integers 0-60 per the PTVO LED documentation. The model, vendor, endpoints l1-l8, `multiEndpoint`, `enhancedHue: false` and the built-in icon from the provided file are preserved.

The PTVO service commands `trigger`, `interval`, numeric access to l1, and the parameters `switch_type`, `switch_actions`, `link_to_output`, `bind_command` are also preserved. New input configuration elements were not added to exposes: not all device channels have a matching cluster. Such commands should be applied to the endpoint that supports them.

## What changed

- CommonJS `require`/`module.exports` instead of ESM; direct library paths are used for compatibility with the Zigbee2MQTT environment. This does not mean that ESM as a format is unsupported by Zigbee2MQTT.
- PTVO handlers are taken from the current `fzLocal`/`tzLocal` in `devices/custom_devices_diy`: the old `fz.ptvo_*`/`tz.ptvo_*` converters are no longer used.
- The removed `fz.ignore_basic_report` was replaced with a local `genBasic` handler.
- Changes to shared library objects were removed — the local handlers do not affect converters for other devices.
- Fixed a duplicated `state` on switches: the old code added `withState` on top of a preset that already contained `state`.
- The numeric effect properties remain l2...l8, without the incorrect l2_l2...l8_l8 suffixes. Bounds 0-60 and a step of 1 were added for them.
- Incomplete reports no longer clear the values of missing attributes. In particular, a description without `presentValue` no longer writes NaN/null instead of the effect.
- Invalid values are no longer sent to the device; write errors are returned to Zigbee2MQTT.
- The file performs no Zigbee operations on import and does not add a configure step that automatically iterates over all eight channels.

## Installation

1. Copy **only** the finished `ptvo_led_inform.js` into the Zigbee2MQTT `external_converters` directory.
2. Restart Zigbee2MQTT, or upload the code via the External converters section in the UI.
3. Check for the `Loaded external converter 'ptvo_led_inform.js'` message and that Informer is recognized as a supported device.
4. Check ON/OFF and brightness/color on l1, then the effect number and switches on l2-l8. For example, an MQTT request body on `zigbee2mqtt/Informer/set`: `{"state_l1":"ON","brightness_l1":153,"color_l1":{"x":0.4,"y":0.3}}`; effect number: `{"l2":7}`; automatic cycling: `{"state_l2":"ON"}`.

## Official sources

- [Zigbee2MQTT 2.14.3 dependencies](https://github.com/Koenkk/zigbee2mqtt/blob/2.14.3/package.json)
- [Zigbee2MQTT external converters](https://www.zigbee2mqtt.io/advanced/more/external_converters.html)
- [PTVO LED: channels, effects and commands](https://ptvo.info/zigbee-configurable-firmware-features/led-firmware/)
