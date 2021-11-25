odoo.define('tit_pos_cmd_facture.retour_button', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const { parse } = require('web.field_utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const {useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const { sprintf } = require('web.utils');
     
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
            /*cette fonction permet de calculer la remise associée au nouveau prix de vente
            saisi par l'utilisateur et le mettre en dessous du produit dans la ligne de commande
            pos et le nouveau prix de vente sera affiché aussi*/

            var self = this;
            var order = this.env.pos.get_order();
            if (order && order.get_selected_orderline()) {
                var prix_principale = order.get_selected_orderline().price;
                var order_selecte_ligne = order.get_selected_orderline()
                //Appliquer un acompte (%)
                    let pv_nouv = prix_principale;
                    const { confirmed, payload } = await this.showPopup('NumberPopup', {
                        title: sprintf(this.env._t("Prix vente %s"), this.env.pos.format_currency(prix_principale)),
                        startingValue: 0,
                    });
                    if (confirmed){
                        {
                            pv_nouv = parse.float(payload);
                            if(pv_nouv <= prix_principale){
                                order.get_selected_orderline().set_discount(100 - (pv_nouv*100)/prix_principale)      
                            }
                            else{
                                self.showPopup('ErrorPopup', {
                                    title: self.env._t('Erreur'),
                                    body: self.env._t("La valeur saisie est supérieur au prix de vente !\n Veuillez saisir un montant inférieur ou égale au prix de vente du produit"),
                                });
                                return;
                                }
                        }
                    }
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