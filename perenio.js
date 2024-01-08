const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const extend = require('zigbee-herdsman-converters/lib/extend');
const e = exposes.presets;
const ea = exposes.access;

const fzlocal = {
    perenio_contact: {
      cluster: 'ssIasZone',
      type: 'commandStatusChangeNotification',
      convert: (model, msg, publish, options) => {
          return {contact: msg.data['zonestatus'] === 48}
      },
    },
};

const definition = {
    zigbeeModel: ['ZHA-DoorLockSensor\u0000'],
    model: 'PECWS01',
    vendor: 'LDS',
    description: 'Perenio Door & Window sensor',
    fromZigbee: [fzlocal.perenio_contact],
    toZigbee: [],
    exposes: [e.contact()],
};

module.exports = definition;
