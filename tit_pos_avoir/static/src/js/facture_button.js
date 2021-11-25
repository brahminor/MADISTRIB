odoo.define('tit_pos_avoir.RewardButton1', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const {useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    var rpc = require('web.rpc');
    class facturesPayee2 extends PosComponent {
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
            //cette fonction permet de charger les factures payée et etre redirigé vers la page de la liste associée
            var self = this;
            rpc.query({
                model: 'account.move',
                method: 'search_read',
                args: [[['payment_state','in',['paid']],['move_type','in',['out_invoice']],['state','!=','cancel']], []],
            }).then(function (factures_payees){
                self.env.pos.factures_payees = factures_payees;
                self.showScreen('FacturesPayee');
            });
        }                    
   }
    facturesPayee2.template = 'facturesPayee2';
    ProductScreen.addControlButton({
        component: facturesPayee2,
        condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(facturesPayee2);
   return facturesPayee2;
});