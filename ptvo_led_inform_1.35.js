const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');

const exposes = require('zigbee-herdsman-converters/lib/exposes');
const ea = exposes.access;
const e = exposes.presets;
const fz = zigbeeHerdsmanConverters.fromZigbee;
const tz = zigbeeHerdsmanConverters.toZigbee;

fz.ptvo_on_off = {
  cluster: 'genOnOff',
  type: ['attributeReport', 'readResponse'],
  convert: (model, msg, publish, options, meta) => {
      if (msg.data.hasOwnProperty('onOff')) {
          const channel = msg.endpoint.ID;
          const endpointName = `l${channel}`;
          const binaryEndpoint = model.meta && model.meta.binaryEndpoints && model.meta.binaryEndpoints[endpointName];
          const prefix = (binaryEndpoint) ? model.meta.binaryEndpoints[endpointName] : 'state';
          const property = `${prefix}_${endpointName}`;
	  if (binaryEndpoint) {
            return {[property]: msg.data['onOff'] === 1};
          }
          return {[property]: msg.data['onOff'] === 1 ? 'ON' : 'OFF'};
      }
  },
};

const switchTypesList = {
    'switch': 0x00,
    'single click': 0x01,
    'multi-click': 0x02,
    'reset to defaults': 0xff,
};

const switchActionsList = {
    on: 0x00,
    off: 0x01,
    toggle: 0x02,
};

const inputLinkList = {
    no: 0x00,
    yes: 0x01,
};

const bindCommandList = {
    'on/off': 0x00,
    'toggle': 0x01,
    'change level up': 0x02,
    'change level down': 0x03,
    'change level up with off': 0x04,
    'change level down with off': 0x05,
    'recall scene 0': 0x06,
    'recall scene 1': 0x07,
    'recall scene 2': 0x08,
    'recall scene 3': 0x09,
    'recall scene 4': 0x0A,
    'recall scene 5': 0x0B,
};

function getSortedList(source) {
    const keysSorted = [];
    for (const key in source) {
        keysSorted.push([key, source[key]]);
    }

    keysSorted.sort(function(a, b) {
        return a[1] - b[1];
    });

    const result = [];
    keysSorted.forEach((item) => {
        result.push(item[0]);
    });
    return result;
}

function getListValueByKey(source, value) {
    const intVal = parseInt(value, 10);
    return source.hasOwnProperty(value) ? source[value] : intVal;
}

const getKey = (object, value) => {
    for (const key in object) {
        if (object[key] == value) return key;
    }
};

tz.ptvo_on_off_config = {
    key: ['switch_type', 'switch_actions', 'link_to_output', 'bind_command'],
    convertGet: async (entity, key, meta) => {
        await entity.read('genOnOffSwitchCfg', ['switchType', 'switchActions', 0x4001, 0x4002]);
    },
    convertSet: async (entity, key, value, meta) => {
        let payload;
        let data;
        switch (key) {
        case 'switch_type':
            data = getListValueByKey(switchTypesList, value);
            payload = {switchType: data};
            break;
        case 'switch_actions':
            data = getListValueByKey(switchActionsList, value);
            payload = {switchActions: data};
            break;
        case 'link_to_output':
            data = getListValueByKey(inputLinkList, value);
            payload = {0x4001: {value: data, type: 32 /* uint8 */}};
            break;
        case 'bind_command':
            data = getListValueByKey(bindCommandList, value);
            payload = {0x4002: {value: data, type: 32 /* uint8 */}};
            break;
        }
        await entity.write('genOnOffSwitchCfg', payload);
    },
};

fz.ptvo_on_off_config = {
    cluster: 'genOnOffSwitchCfg',
    type: ['readResponse', 'attributeReport'],
    convert: (model, msg, publish, options, meta) => {
        const channel = getKey(model.endpoint(msg.device), msg.endpoint.ID);
        const {switchActions, switchType} = msg.data;
        const inputLink = msg.data[0x4001];
        const bindCommand = msg.data[0x4002];
        return {
            [`switch_type_${channel}`]: getKey(switchTypesList, switchType),
            [`switch_actions_${channel}`]: getKey(switchActionsList, switchActions),
            [`link_to_output_${channel}`]: getKey(inputLinkList, inputLink),
            [`bind_command_${channel}`]: getKey(bindCommandList, bindCommand),
        };
    },
};

function ptvo_on_off_config_exposes(epName) {
    const features = [];
    features.push(exposes.enum('switch_type', exposes.access.ALL,
        getSortedList(switchTypesList)).withEndpoint(epName));
    features.push(exposes.enum('switch_actions', exposes.access.ALL,
        getSortedList(switchActionsList)).withEndpoint(epName));
    features.push(exposes.enum('link_to_output', exposes.access.ALL,
        getSortedList(inputLinkList)).withEndpoint(epName));
    features.push(exposes.enum('bind_command', exposes.access.ALL,
        getSortedList(bindCommandList)).withEndpoint(epName));
    return features;
}

const ptvo_pattern_control = (endpoint) => {
  const control = exposes.switch().withState('state', true, 'Pattern auto-change').withEndpoint(endpoint);
  control.features.push(exposes.numeric(endpoint, ea.ALL).withDescription('Pattern number'));
  return control;
};

const ptvo_pattern_shortcut = (endpoint) => {
  const control = exposes.switch().withState('state', true, 'Activate pattern').withEndpoint(endpoint);
  control.features.push(exposes.numeric(endpoint, ea.ALL).withDescription('Pattern number'));
  return control;
};



const device = {
    zigbeeModel: ['ptvo_led_inform'],
    model: 'ptvo_led_inform',
    vendor: 'modkam.ru',
    description: '[Configurable firmware](https://ptvo.info/zigbee-configurable-firmware-features/)',
    fromZigbee: [fz.ignore_basic_report, fz.ptvo_switch_analog_input, fz.brightness, fz.ptvo_on_off, fz.color_colortemp, fz.ptvo_on_off_config,],
    toZigbee: [tz.ptvo_switch_trigger, tz.on_off, tz.ptvo_switch_analog_input, tz.ptvo_switch_light_brightness, tz.light_color, tz.ptvo_on_off_config,],
    exposes: [e.light_brightness_colorxy().withEndpoint('l1'),
      ptvo_pattern_control('l2'),
      ptvo_pattern_shortcut('l3'),
      ptvo_pattern_shortcut('l4'),
      ptvo_pattern_shortcut('l5'),
      ptvo_pattern_shortcut('l6'),
      ptvo_pattern_shortcut('l7'),
      ptvo_pattern_shortcut('l8'),
],
    meta: {
        multiEndpoint: true,
        enhancedHue: false, 
    },
    endpoint: (device) => {
        return {
            l1: 1, l2: 2, l3: 3, l4: 4, l5: 5, l6: 6, l7: 7, l8: 8,
        };
    },
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAEQCAMAAABP1NsnAAADAFBMVEX////////////96on96ob964r96oj96ob964n96on35Yvs3I396YL96oT96oL86ID96H3953j75nP75XD75W385Gn74mX74WH64V/74Fz74Fv74Fn63lf63lT53FT421L42lD521H210n21kf32Er32Ez42k342U342k7qzk3XvkvDqzq+pjm0njmijTawmjrAsWG/tYDRy7G9t6e1saOxrZ6rp5mopZOloZKkooygnI2hnoedmoaal4OXkoGUkXuRjXqNiHeLiHCFgG1+eWeFdC51cGBtZ1hiXlBjWDBXUkVQSztIRDhFPiQ+OjA4NCozLyYuKyExKxUpJx0mIxcjIRYfHRMZFw8SEAkMCwYJCAQFBQICAgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/f3+AgICBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7////Xvw2SAAABAHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AU/cHJQAAAAlwSFlzAAALEwAACxMBAJqcGAAAQNFJREFUeAHs0kEOgjAQhlGP1TRMASHUCPH+t1G2rTeA9y3/3bzM46smIECAAAECBAgQIECAAAECBAgQIEAEBAgQIECAAAEC5I4gQIAAAQIEiIAAAQIECBAgQIDUrd4Y5OiHfZzGMnbja30u9Q4gdZ7n7tAtR4nUjp9SYsjr9UHWcn5D7O02RJTUHr9HxJBy91vv43IgU5weuf6BRFp+1JjpkqM4EIRfaTe2DRh0gCEEIQgBge0+Zp7B7/9zM0vy4fm7M73dNeBDY7elT1lZBc8ZoxUUUoYnJdVQTfOtgbiu+yU9rAaRsn99AiIp87TS10GVSpfFoyKmwSpV8HPfFkhX17V168PIapWhQh7HfnTKaF2a94exhQrRZe4fs4hAyqL8vkC8MdbqfnwEYpgepQtPQCpjTKnfLrehSxgUUyYbHngACDSTF4/fHVzn/LcB4pQ21vRjeACixUBdeL9ccfz4ABBtyvL88c74+Pjx8+fsNS0k7+9JJECgkOIBsO8b2Er3XYAgFQwVMj6kgq4ACQo5/3x/PZ9Ox9PpdO4qOMu+XM6nI+LEU4AolbubasI0eVsByEMaTb43wFb4LwpkHIanetpy8XaYprtEZk0P2buwnmKccdJUTVkE4RFjGTUj794+fsoX36YQfK30I5DFj0ONkaL5mkC6w6HphvkBiIpAwnS+esOsAMTs3bzceZwkZVQxnW88thVAkAxZc9y24+n1/TLOcxhrRYUMt4QZR98Qkf6SQHpr69p5v91GDhXl0AdE2ubzpGCgtnDLwmRJ0RGSysdHIBOBlHmzSazbvABIo7l8d+UxTQIkz8ovCaSBxG0/TvesqSstQOYQzpfLG9Z7DkphrHLruj0B0fYZyDaRkcrtmogsyzJPAiTrUoJOCN8oACnWh0ugpnZfA0gNe7D9NN2InG3F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',
};

module.exports = device;
