odoo.define('tit_pos_cmd_facture.FactureSavePaiementMultiple', function (require) {
    'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent'); 
    const Registries = require('point_of_sale.Registries');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { useListener } = require('web.custom_hooks');
    const { posbus } = require('point_of_sale.utils');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');

    class FactureSavePaiementMultiple extends PosComponent {
        constructor() {
            super(...arguments);
            var self = this
            this.changes = {};
            
        } 

        captureChange(event) {
                this.changes[event.target.name] = event.target.value;  
        }

        async enregistrer_paiement() {

            /*
            Cette fonction permet d'enregistrer le paiement des factures selectionnées depuis pos
            */
            var self = this;
            let processedChanges = {};
            /*
            montant_a_payer: permet de garder le montant à payer lors du sélection de
             plusieures factures à la fois, 
             au 1er moment = montant globale (= la somme des montants dû des factures sélectionnées à payer)
             au 2ème moment = montant dû modifié afin d'etre payé pour plusieurs factures sélectionnées à la fois)
            */
            var montant_a_payer = self.props.montant_total_du 
            try {
                processedChanges['montant_total'] = 0
                for (let [key, value] of Object.entries(this.changes)) {
                    processedChanges[key] = value;
                    if (key == 'montant_total'){
                        // récupération du montant total à payer
                        processedChanges['montant_total'] = value
                    }
                    if (key == 'montant_saisi'){
                        montant_a_payer = value
                    }
                }
                //récupération du journal choisi
                if (processedChanges.facture_recuperes_id > 0){
                    processedChanges['facture_recuperes_id'] = parseInt(processedChanges.facture_recuperes_id) || 0
                }
                else{
                    processedChanges['facture_recuperes_id'] = 0   
                }

                if(processedChanges['facture_recuperes_id'] === 0 ){
                    var l = this;
                    l.showPopup('ErrorPopup', {
                        title:('Attention !'),
                        body:('Veuillez sélectionner le journale s.v.p. ')
                    });
                }
                else{
                    var self = this;
                    
                    //enregistrer le paiement des factures sélectionnées
                     rpc.query({
                        model: 'account.move', 
                        method: 'add_invoice_payment', 
                        args: [montant_a_payer, self.props.facturess_selected, processedChanges['facture_recuperes_id'], self.env.pos.pos_session.id],
                            }).then(function (u) {
                                
                                if (u == 1){
                                    self.showScreen('FacturesNonPayee');
                                    rpc.query({
                                        model: 'account.move',
                                        method: 'search_read',
                                        args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel']], []],
                                    }).then(function (factures_non_payees){
                                        self.env.pos.factures_non_payees = factures_non_payees;
                                        Gui.showPopup("ValidationCommandeSucces", {
                                           title : self.env._t("Le paiemet est enregistré avec succès"),
                                           confirmText: self.env._t("OK"),
                                        });
                                    });
                                }
                                else if (u == 0) {
                                    rpc.query({
                                        model: 'account.move',
                                        method: 'search_read',
                                        args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel']], []],
                                    }).then(function (factures_non_payees){
                                        self.env.pos.factures_non_payees = factures_non_payees;
                                        self.showPopup('ErrorPopup', {
                                            title:('Echec !'),
                                            body:('Votre paiement n\'est pas enregistré, \n Veuillez réssayer encore une fois ou bien vérifier l\'avoir du client ')
                                        });
                                    });
                                }
                                else if (u != 1){
                                    self.showPopup('ErrorPopup', {
                                        title:('L\'avoir est insuffisant'),
                                        body:('Vous avez que  '+u.toFixed(2)+ ' comme avoir')
                                    });
                                }
                    });
                }
            } catch (error) {
                throw error;
            }    
        } 
    }
    FactureSavePaiementMultiple.template = 'FactureSavePaiementMultiple';
    Registries.Component.add(FactureSavePaiementMultiple);
    return FactureSavePaiementMultiple;
});
