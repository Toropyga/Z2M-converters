# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.2.0] - 2026-11-16

### Changed

- **`converters/DIYRuZ_Zintercom.js`** — rewritten to reduce coupling and tighten validation while keeping the device's model, exposes, states (`Idle/Ring/Talk/Open/Drop`), modes (`Never/Once/Always/Drop`) and reporting intervals unchanged:
  - Replaced the root `require('zigbee-herdsman-converters')` import with direct `converters/fromZigbee` and `converters/toZigbee` imports.
  - Split the read-only `state` attribute into its own `toZigbee` converter with `convertGet` only, so a write can no longer send an undefined payload for it.
  - Merged the two battery `configureReporting` requests (`batteryVoltage`, `batteryPercentageRemaining`) into a single call; `configure()` now performs four sequential operations instead of five.
  - Removed the extra read after writing `mode`/`once`/`always`/`drop`; all four related properties are now returned directly as optimistic state after a successful write. Reports and explicit GETs remain authoritative.
  - Added strict validation of written values: mode accepts the original names or numeric codes 0-3, time values accept numbers or decimal strings 0-255, and switches accept only `ON`/`OFF`; invalid values are rejected before being sent to the device.
- **`converters/ptvo_led_inform.js`** — rewritten to restore the full original PTVO LED Informer functionality for all 8 endpoints, instead of a simplified single CCT-light definition:
  - Converted to CommonJS (`require`/`module.exports`).
  - Restored `l1` (RGB+CCT light with XY color), `l2` (automatic effect cycling and selection) and `l3`-`l8` (effect shortcuts and numbers), plus the PTVO service commands (`trigger`, `interval`, `switch_type`, `switch_actions`, `link_to_output`, `bind_command`).
  - Replaced the deprecated `fz.ptvo_*`/`tz.ptvo_*` converters with the current `fzLocal`/`tzLocal` handlers used in `devices/custom_devices_diy`, and replaced the removed `fz.ignore_basic_report` with a local `genBasic` handler.
  - Fixed a duplicated `state` property on switches and incorrect effect-number property suffixes (`l2_l2`...`l8_l8` → `l2`...`l8`).
  - Incomplete attribute reports no longer clear existing values, and invalid values are rejected before being sent to the device.
- Both converters were validated against `zigbee-herdsman-converters@26.125.0` (the dependency pinned by Zigbee2MQTT 2.14.3) with automated regression tests (`node --test`) using a simulated Zigbee endpoint. Loading in an installed Zigbee2MQTT instance and behavior on real hardware have not been verified yet.
- **`README.md`** — the `ZigBee2MQTT` badge is updated from `v2.0.0` to `v2.14.3`, matching the version the converters are validated against.

### Added

- `docs/README_RU_Zintercom.md` / `docs/README_Zintercom.md` — detailed Russian and English write-ups of the `DIYRuZ_Zintercom.js` rewrite: rationale and installation/rollback instructions.
- `docs/README_RU_informer.md` / `docs/README_informer.md` — detailed Russian and English write-ups of the `ptvo_led_inform.js` rewrite: rationale and installation instructions.
- `docs/README.md` / `docs/README_RU.md` — English and Russian index of the `docs/` folder.

[2.2.0]: https://github.com/Toropyga/Z2M-converters/compare/v2.1.1...v2.2.0
