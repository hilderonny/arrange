/* global AFRAME */

AFRAME.registerPrimitive('avt-log', {
  defaultComponents: {
    'avt-log': {}
  }
});

AFRAME.registerSystem('avt-log', {

  init: function () {
    var loggers = this.loggers = [];
    AFRAME.log = function(message) {
      while (message.length) {
        var part = message.substring(0, 80);
        message = message.substring(80);
        loggers.forEach(function(l) { l.log(part); });
      }
    };
  },
  registerLogger: function(logger) {
    this.loggers.push(logger);
  }
  
});

AFRAME.registerComponent('avt-log', {
  schema: {
    max: {default: 18}
  },

  init: function () {
    this.logs = [];
    this.system.registerLogger(this);
    this.textEl = document.createElement('a-entity');
    this.el.appendChild(this.textEl); 
    this.textEl.setAttribute('text', {color: 'lightgreen', baseline: 'top', align: 'left', xOffset: .01, wrapCount: 80, width: 2, font: 'sourcecodepro' });
    //this.textEl.object3D.position.x -= .5;
    this.textEl.object3D.position.y += .48;
    this.el.setAttribute('geometry', {primitive: 'plane', height: 1, width: 2 });
    this.el.setAttribute('material', {color: '#111', shader: 'flat'});
  },

  log: function (message) {
    var data = this.data, logs = this.logs;
    this.logs.push(message);
    if (data.max && logs.length > data.max) { logs.shift(); }
    this.textEl.setAttribute('text', { value: logs.join('\n') });
  }
  
});