odoo.define('tit_pos_cmd_facture.RewardButton2', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const {useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    var rpc = require('web.rpc');
    
    class facturesNonPayee2 extends PosComponent {
        constructor() {
           super(...arguments);
           useListener('click', this.onClick);
        }
        is_available() {
           const order = this.env.pos.get_order();
           
           return order
        }

        async onClick() {       
           this.reload_cmd_en_attente();
        }

        reload_cmd_en_attente(){
            var self = this;
            rpc.query({
                model: 'account.move',
                method: 'search_read',
                args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel'],['invoice_date_due', '<=',new Date()]], []],
            }).then(function (factures_non_payees){
                self.env.pos.factures_non_payees = factures_non_payees;
                self.showScreen('FacturesNonPayee');
            });
        }                    
   }
    facturesNonPayee2.template = 'facturesNonPayee2';
    ProductScreen.addControlButton({
        component: facturesNonPayee2,
        condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(facturesNonPayee2);
   return facturesNonPayee2;
});