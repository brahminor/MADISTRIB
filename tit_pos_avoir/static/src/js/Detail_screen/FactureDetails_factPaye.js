odoo.define('tit_pos_avoir.FactureDetails_factPaye', function (require) {
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
    class FactureDetails_factPaye extends PosComponent {
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
        getDate(factures_payees) {
             /*
            cette fonction permet de retourner la date de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur date de facturation
            en bonne format
            */
            if(factures_payees.invoice_date){
                return moment(factures_payees.invoice_date).format('DD/MM/YYYY');   
            }
            else{
                return '/';
            }
            
        }
        getDateEcheance(factures_payees){
             /*
            cette fonction permet de retourner la date d'échéance de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur date dd'échéance
            en bonne format
            */
            if(factures_payees.invoice_date_due){
                return moment(factures_payees.invoice_date_due).format('DD/MM/YYYY');
            }
            else{
                return '/';
            }
        }
        get_payment_state(factures_payees){
            /*
            cette fonction permet de retourner l'état du paiement de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur état du paiement
            */
            var etat_du_paiement = factures_payees.payment_state
            
            if (etat_du_paiement == 'not_paid')
                return 'Non payée'
            else if (etat_du_paiement == 'in_payment') 
                return 'En paiement'
            else if (etat_du_paiement == 'partial')
                return 'Partiellement réglé'
            else return 'Payée'            
        }
        get_payment_statut(factures_payees){
            /*
            cette fonction permet de retourner le statut de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur statut
            */
            var state = factures_payees.state
            if (state == 'draft')
                return 'Brouillon'
            else if (state == 'posted') 
                return 'Comptabilisé'
            else if (state == 'cancel')
                return 'Annulé'
            else return 'Brouillon'            
        }
        get_name_client(factures_payees){
            /*
            cette fonction permet de retourner le nom du client de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur nom du client associée
            */
            return factures_payees.partner_id[1]
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
                            rpc.query({
                            model: 'account.move',
                            method: 'get_ref_facture',
                            args: [facture_id]
                        }).then(function (u) {
                        //actualisation de la liste des factures non payées ou partiellement payées
                        $("#ref_fact").val(u);
                        rpc.query({
                            model: 'account.move',
                            method: 'search_read',
                            args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel']], []],
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
                            $("#statut_fact").val("Comptabilisé");
                        });
                    });
                });
            });
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
                        rpc.query({
                            model: 'account.move',
                            method: 'get_ref_facture',
                            args: [facture_id]
                        }).then(function (u) {
                        //actualisation de la liste des factures non payées ou partiellement payées
                        $("#ref_fact").val(u);
                        //actualisation de la liste des factures non payées ou partiellement payées
                        rpc.query({
                            model: 'account.move',
                            method: 'search_read',
                            args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel']], []],
                            })
                        .then(function (factures_payees){
                            self.env.pos.factures_payees = factures_payees;
                            /* après remettre en brouillon on met le bouton remettre au brouillon
                            et enregistrer paiement invisible et le bouton confirmer visible*/
                            var contents = $('.screen-facture');
                            contents.find(".button_brouillon_fact_btn").addClass('oe_hidden');
                            contents.find(".button_confirm_fact_btn").removeClass('oe_hidden');
                            contents.find(".button_enreg_paiement_btn").addClass('oe_hidden');
                            $('.edit_client_a_selectionner').attr("style", "pointer-events: all;");
                            $("#statut_fact").val("Brouillon");
                            $("#etat_paiement").val("Non payée");
                            $("#amount_residual").val($("#montant_total").val());
                            });
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
        async ajouter_avoir_facture(facture_id){
            /*
            cette fonction permet d'ajouter un avoir sur la facture payée et 
            rediriger directement vers la page de la saisie d'une cmd
            */
            var self = this;
            let processedChanges = {};
            //modification du client
            rpc.query({
                model: 'account.move',
                method: 'ajouter_avoir_facture',
                args: [{
                    'facture_modifier_id': facture_id,
                }]
            }).then(function(result){
                //confirmation de la facture
                if(result){
                    rpc.query({
                            model: 'account.move',
                            method: 'search_read',
                            args: [[['payment_state','in',['paid']],['move_type','in',['out_invoice']],['state','!=','cancel']], []],
                        }).then(function (factures_payees){
                            self.env.pos.factures_payees = factures_payees;
                            rpc.query({
                                model: 'account.move',
                                method: 'search_read',
                                args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_refund']],['state','!=','cancel']], []],
                            }).then(function (factures_avoirs){
                                self.env.pos.factures_avoirs = factures_avoirs;
                                rpc.query({
                                    model: 'account.move.line',
                                    method: 'search_read',
                                    args: [[['move_id.payment_state','in',['not_paid', 'partial']],['move_id.move_type','in',['out_refund']],['move_id.state','!=','cancel']], []],
                                }).then(function (factures_avoirs_lines){
                                    self.env.pos.factures_avoirs_lines = factures_avoirs_lines;
                                    self.load_commande(result, result.id);
                            });
                            });   
                    });
                } 
            });
        }
        get_commande_by_id (id) {
            /*
            @param : id = identifiant de la commande sélectionnée
            cette fonction permet de retourner la commande  en attente qui a id en paramètre
            */
            var commandes = this.env.pos.factures_avoirs;
            for (var i=0; i < commandes.length; i++) {
                if (commandes[i].id === id) {
                    return commandes[i];
                }
            }
        }
        get_commande_lines(commande_id) {
            /*
            @param : commande_id = identifiant de la commande selectinnée
            cette fonction permet de retourner les lignes de commandes en attente associées
            à la commande qui a id = commande_id
            */
            var lines = [];
            var commandes_lines = this.env.pos.factures_avoirs_lines;
            for (var i=0; i < commandes_lines.length; i++) {
                if (commandes_lines[i].move_id[0] === commande_id) {
                    lines.push(commandes_lines[i]);
                }
            }
            return lines
        }
        load_commande (commande_id, id) {
            //cette fonction permet d'actualiser la page de saisie de la cmd
            var order = this.env.pos.add_new_order();
            //récupérer la commande selectinnée
            var commande = this.get_commande_by_id(id)
            //modifier client de la commande crée
            order.set_client(this.env.pos.db.get_partner_by_id(commande.partner_id[0]));
            // récupérer les order line de la commande selectionnée
            order.commande_id = 0;
            order.commande_id_acompte = 0;
            order.avoir_facture = id;
            order.reference = commande_id.name;
            order.amount_total = commande_id.amount_total;
            order.montant_du = commande_id.amount_residual;
            order.partner_id =  [commande_id.partner_id[0], commande_id.partner_id[1]];
            order.avoir_client = id;
            var commande_line = this.get_commande_lines(commande.id)
            for (var i=0; i<commande_line.length;i++) {
                var product = this.env.pos.db.get_product_by_id(commande_line[i].product_id[0])
                if (product){
                    var qty = parseFloat(commande_line[i].quantity)
                    var discount = parseInt(commande_line[i].discount)
                    var price = parseFloat(commande_line[i].price_unit)
                    order.add_product(product,{id_ligne : commande_line[i].id, quantity : qty, price : price, discount : discount})
                    order.get_orderlines()[order.get_orderlines().length - 1].id = commande_line[i].id
                }
            }
            this.env.pos.delete_current_order();
            this.env.pos.set_order(order); 
        } 
    }
    FactureDetails_factPaye.template = 'FactureDetails_factPaye';
    Registries.Component.add(FactureDetails_factPaye);
    return FactureDetails_factPaye;
});
