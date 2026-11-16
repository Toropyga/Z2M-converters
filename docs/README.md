# Converter rewrite documentation

This folder contains technical reports describing the rewrite of the external
Zigbee2MQTT converters for the **DIYRuZ Zintercom** and **PTVO LED Informer** devices,
prepared on 2026-11-16 for Zigbee2MQTT 2.14.3 and `zigbee-herdsman-converters` 26.125.0.

Russian version: [README_RU.md](./README_RU.md).

## Contents

- [README_Zintercom.md](./README_Zintercom.md) — what changed in `DIYRuZ_Zintercom.js`
  and how to apply the update ([Russian version](./README_RU_Zintercom.md)).
- [README_informer.md](./README_informer.md) — what changed in `ptvo_led_inform.js`
  and how to apply the update ([Russian version](./README_RU_informer.md)).

## Summary

- **DIYRuZ Zintercom** — the converter now uses direct `converters/fromZigbee` and
  `converters/toZigbee` imports, the read-only `state` attribute was split into its own
  `toZigbee` converter, the two battery `configureReporting` requests were merged into
  one, input validation was added, and the extra read after writing a mode no longer
  happens.
- **PTVO LED Informer** — the converter was rewritten as CommonJS and restores the full
  original functionality for all 8 endpoints (`l1` RGB+CCT light, `l2` automatic effect
  cycling, `l3`-`l8` effect shortcuts) instead of a simplified single-CCT-light
  definition.

Both converters were validated with automated tests against a simulated Zigbee endpoint
using the real converters library version. See the "Installation"
section of the respective reports.
