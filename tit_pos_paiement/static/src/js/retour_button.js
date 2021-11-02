odoo.define('tit_pos_cmd_facture.retour_button', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const {useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
     
    class retour_button extends PosComponent {
        constructor() {
           super(...arguments);
           useListener('click', this.onClick);
        }
        is_available() {
           const order = this.env.pos.get_order();
           
           return order
        }

        async onClick() {
            var order = this.env.pos.get_order();
            if (order && order.get_selected_orderline()) {
                var qty = order.get_selected_orderline().get_quantity();
                order.get_selected_orderline().set_quantity(-1 * qty)            
            }
            
       }
   }
    retour_button.template = 'retour_button';
    ProductScreen.addControlButton({
        component: retour_button,
        condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(retour_button);
   return retour_button;
});