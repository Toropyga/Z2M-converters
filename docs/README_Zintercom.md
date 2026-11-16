# DIYRuZ_Zintercom: fixed version

Updated file: `DIYRuZ_Zintercom.js`.

## What was fixed

- The root `require('zigbee-herdsman-converters')` import was replaced with direct `converters/fromZigbee` and `converters/toZigbee` imports. This reduces coupling with the root API; the resulting server-side time savings have not been measured.
- `state` was split into its own `toZigbee` converter with `convertGet` and no `convertSet`. GET still reads 0x0050; a write attempt can no longer send an undefined payload.
- The two battery configuration requests were merged into a single `configureReporting('genPowerCfg', [...])` call. `configure()` now performs four sequential operations instead of five: two binds and two configureReporting calls. There are no parallel radio requests; intervals, attributes and types are preserved. Support for the merged request still needs to be verified on the device.
- There is no extra read after writing `mode`, `once`, `always`, `drop`. After a successful write, all four related properties are returned immediately. This is optimistic state, not an independent confirmation of execution. Reports and explicit GETs still update the state, including when Once is automatically reset by the firmware.
- Invalid values no longer reach Zigbee: NaN, partially numeric strings, fractions and values outside the uint8 range are rejected. For mode, the original names and numeric codes 0-3 are accepted; for time values, numbers and decimal strings 0-255 are accepted. The time value in the published state is now always a number. For switches, only `ON`/`OFF` are accepted.

`DIY_Zintercom`, the model, `factory_reset`, the battery handler, all exposes, names, units and value casing are preserved: `Idle/Ring/Talk/Open/Drop`, `Never/Once/Always/Drop`, `ON/OFF`. The OFF semantics are also unchanged: turning off any of the three mode switches selects Never, even if another mode was previously active. `configureKey` is kept at 1; the new reporting configuration can be explicitly applied and verified with the Reconfigure command.

## Installation

1. Back up the current converter file from the `external_converters` directory.
2. Replace only the `DIYRuZ_Zintercom.js` file with the new version.
3. Restart Zigbee2MQTT, or upload the file via the External converters section in the UI.
4. Check that the converter loaded without errors, and reconfigure the device if needed. Verify modes separately: after a write, the UI updates optimistically, while a `mode` GET confirms the actual value. On a real call, verify the automatic reset of Once and the corresponding report.
5. If a rollback is needed, restore the saved backup and restart. If the new reporting configuration has already been applied, also run Reconfigure after reverting to the old version.

## Official sources

- [Zigbee2MQTT 2.14.3 converter loader](https://github.com/Koenkk/zigbee2mqtt/blob/2.14.3/lib/extension/externalConverters.ts)
- [Loading external JS files in 2.14.3](https://github.com/Koenkk/zigbee2mqtt/blob/2.14.3/lib/extension/externalJS.ts)
- [2.14.3 release dependencies](https://github.com/Koenkk/zigbee2mqtt/blob/2.14.3/package.json)
- [converters library 26.125.0 path exports](https://github.com/Koenkk/zigbee-herdsman-converters/blob/v26.125.0/package.json)
- [External converters documentation](https://www.zigbee2mqtt.io/advanced/more/external_converters.html)
