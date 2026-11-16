'use strict';

const fromZigbeeConverters = require('zigbee-herdsman-converters/converters/fromZigbee');
const toZigbeeConverters = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const ep = exposes.presets;
const ea = exposes.access;
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const states = ['Idle', 'Ring', 'Talk', 'Open', 'Drop'];
const modes = ['Never', 'Once', 'Always', 'Drop'];
const modeSwitches = {once: 1, always: 2, drop: 3};
const attributes = {
    state: 0x0050,
    mode: 0x0051,
    once: 0x0051,
    always: 0x0051,
    drop: 0x0051,
    sound: 0x0052,
    time_ring: 0x0053,
    time_talk: 0x0054,
    time_open: 0x0055,
    time_report: 0x0056,
    time_bell: 0x0057,
};

// Also used after a successful write: all four properties describe one attribute.
const modeState = (value) => ({
    mode: modes[value],
    once: value === 1 ? 'ON' : 'OFF',
    always: value === 2 ? 'ON' : 'OFF',
    drop: value === 3 ? 'ON' : 'OFF',
});

const readAttribute = async (entity, key) => {
    if (!hasOwn(attributes, key)) throw new Error(`Unsupported property: ${key}`);
    await entity.read('closuresDoorLock', [attributes[key]]);
};

const toInteger = (rawValue, key, max) => {
    // Preserve numeric input and decimal numeric strings, but reject NaN,
    // partial strings, fractions and values outside the attribute's range.
    const value = typeof rawValue === 'number' ? rawValue :
        (typeof rawValue === 'string' && /^\d+$/.test(rawValue) ? Number(rawValue) : NaN);
    if (!Number.isInteger(value) || value < 0 || value > max) {
        throw new Error(`Invalid ${key}: expected an integer from 0 to ${max}`);
    }
    return value;
};

const fz = {
    diy_zintercom_config: {
        cluster: 'closuresDoorLock',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (hasOwn(msg.data, 0x0050) && states[msg.data[0x0050]] !== undefined) {
                result.state = states[msg.data[0x0050]];
            }
            if (hasOwn(msg.data, 0x0051) && modes[msg.data[0x0051]] !== undefined) {
                Object.assign(result, modeState(Number(msg.data[0x0051])));
            }
            if (hasOwn(msg.data, 0x0052)) {
                const sound = ['OFF', 'ON'][msg.data[0x0052]];
                if (sound !== undefined) result.sound = sound;
            }
            for (const key of ['time_ring', 'time_talk', 'time_open', 'time_bell', 'time_report']) {
                if (hasOwn(msg.data, attributes[key])) result[key] = msg.data[attributes[key]];
            }
            return result;
        },
    },
};

const tz = {
    // Read-only state must never be passed to convertSet with an undefined payload.
    diy_zintercom_state: {
        key: ['state'],
        convertGet: readAttribute,
    },
    diy_zintercom_config: {
        key: ['mode', 'sound', 'once', 'always', 'drop', 'time_ring', 'time_talk', 'time_open', 'time_bell', 'time_report'],
        convertSet: async (entity, key, rawValue, meta) => {
            if (!hasOwn(attributes, key) || key === 'state') {
                throw new Error(`Property is not writable: ${key}`);
            }
            const isMode = key === 'mode' || hasOwn(modeSwitches, key);
            let value;
            if (hasOwn(modeSwitches, key) || key === 'sound') {
                if (rawValue !== 'ON' && rawValue !== 'OFF') {
                    throw new Error(`Invalid ${key}: expected ON or OFF`);
                }
                // As in the original, OFF on any mode switch selects Never.
                value = rawValue === 'OFF' ? 0 : (key === 'sound' ? 1 : modeSwitches[key]);
            } else if (key === 'mode') {
                value = modes.indexOf(rawValue);
                if (value === -1) value = toInteger(rawValue, key, 3);
            } else {
                value = toInteger(rawValue, key, 255);
            }

            const type = isMode ? 0x30 : (key === 'sound' ? 0x10 : 0x20);
            await entity.write('closuresDoorLock', {[attributes[key]]: {value, type}});

            // No extra read in the write path. This is optimistic state after the
            // write resolves; subsequent reports and explicit GETs remain authoritative.
            return {state: isMode ? modeState(value) : {[key]: key === 'sound' ? rawValue : value}};
        },
        convertGet: readAttribute,
    },
};

const device = {
    zigbeeModel: ['DIY_Zintercom'],
    model: 'DIYRuZ_Zintercom',
    vendor: 'DIYRuZ',
    description: '[Matrix intercom auto opener](https://diyruz.github.io/posts/zintercom/)',
    icon: 'https://raw.githubusercontent.com/diyruz/Zintercom/master/images/z2m.png',
    fromZigbee: [
        fromZigbeeConverters.battery,
        fz.diy_zintercom_config,
    ],
    toZigbee: [
        toZigbeeConverters.factory_reset,
        tz.diy_zintercom_state,
        tz.diy_zintercom_config,
    ],
    meta: {
        configureKey: 1,
    },
    configure: async (device, coordinatorEndpoint) => {
        const endpoint = device.getEndpoint(1);

        // Keep radio operations ordered and propagate failures to Zigbee2MQTT.
        await endpoint.bind('closuresDoorLock', coordinatorEndpoint);
        await endpoint.bind('genPowerCfg', coordinatorEndpoint);
        // Both battery attributes belong to one cluster: one request instead of two.
        await endpoint.configureReporting('genPowerCfg', [
            {attribute: 'batteryVoltage', minimumReportInterval: 0, maximumReportInterval: 3600, reportableChange: 0},
            {attribute: 'batteryPercentageRemaining', minimumReportInterval: 0, maximumReportInterval: 3600, reportableChange: 0},
        ]);
        await endpoint.configureReporting('closuresDoorLock', [{
            attribute: {ID: 0x0050, type: 0x30},
            minimumReportInterval: 0,
            maximumReportInterval: 3600,
            reportableChange: 0,
        }]);
    },
    exposes: [
        exposes.enum('state', ea.STATE_GET, ['Idle', 'Ring', 'Talk', 'Open', 'Drop'])
            .withDescription('Current state'),
        exposes.enum('mode', ea.ALL, ['Never', 'Once', 'Always', 'Drop'])
            .withDescription('Select open mode'),
        exposes.binary('sound', ea.ALL, 'ON', 'OFF').withProperty('sound')
            .withDescription('Enable or disable sound'),
        exposes.binary('once', ea.ALL, 'ON', 'OFF').withProperty('once')
            .withDescription('Enable or disable once mode'),
        exposes.binary('always', ea.ALL, 'ON', 'OFF').withProperty('always')
            .withDescription('Enable or disable always mode'),
        exposes.binary('drop', ea.ALL, 'ON', 'OFF').withProperty('drop')
            .withDescription('Enable or disable drop mode'),
        exposes.numeric('time_ring', ea.ALL).withUnit('sec')
            .withDescription('Time to ring before answer'),
        exposes.numeric('time_talk', ea.ALL).withUnit('sec')
            .withDescription('Time to hold before open'),
        exposes.numeric('time_open', ea.ALL).withUnit('sec')
            .withDescription('Time to open before end'),
        exposes.numeric('time_bell', ea.ALL).withUnit('sec')
            .withDescription('Time after last bell to finish ring'),
        exposes.numeric('time_report', ea.ALL).withUnit('min')
            .withDescription('Reporting interval'),
        ep.battery(),
    ],
};

module.exports = device;
