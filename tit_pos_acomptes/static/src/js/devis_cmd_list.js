odoo.define('tit_pos_acomptes.devis_cmd_list', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const {useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    var rpc = require('web.rpc');
    class devis_cmd_list extends PosComponent {
        constructor() {
           super(...arguments);
           useListener('click', this.onClick);
        }
        async onClick() {       
           this.reload_sale_orders();
        }
        reload_sale_orders(){
            /*cette fonction permet de recharger la liste des sales order non annulées
            et non bloquées et qui ne sont pas encore transférées totalement vers le pos
            */
            var self = this;
            rpc.query({
                model: 'sale.order',
                method: 'search_read',
                args: [[['state', 'in', ['sale']], ['trait_tot', '=', false]], []],
            }).then(function (sales_orders){
                self.env.pos.sale_orders = sales_orders;
                self.showScreen('SaleOrderManagementScreen');
            });
        }        
   }
    devis_cmd_list.template = 'devis_cmd_list';
    ProductScreen.addControlButton({
        component: devis_cmd_list,
        condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(devis_cmd_list);
   return devis_cmd_list;
});