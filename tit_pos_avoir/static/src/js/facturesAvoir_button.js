odoo.define('tit_pos_avoir.RewardButton3', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const {useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    var rpc = require('web.rpc');
    class facturesAvoir2 extends PosComponent {
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
            //cette fonction permet de charger les factures avoir client et etre redirigé vers la page de la liste associée
            var self = this;
            rpc.query({
                model: 'account.move',
                method: 'search_read',
                args: [[['payment_state','in',['not_paid', 'partial']],['move_type','in',['out_refund']],['state','!=','cancel']], []],
            }).then(function (factures_avoirs){
                self.env.pos.factures_avoirs = factures_avoirs;
                rpc.query({
                    model: 'account.move.line',
                    method: 'search_read',
                    args: [[['move_id.payment_state','in',['not_paid', 'partial']],['move_id.move_type','in',['out_refund']],['move_id.state','!=','cancel']], []],
                }).then(function (factures_avoirs_lines){    
                    self.factures_avoirs_lines = factures_avoirs_lines;
                    self.showScreen('FacturesAvoir');
                });
            });
        }                    
   }
    facturesAvoir2.template = 'facturesAvoir2';
    ProductScreen.addControlButton({
        component: facturesAvoir2,
        condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(facturesAvoir2);
   return facturesAvoir2;
});