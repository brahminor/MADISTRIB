odoo.define('tit_pos_order.profileButtons', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const {useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const {update_css}= require('tit_pos_order.CustomCashierScreen')
    const {verif_groupe} = require('tit_pos_order.verif_group_user')

    var rpc = require('web.rpc');
    class profileButtons extends PosComponent {
        constructor() {
           super(...arguments);
           useListener('click', this.onClick);
        } 

        async onClick() {
            var self = this;
           //aficher le profile de l'utilisateur connecté
           
           self.showScreen('profile_page');
        }  
   }
    profileButtons.template = 'profileButtons';
    ProductScreen.addControlButton({
        component: profileButtons,
        condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(profileButtons);
   return profileButtons;
});