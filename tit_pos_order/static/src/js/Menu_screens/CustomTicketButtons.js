odoo.define('tit_pos_order.CustomTicketButtons', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    var rpc = require('web.rpc');
    
    class CustomTicketButtons extends PosComponent {
        
        constructor () { 
           super (... arguments); 
           useListener ('click', this.onClick); 
        } 

        onClick() {
            this.reload_cmd_en_attente();
        }
        reload_cmd_en_attente(){
                        /*
                        cette fonction permet d'actualiser la page des acomptes
                        et faire appel à la fct d'actualisation de la page des cmd
                        validées par vendeur
                        @param: commande_ancienne : id de la commande qu'elle était coura,te
                        */
                        var self = this; 
                        rpc.query({
                            model: 'pos.commande',
                            method: 'search_read',
                            args: [[['state','=','en_attente']], []],
                        })
                        .then(function (orders){
                            self.env.pos.commandes = orders;
                            rpc.query({
                            model: 'pos.payment_cmd',
                            method: 'search_read',
                            args: [[['pos_commande_id.state', '=', 'en_attente']], []],
                        })
                        .then(function (payment_cmd_lines_result){
                            self.env.pos.payment_cmd_lines = payment_cmd_lines_result;
                        rpc.query({
                            model: 'pos.commande.line',
                            method: 'search_read'
                            })
                        .then(function (orders_lines){
                            self.env.pos.commandes_lines = orders_lines;
                            
                            self.showScreen('TicketScreenEnAttente');
                        }); }); });

                        /// tester  actualisation de la page de cmd en attente////
        }
           
    }
    CustomTicketButtons.template = 'CustomTicketButtons';
    Registries.Component.add(CustomTicketButtons);
    return CustomTicketButtons;
});