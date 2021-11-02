odoo.define('tit_pos_cmd_facture.FactureDetails', function (require) {
    'use strict';
    
    const PosComponent = require('point_of_sale.PosComponent'); 
    const Registries = require('point_of_sale.Registries');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { useListener } = require('web.custom_hooks');
    const { posbus } = require('point_of_sale.utils');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');
    
    models.load_models({
    model:  'res.partner',
    domain: function (self) { return [['customer_rank', '!=', 0]]; },
    fields: [],
        loaded: function(self, client_recuperes){
            self.client_recuperes = client_recuperes;
            }
    });

    class FactureDetails extends PosComponent {
        constructor() {
            super(...arguments);
            var self = this
            this.changes = {};
            const facture_selected = this.props.facture_selected  
            this.intFields = [ 'country_id', 'state_id', 'property_product_pricelist'];
        } 
        mounted() { 
            // cette fonction est redéfini et elle s'excécute lors du 1er accès à la page de détail de la facture      
            var contents = $('.screen-facture');
            if (this.props.facture_selected.state == 'draft'){
                // si état = brouillon -->  mettre que  le bouton confirmer visible 
                contents.find(".button_brouillon_fact_btn").addClass('oe_hidden');
                contents.find(".button_confirm_fact_btn").removeClass('oe_hidden');
                contents.find(".edit_client_a_selectionner").removeClass('oe_hidden');
                contents.find(".button_enreg_paiement_btn").addClass('oe_hidden');  
            }
            else{
                //si état = comptabilisé -->  mettre que  le bouton confirmer invisible
                contents.find(".button_brouillon_fact_btn").removeClass('oe_hidden');
                contents.find(".button_confirm_fact_btn").addClass('oe_hidden');
                $('.edit_client_a_selectionner').attr("style", "pointer-events: none;");
                contents.find(".button_enreg_paiement_btn").removeClass('oe_hidden');
            }
        }

        captureChange(event) {
                this.changes[event.target.name] = event.target.value;  
        }
        getDate(factures_non_payees) {
            return moment(factures_non_payees.invoice_date).format('DD/MM/YYYY');
        }
        getDateEcheance(factures_non_payees){
            return moment(factures_non_payees.invoice_date_due).format('DD/MM/YYYY');
        }
        get_payment_state(factures_non_payees){
            var etat_du_paiement = factures_non_payees.payment_state
            
            if (etat_du_paiement == 'not_paid')
                return 'Non payées'
            else if (etat_du_paiement == 'in_payment') 
                return 'En paiement'
            else if (etat_du_paiement == 'partial')
                return 'Partiellement réglé'
            else return 'Payée'            
        }
        get_payment_statut(factures_non_payees){
            var state = factures_non_payees.state
            
            if (state == 'draft')
                return 'Brouillon'
            else if (state == 'posted') 
                return 'Comptabilisé'
            else if (state == 'cancel')
                return 'Annulé'
            else return 'Brouillon'            
        }
        get_name_client(factures_non_payees){
            return factures_non_payees.partner_id[1]
        }
        async remettre_en_brouillon(facture_id) {
            // cette fonction permet de mettre la facture en brouillon et mettre le client modifiable
            var self = this;
            //mettre la facture en brouillon
             let facture_brouillon_id = await this.rpc({
                        model: 'account.move',
                        method: 'button_draft',
                        args: [facture_id]
                    }).then(function (u) {
                        //actualisation de la liste des factures non payées ou partiellement payées
                        rpc.query({
                            model: 'account.move',
                            method: 'search_read',
                            args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel'],['invoice_date_due', '<=',new Date()]], []],
                            })
                        .then(function (factures_non_payees){
                            self.env.pos.factures_non_payees = factures_non_payees;

                            /* après remettre en brouillon on met le bouton remettre au brouillon
                            et enregistrer paiement invisible et le bouton confirmer visible*/
                            var contents = $('.screen-facture');
                            contents.find(".button_brouillon_fact_btn").addClass('oe_hidden');
                            contents.find(".button_confirm_fact_btn").removeClass('oe_hidden');
                            contents.find(".button_enreg_paiement_btn").addClass('oe_hidden');
                            $('.edit_client_a_selectionner').attr("style", "pointer-events: all;");
                        });
                        });
        }

        async enregistrer_paiement(facture_id) {
            /*cette fonction permet la redirection vers la page du paiement
            de la facture 
            @param:
            -facture_id: id de la facture
            */
            var self = this;
            this.showScreen('FactureSavePaiement', { facture_selected: this.props.facture_selected });

        }

        async confirmer_facture(facture_id){
            var self = this;
            /*
                cette fonction permet de sauvegarder la modification du client de la facture 
                puis confirmer la facture
            */
            let processedChanges = {};
            try {
                for (let [key, value] of Object.entries(this.changes)) {
                    processedChanges[key] = value;
                }
                if (processedChanges.client_recuperes_id > 0){
                    processedChanges['client_recuperes_id'] = parseInt(processedChanges.client_recuperes_id) || 0
                }
                else{
                    processedChanges['client_recuperes_id'] = 0   
                }} catch (error) {
                throw error;
            }
            //modification du client
            rpc.query({
                model: 'account.move',
                method: 'update_partner',
                args: [{
                    'facture_modifier_id': facture_id,
                    'client_modifie': processedChanges['client_recuperes_id']
                }]
            }).then(function(result){
                //confirmation de la facture
                let facture_brouillon_id = rpc.query({
                        model: 'account.move',
                        method: 'action_post',
                        args: [facture_id]
                    }).then(function (u) {
                        //actualisation de la liste des factures non payées ou partiellement payées
                        rpc.query({
                            model: 'account.move',
                            method: 'search_read',
                            args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel'],['invoice_date_due', '<=',new Date()]], []],
                        }).then(function (factures_non_payees){
                            self.env.pos.factures_non_payees = factures_non_payees;
                            for (var i = 0; i < self.env.pos.factures_non_payees.length ; i++){    
                                if(self.env.pos.factures_non_payees[i].id == self.props.facture_selected.id){          
                                    self.props.facture_selected = self.env.pos.factures_non_payees[i]
                                }
                            }

                            /* après la confirmation on met le bouton confirmer invisible
                            et le bouton enregistrer paiement et remettre au brouillon visible*/
                            var contents = $('.screen-facture');
                            contents.find(".button_brouillon_fact_btn").removeClass('oe_hidden');
                            contents.find(".button_confirm_fact_btn").addClass('oe_hidden');
                            contents.find(".button_enreg_paiement_btn").removeClass('oe_hidden');
                            $('.edit_client_a_selectionner').attr("style", "pointer-events: none;");
                        });
                    });
            });
        }     
    }
    FactureDetails.template = 'FactureDetails';
    Registries.Component.add(FactureDetails);
    return FactureDetails;
});
