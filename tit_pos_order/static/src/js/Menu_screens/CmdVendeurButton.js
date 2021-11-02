odoo.define('tit_pos_order.CmdVendeurButton', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    var rpc = require('web.rpc');

    class CmdVendeurButton extends PosComponent {
        
        constructor () { 
           super (... arguments); 
           useListener ('click', this.onClick); 
        } 

        onClick() {
            this.reload_cmd_vendeur();
        }   

        reload_cmd_vendeur(){
            
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

                            self.showScreen('TicketScreenCmdVendeur');
                        }); }); 
                        /// tester  actualisation de la page de cmd en attente////
        }

           
    }
    CmdVendeurButton.template = 'CmdVendeurButton';
    Registries.Component.add(CmdVendeurButton);
    return CmdVendeurButton;
});