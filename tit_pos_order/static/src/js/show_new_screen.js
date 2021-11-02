odoo.define('tit_pos_order.RewardButton2', function(require) {
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
    class CustomRewardButtons2 extends PosComponent {
        constructor() {
           super(...arguments);
           verif_groupe()//vérifier groupe de l'utilisateur connecté sur pos
           useListener('click', this.onClick);
        }

        is_available() {
           const order = this.env.pos.get_order();
           
           return order
        }
        reload_cmd_en_attente(){
            
                        /// tester  actualisation de la page de cmd en attente////
                        var self = this; 
                        
                        rpc.query({
                            model: 'pos.cmd_vendeur',
                            method: 'search_read',
                            args: [[['state','=','en_attente'],['config_id','=',self.env.pos.config_id]], []],
                        })
                        .then(function (orders){
                            self.env.pos.cmd_vendeur = orders;
                            rpc.query({
                            model: 'pos.cmd_vendeur.line',
                            method: 'search_read'
                            })
                        .then(function (orders_lines){
                            self.env.pos.cmd_vendeur_lines = orders_lines;

                        }); }); 
                        /// tester  actualisation de la page de cmd en attente////
        } 

        async onClick() {
           /*
           Fonction pour créer la commande validée par le vendeur
           */
           const order = this.env.pos.get_order();
            if (order.attributes.client == null){
                return this.showPopup('ErrorPopup', {
                      title:('Le choix du client est requis'),
                      body:('Veuillez définir le client s.v.p ! ')
                    });
            }
            else{

                if (order.orderlines.models.length <= 0){
                    return this.showPopup('ErrorPopup', {
                      title:('Produit monquant'),
                      body:('Veuillez définir au  moins un produits.v.p ! ')
                    });
                }
                else{
                try {
                    let fields = {}
                    fields['id'] = order.attributes.client.id
                    // vérifier si le client a atteind déjà la limite de crédit ou pas
                    let limite_atteind = await this.rpc({
                        model: 'res.partner',
                        method: 'utilsateur_atteind_limite',
                        args: [fields],
                    });
                    
                    if(limite_atteind > 0){
                        // le cas ou la limite de crédit est atteind
                        const { confirmed } = await this.showPopup('ValidationCommandePopup', {
                            title : this.env._t("Limite de crédit "),
                            body : this.env._t('La limite de crédit est dépassée pour ce client'),
                            confirmText: this.env._t("OK"),
                            cancelText: this.env._t("Annuler"),
                        });
                        if (confirmed) {
                            //traitement associé à la confirmation de l'alerte de dépassement de la limite
                            
                            var l =this;
                            const order = this.env.pos.get_order();
                            var commande_ancienne = order.commande_id
                                //traitement associé à la confirmation de l'alerte de dépassement de la limite
                                let fields = {}
                                fields['id'] = order.attributes.client.id
                                fields['partner_id'] = order.attributes.client.id
                                fields['session_id'] = order.pos_session_id
                                fields['vendeur_name'] = l.env.pos.get_cashier().name
                                //création de la commande validée par le vendeur
                                let commandeId = await this.rpc({
                                    model: 'pos.cmd_vendeur',
                                    method: 'create_commande',
                                    args: [fields],
                                }).then(function (commande_id) {
                                    //création des lignes de commandes associé à la cmd 
                                    for (let i=0; i<order.orderlines.models.length ; i++){
                                        let commandeLineId = rpc.query({
                                            model: 'pos.cmd_vendeur.line',
                                            method: 'create_commande_line',
                                            args: [{
                                                'order_id' : commande_id,
                                                'qty' : order.orderlines.models[i].quantity,
                                                'product_id' : order.orderlines.models[i].product.id,
                                                'price_unit' : order.orderlines.models[i].price,
                                                'discount' : order.orderlines.models[i].discount,
                                                'tax_ids' : order.orderlines.models[i].product.taxes_id,
                                            }]
                                            });
                                        }
                                        //modifier l'état de la commande courante
                                        rpc.query({
                                            model: 'pos.cmd_vendeur',
                                            method: 'delete_ancienne_cmd',
                                            args: [{
                                                'commande_ancienne': commande_ancienne, 
                                                }]
                                            }).then(function(u){
                                                l.reload_cmd_en_attente();
                                           })
                                    });
                                    
                                    Gui.showPopup("ValidationCommandeSucces", {
                                       title : this.env._t("La commande est validée avec succès"),
                                           confirmText: this.env._t("OK"),
                                    });
                                    /*créer une nouvelle commande (pour etre redirigé vers une nouvelle
                                    interface de commande et le tous soit à 0)
                                    */
                                    this.env.pos.delete_current_order();
                                    if (this.props.isTicketScreenShown) {
                                        posbus.trigger('ticket-button-clicked');
                                    } else {
                                        this.showScreen('TicketScreen');
                                    }
                               // fin de partie d'ajout de cmd validée par vendeur 
                        }        
                    }
                    else{
                        // le cas ou la limite de crédit n'est pas atteind
                    
                            var l =this;
                            const order = this.env.pos.get_order();
                            var commande_ancienne = order.commande_id
                                //traitement associé à la confirmation de l'alerte de dépassement de la limite
                                let fields = {}
                                fields['id'] = order.attributes.client.id
                                fields['partner_id'] = order.attributes.client.id
                                fields['session_id'] = order.pos_session_id
                                fields['vendeur_name'] = l.env.pos.get_cashier().name
                                //création de la commande en attente
                                let commandeId = await this.rpc({
                                    model: 'pos.cmd_vendeur',
                                    method: 'create_commande',
                                    args: [fields],
                                }).then(function (commande_id) {
                                    //création des lignes de commandes associé à la cmd 
                                    for (let i=0; i<order.orderlines.models.length ; i++){
                                        let commandeLineId = rpc.query({
                                            model: 'pos.cmd_vendeur.line',
                                            method: 'create_commande_line',
                                            args: [{
                                                'order_id' : commande_id,
                                                'qty' : order.orderlines.models[i].quantity,
                                                'product_id' : order.orderlines.models[i].product.id,
                                                'price_unit' : order.orderlines.models[i].price,
                                                'discount' : order.orderlines.models[i].discount,
                                                'tax_ids' : order.orderlines.models[i].product.taxes_id,
                                            }]
                                            });
                                        }
                                        rpc.query({
                                            model: 'pos.cmd_vendeur',
                                            method: 'delete_ancienne_cmd',
                                            args: [{
                                                'commande_ancienne': commande_ancienne, 
                                                }]
                                            }).then(function(u){
                                                l.reload_cmd_en_attente();
                                           })
                                    });
                                    
                                    Gui.showPopup("ValidationCommandeSucces", {
                                       title : this.env._t("La commande est validée avec succès"),
                                           confirmText: this.env._t("OK"),
                                    });
                                    /*créer une nouvelle commande (pour etre redirigé vers une nouvelle
                                    interface de commande et le tous soit à 0)
                                    */ 
                                    this.env.pos.delete_current_order();
                                    if (this.props.isTicketScreenShown) {
                                        posbus.trigger('ticket-button-clicked');
                                    } else {
                                        this.showScreen('TicketScreen');
                                    }
                               // fin de partie d'ajout de cmd validée par vendeur
                        }

                } catch (error) {
                    if (error.message.code < 0) {
                        await this.showPopup('OfflineErrorPopup', {
                            title: this.env._t('Offline'),
                            body: this.env._t('Unable to save changes.'),
                        });
                    } else {
                        throw error;
                    }
                }}
            }
           //----------------------------------------
           
                  } 
       /**//////////////////////////*********************************
   }
    CustomRewardButtons2.template = 'CustomRewardButtons2';
    ProductScreen.addControlButton({
        component: CustomRewardButtons2,
        condition: function() {
           return this.env.pos;
       },
   });
   Registries.Component.add(CustomRewardButtons2);
   return CustomRewardButtons2;
});