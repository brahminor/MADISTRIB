odoo.define('tit_pos_order.profile_page', function (require) {
    'use strict';
    
    const PosComponent = require('point_of_sale.PosComponent'); 
    const Registries = require('point_of_sale.Registries');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { useListener } = require('web.custom_hooks');
    const { posbus } = require('point_of_sale.utils');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');
 
    class profile_page extends PosComponent {
        constructor() {
            super(...arguments); 
            this.verif_groupe();
        }

        async verif_groupe(){
            /* cette fonction permet de vérifier le groupe associé à l'utilisateur 
            connecté à la session afin de gérer visibilité du bouton factures non payée
            */
            let user = {}
                const order = this.env.pos.get_order();
                var l = this;
                let result = await this.rpc({
                                    model: 'res.users',
                                    method: 'verification_groupe_user_modified_in_pos',
                                    args: [l.env.pos.get_cashier().user_id[0]],
                                });
                  

        }

        captureChange(event) {
                this.changes[event.target.name] = event.target.value;  
        }
        get_user_name() {
            //fonction pour retourner le nom du caissier
            return this.env.pos.get_cashier().name;
        }
        async factures_non_paye(){
            //fonction pour redirigé vers la liste des factures
            this.reload_cmd_en_attente();
        }
        reload_cmd_en_attente(){
            //chercher les factures non payée ou partiellement payée et rediriger vers la liste récupérée
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
    profile_page.template = 'profile_page';
    Registries.Component.add(profile_page);
    return profile_page;
});
