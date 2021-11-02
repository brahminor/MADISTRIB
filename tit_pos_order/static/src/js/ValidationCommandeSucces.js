odoo.define('tit_pos_order.ValidationCommandeSucces', function(require) {
   'use strict';
      const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
      const Registries = require('point_of_sale.Registries');
      const PosComponent = require('point_of_sale.PosComponent');
      const ControlButtonsMixin = require('point_of_sale.ControlButtonsMixin');
      const NumberBuffer = require('point_of_sale.NumberBuffer');
      const { useListener } = require('web.custom_hooks');
      const { onChangeOrder, useBarcodeReader } = require('point_of_sale.custom_hooks');
      const { useState } = owl.hooks;
      class ValidationCommandeSucces extends AbstractAwaitablePopup {
         constructor() {
            super(...arguments);
         }
       }
      //Create popup
      ValidationCommandeSucces.template = 'ValidationCommandeSucces';
      Registries.Component.add(ValidationCommandeSucces);
      return ValidationCommandeSucces;
});