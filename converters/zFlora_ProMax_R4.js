const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const e = exposes.presets;
const ea = exposes.access;

const tzLocal = {
    node_config: {
        key: ['read_sensors_delay', 'poll_rate_on', 'tx_radio_power'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                read_sensors_delay: ['genPowerCfg', {0x0201: {value, type: 0x21}}],
				poll_rate_on: ['genPowerCfg', {0x0216: {value, type: 0x10}}],
				tx_radio_power: ['genPowerCfg', {0x0236: {value, type: 0x28}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	node_debug: {
        key: ['lower_level', 'upper_level'],
        convertSet: async (entity, key, rawValue, meta) => {
            const lookup = {'OFF': 0x00, 'ON': 0x01};
            const value = lookup.hasOwnProperty(rawValue) ? lookup[rawValue] : parseInt(rawValue, 10);
            const payloads = {
                lower_level: ['msSoilMoisture', {0x0502: {value, type: 0x21}}],
				upper_level: ['msSoilMoisture', {0x0503: {value, type: 0x21}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
	temperaturef_config: {
        key: ['temperature_offset', 'temperature_compensation'],
        convertSet: async (entity, key, rawValue, meta) => {
            const value = parseFloat(rawValue)*10;
            const payloads = {
                temperature_offset: ['msTemperatureMeasurement', {0x0410: {value, type: 0x29}}],
				temperature_compensation: ['msTemperatureMeasurement', {0x0504: {value, type: 0x10}}],
            };
            await entity.write(payloads[key][0], payloads[key][1]);
            return {
                state: {[key]: rawValue},
            };
        },
    },
};

const fzLocal = {
    node_config: {
        cluster: 'genPowerCfg',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0201)) {
                result.read_sensors_delay = msg.data[0x0201];
            }
			if (msg.data.hasOwnProperty(0x0216)) {
                result.poll_rate_on = ['OFF', 'ON'][msg.data[0x0216]];
            }
			if (msg.data.hasOwnProperty(0x0236)) {
                result.tx_radio_power = msg.data[0x0236];
            }
            return result;
        },
    },
	node_debug: {
        cluster: 'msSoilMoisture',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
			if (msg.data.hasOwnProperty(0x0502)) {
                result.lower_level = msg.data[0x0502];
            }
			if (msg.data.hasOwnProperty(0x0503)) {
                result.upper_level = msg.data[0x0503];
            }
            return result;
        },
    },
	temperaturef_config: {
        cluster: 'msTemperatureMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty(0x0410)) {
                result.temperature_offset = parseFloat(msg.data[0x0410])/10.0;
            }
			if (msg.data.hasOwnProperty(0x0504)) {
                result.temperature_compensation = ['OFF', 'ON'][msg.data[0x0504]];
            }
            return result;
        },
    },
	uptime: {
        cluster: 'genTime',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            //return {uptime: Math.round(msg.data.localTime/60)};
			if (msg.data.hasOwnProperty('standardTime')) {
				return {uptime: Math.round(msg.data.standardTime/60/60)};
			}
        },
    },
    illuminance: {
        cluster: 'msIlluminanceMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty('measuredValue')) {
                const illuminance_raw = msg.data['measuredValue'];
                const illuminance = illuminance_raw === 0 ? 0 : Math.pow(10, (illuminance_raw - 1) / 10000);
                result.illuminance = illuminance;
                result.illuminance_raw = illuminance_raw;
                }
            return result;
        },
    },
    illuminance: {
        cluster: 'msIlluminanceMeasurement',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            const result = {};
            if (msg.data.hasOwnProperty('measuredValue')) {
                const illuminance_raw = msg.data['measuredValue'];
                const illuminance = illuminance_raw === 0 ? 0 : Math.pow(10, (illuminance_raw - 1) / 10000);
                result.illuminance = illuminance;
                result.illuminance_raw = illuminance_raw;
                }
            return result;
        },
    },
};

const definition = {
        zigbeeModel: ['zFlora_ProMax'],
        model: 'zFlora_ProMax',
        vendor: 'Custom devices (DiY)',
        description: '[Plant watering sensor zFlora_ProMax with signal amplifier](http://efektalab.com/PWS_Max)',
        fromZigbee: [fz.temperature, fz.humidity, fzLocal.illuminance, fz.soil_moisture, fz.battery, fzLocal.node_config, fzLocal.temperaturef_config, fzLocal.node_debug, fzLocal.uptime],
        toZigbee: [tz.factory_reset, tzLocal.node_config, tzLocal.temperaturef_config, tzLocal.node_debug],
        configure: async (device, coordinatorEndpoint, logger) => {
            const firstEndpoint = device.getEndpoint(1);
            await reporting.bind(firstEndpoint, coordinatorEndpoint, [
                'genTime', 'genPowerCfg', 'msTemperatureMeasurement', 'msRelativeHumidity', 'msSoilMoisture', 'msIlluminanceMeasurement']);
			const overrides1 = {min: 3600, max: 43200, change: 1};
			const overrides2 = {min: 0, max: 3600, change: 10};
			const overrides3 = {min: 0, max: 3600, change: 10};
			const overrides4 = {min: 0, max: 3600, change: 10};
			const overrides5 = {min: 0, max: 21600, change: 100};
            await reporting.batteryVoltage(firstEndpoint, overrides1);
            await reporting.batteryPercentageRemaining(firstEndpoint, overrides1);
			await reporting.batteryAlarmState(firstEndpoint, overrides1);
            await reporting.temperature(firstEndpoint, overrides2);
            await reporting.humidity(firstEndpoint, overrides3);
            await reporting.illuminance(firstEndpoint, overrides4);
            await reporting.soil_moisture(firstEndpoint, overrides5);
        },
		icon: 'data:image/jpeg;base64,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R3JuIGRvdWJAb+AAAAAAAAAAAABCbCAgZG91YkBv4AAAAAAAAAAAAEJyZFRVbnRGI1JsdAAAAAAAAAAAAAAAAEJsZCBVbnRGI1JsdAAAAAAAAAAAAAAAAFJzbHRVbnRGI1B4bEBSAAAAAAAAAAAACnZlY3RvckRhdGFib29sAQAAAABQZ1BzZW51bQAAAABQZ1BzAAAAAFBnUEMAAAAATGVmdFVudEYjUmx0AAAAAAAAAAAAAAAAVG9wIFVudEYjUmx0AAAAAAAAAAAAAAAAU2NsIFVudEYjUHJjQFkAAAAAAAAAAAAQY3JvcFdoZW5QcmludGluZ2Jvb2wAAAAADmNyb3BSZWN0Qm90dG9tbG9uZwAAAAAAAAAMY3JvcFJlY3RMZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQPyAAAAAAAKAAD///////8AADhCSU0EDQAAAAAABAAAAFo4QklNBBkAAAAAAAQAAAAeOEJJTQPzAAAAAAAJAAAAAAAAAAABADhCSU0nEAAAAAAACgABAAAAAAAAAAE4QklNA/UAAAAAAEgAL2ZmAAEAbGZmAAYAAAAAAAEAL2ZmAAEAoZmaAAYAAAAAAAEAMgAAAAEAWgAAAAYAAAAAAAEANQAAAAEALQAAAAYAAAAAAAE4QklNA/gAAAAAAHAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAOEJJTQQIAAAAAAAQAAAAAQAAAkAAAAJAAAAAADhCSU0EHgAAAAAABAAAAAA4QklNBBoAAAAAA0sAAAAGAAAAAAAAAAAAAACWAAAAlgAAAAsAegBGAGwAbwByAGEAXwBQAHIAbwAyAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAACWAAAAlgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAABAAAAABAAAAAAAA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LmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzE0MiA3OS4xNjA5MjQsIDIwMTcvMDcvMTMtMDE6MDY6MzkgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMDItMjFUMjM6MTk6MTIrMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMTItMDZUMTY6MDY6MDErMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTEyLTA2VDE2OjA2OjAxKzAzOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmUwNmMwYzljLTlhOTQtZjg0Yi1hODdkLWVhNjA4NjMzOWNlOCIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjU5YTU5MjU2LWY4ODctY2E0Ni05NzUxLTcxMmM5MGExNWJkNyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjk1NjdkNDM4LTIzYzMtYTk0OS1iYzExLWMxOWZkZGRlYWNiNSIgcGhvdG9zaG9wOkxlZ2FjeUlQVENEaWdlc3Q9IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0iIiBkYzpmb3JtYXQ9ImltYWdlL2pwZWciPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjk1NjdkNDM4LTIzYzMtYTk0OS1iYzExLWMxOWZkZGRlYWNiNSIgc3RFdnQ6d2hlbj0iMjAyMy0wMi0yMVQyMzoxOToxMiswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjNGFhNjcwMS1mMGU0LWM2NDQtYjFlMC1jMmRhOWU1YWE4ZDIiIHN0RXZ0OndoZW49IjIwMjMtMDItMjFUMjM6MTk6MTIrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ZTA2YzBjOWMtOWE5NC1mODRiLWE4N2QtZWE2MDg2MzM5Y2U4IiBzdEV2dDp3aGVuPSIyMDIzLTEyLTA2VDE2OjA2OjAxKzAzOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDxyZGY6QmFnPiA8cmRmOmxpPkIwRkZENUZCMEQ2QzRFQkEwOUQ5MDI5OUNGRDUxQUFFPC9yZGY6bGk+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjkxN2EwMWFiLTBhNTAtMDM0Zi05MDcyLTdjZjA1NzU3NTA5MzwvcmRmOmxpPiA8L3JkZjpCYWc+IDwvcGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/+4AIUFkb2JlAGRAAAAAAQMAEAMCAwYAAAAAAAAAAAAAAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQECAgICAgICAgICAgMDAwMDAwMDAwMBAQEBAQEBAQEBAQICAQICAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA//CABEIAJYAlgMBEQACEQEDEQH/xADFAAEAAgEEAwEAAAAAAAAAAAAACgsJAQQHCAIDBQYBAQACAwEAAAAAAAAAAAAAAAAEBQEDBgIQAAECBAYDAQEAAwAAAAAAAAECAzAEBggAERIFBwkQEwoxIRYYGREAAQQBAwMCBQIDBgcAAAAAAQIDBAUGERIHACEIMRMwQVEiFDIVYXEjQJGhwSQJ8IHhMzQlFhIAAQEEBgkDBAIDAAAAAAAAAREA8CECEDAxQVFhcYGRobHB0RIiIDIDQOHxI0ITktIz/9oADAMBAQIRAxEAAACeRU8iAAAABozFwl2/aDzrz4x67THgAAAAAADGpunVQNh0HxzLt51WTFfz/bPXGAAAAAAPVXtZdJhi2SB6y1mrucyi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',
        exposes: [e.soil_moisture(), e.battery(), e.battery_low(), e.battery_voltage(), e.temperature(), e.humidity(), e.illuminance(),
		    exposes.numeric('read_sensors_delay', ea.STATE_SET).withUnit('Minutes').withDescription('Adjust Report Delay. Setting the time in minutes, by default 30 minutes')
                .withValueMin(1).withValueMax(360),
			exposes.enum('tx_radio_power', ea.STATE_SET, [0, 4, 10, 19]).withDescription('Set TX Radio Power)'),
			exposes.binary('poll_rate_on', ea.STATE_SET, 'ON', 'OFF').withDescription('Poll rate on off'),
			exposes.numeric('uptime', ea.STATE).withUnit('Hours').withDescription('Uptime'),
			exposes.numeric('lower_level', ea.STATE_SET).withUnit('%').withDescription('The lower level of soil moisture 0% is:')
                .withValueMin(0).withValueMax(100),
			exposes.numeric('upper_level', ea.STATE_SET).withUnit('%').withDescription('The upper level of soil moisture 100% is:')
                .withValueMin(0).withValueMax(100),
			exposes.binary('temperature_compensation', ea.STATE_SET, 'ON', 'OFF').withDescription('Temperature compensation'),
		    exposes.numeric('temperature_offset', ea.STATE_SET).withUnit('°C').withValueStep(0.1).withDescription('Adjust temperature')
                .withValueMin(-50.0).withValueMax(50.0)],
};

module.exports = definition;
