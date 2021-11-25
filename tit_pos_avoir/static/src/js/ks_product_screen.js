odoo.define('tit_pos_avoir.ks_product_screen', function (require) {
    "use strict";
    const KsProductScreen = require('point_of_sale.ProductScreen');
    const ks_utils = require('ks_pos_low_stock_alert.utils');
    const Registries = require('point_of_sale.Registries');
    var rpc = require('web.rpc');
    const ks_product_screen = (KsProductScreen) =>
        class extends KsProductScreen {
            _onClickPay() {
                //fonction associée au bouton paiement affiché dans la page de saisie d'une cmd
                var self = this;
                var order = self.env.pos.get_order();
                if(ks_utils.ks_validate_order_items_availability(self.env.pos.get_order(), self.env.pos.config)) {
                    var has_valid_product_lot = _.every(order.orderlines.models, function(line){
                        return line.has_valid_product_lot();
                    });
                    if(!has_valid_product_lot){
                        self.showPopup('ConfirmPopup',{
                            'title': _t('Empty Serial/Lot Number'),
                            'body':  _t('One or more product(s) required serial/lot number.'),
                            confirm: function(){
                                self.showScreen('PaymentScreen');
                            },
                        });
                    } else{
                        if (order.avoir_facture === undefined){
                            //ie c'est une commande normale donc redirection vers la page du paiement
                            this.showScreen('PaymentScreen');
                        }
                        else{
                            //ie c'est une facture avoir client donc redirection vers la page d'enregistrement du paiement de la facture en paramètre
                            var self_3 = this;var avoir_client_result = 0
                            rpc.query({
                                model: 'account.move',
                                method: 'get_avoir_client',
                                args: [order.partner_id[0]],
                            }).then(function (r){
                                avoir_client_result = r
                           

                            self_3.props.facture_selected = {
                                'id': order.avoir_facture,
                                'reference': order.reference,
                                'move_type': 'out_refund',
                                'amount_total': order.amount_total,
                                'amount_residual': order.amount_total,
                                'partner_id': order.partner_id,
                                'avoir_client': avoir_client_result
                            };
                            var lignes_produits = [];
                            for(var i = 0; i < self_3.env.pos.get_order().get_orderlines().length; i++){
                                lignes_produits.push([self_3.env.pos.get_order().get_orderlines()[i].id, self_3.env.pos.get_order().get_orderlines()[i].quantity]); 
                            }
                            if (lignes_produits.length > 0){
                                rpc.query({
                                    model: 'account.move',
                                    method: 'update_avoir',
                                    args: [self_3.env.pos.get_order().avoir_facture, lignes_produits],
                                }).then(function (){
                                let facture_brouillon_id = rpc.query({
                                    model: 'account.move',
                                    method: 'action_post',
                                    args: [self_3.env.pos.get_order().avoir_facture]
                                }).then(function (u) {
                                    self_3.showScreen('FactureSavePaiement', { facture_selected: self_3.props.facture_selected });
                                
                                });
                            });
                            }
                        });
                    }        
                    }
                }
        }
    };
    Registries.Component.extend(KsProductScreen,ks_product_screen);
    return KsProductScreen;
    });