odoo.define('tit_pos_avoir.FactureAvoirDetails', function (require) {
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
    class FactureAvoirDetails extends PosComponent {
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
            //cette fonction permet de capturer les changements sur la facture avoir client
                this.changes[event.target.name] = event.target.value;  
        }
        getDate(factures_non_payees) {
            /*
            cette fonction permet de retourner la date de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur date de facturation
            en bonne format
            */
            if(factures_non_payees.invoice_date){
                return moment(factures_non_payees.invoice_date).format('DD/MM/YYYY');
            }
            else{
                return '/';
            }
        }
        getDateEcheance(factures_non_payees){
            /*
            cette fonction permet de retourner la date d'échéance de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur date dd'échéance
            en bonne format
            */
            if(factures_non_payees.invoice_date_due){
                return moment(factures_non_payees.invoice_date_due).format('DD/MM/YYYY');
            }
            else{
                return '/';
            }
        }
        get_payment_state(factures_non_payees){
            /*
            cette fonction permet de retourner l'état du paiement de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur état du paiement
            */
            var etat_du_paiement = factures_non_payees.payment_state
            
            if (etat_du_paiement == 'not_paid')
                return 'Non payée'
            else if (etat_du_paiement == 'in_payment') 
                return 'En paiement'
            else if (etat_du_paiement == 'partial')
                return 'Partiellement réglé'
            else return 'Payée'            
        }
        get_payment_statut(factures_non_payees){
            /*
            cette fonction permet de retourner le statut de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur statut
            */
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
            /*
            cette fonction permet de retourner le nom du client de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur nom du client associée
            */
            return factures_non_payees.partner_id[1]
        }
        async enregistrer_paiement(facture_id) {
            /*cette fonction permet la redirection vers la page du paiement
            de la facture 
            @param:
            -facture_id: id de la facture
            */
            var self = this;
            this.showScreen('FactureSavePaiement_factPaye', { facture_selected: this.props.facture_selected });
        }   
    }
    FactureAvoirDetails.template = 'FactureAvoirDetails';
    Registries.Component.add(FactureAvoirDetails);
    return FactureAvoirDetails;
});
