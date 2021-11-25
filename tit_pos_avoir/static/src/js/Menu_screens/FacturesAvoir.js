odoo.define('tit_pos_avoir.FacturesAvoir', function (require) {
    'use strict';
    const PosComponent = require('point_of_sale.PosComponent'); 
    const Registries = require('point_of_sale.Registries');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { useListener } = require('web.custom_hooks');
    const { posbus } = require('point_of_sale.utils');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');
    //load waiting orders
    models.load_models({
        model: 'account.move',
        fields: [],
        domain: function(self){return [['payment_state','in',['not_paid', 'partial']],['move_type','in',['out_refund']],['state','!=','cancel']]; },
        loaded: function(self,factures_avoirs){
            self.factures_avoirs = factures_avoirs;
        },
    });
    models.load_models({
        model: 'account.move.line',
        fields: [],
         domain: function(self){return [['move_id.payment_state','in',['not_paid', 'partial']],['move_id.move_type','in',['out_refund']],['move_id.state','!=','cancel']]; },
        loaded: function(self,factures_avoirs_lines){
            self.factures_avoirs_lines = factures_avoirs_lines;
        },
    });
    class FacturesAvoir extends PosComponent {
        constructor() {
            super(...arguments);
            var self = this; 
            this.factures_avoirs = this.env.pos.factures_avoirs
            useListener('filter-selected', this._onFilterSelected);
            useListener('search', this._onSearch);
            this.searchDetails = {};
            this.filter = null;
            this._initializeSearchFieldConstants();
        } 
        async genre(){
            //récupérer les id de toutes les lignes sélectionnées
            const values = Array.from(document.querySelectorAll('input[type="checkbox"]'))
              .filter((checkbox) => checkbox.checked)
              .map((checkbox) => checkbox.value);
              
        }
        show_new_screeen(){
            /*
            redirection vers la page de saisie de cmd mais vide sans ajout d'une nvlle 
            cmd dans menu cmd du natif du pos
            */
            var v = this.env.pos.add_new_order();
            this.env.pos.delete_current_order();
            this.env.pos.set_order(v);  
        }
        async click_paiement(){
            //payer la totalité des montants dû des factures sélectionnées
            const values = Array.from(document.querySelectorAll('input[type="checkbox"]'))
              .filter((checkbox) => checkbox.checked)
              .map((checkbox) => checkbox.value);
              
                var self = this;
                let result = 0
                if(values.length <= 0){
                    self.showPopup('ErrorPopup', {
                        title:('Paiement impossible'),
                        body:('Veuillez sélectionner au moins une facture !')
                    });
                }
                else{
                    rpc.query({
                        model: 'account.move',
                        method: 'get_amount_total',
                        args: [values],
                    }).then(function (montant_total){
                        if(montant_total < 0){
                                self.showPopup('ErrorPopup', {
                                    title:('Paiement impossible'),
                                    body:('Veuillez sélectionner des factures pour le même client !')
                                });
                            }
                        else{
                                rpc.query({
                                model: 'account.move',
                                method: 'get_client_et_avoir',
                                args: [values],
                            }).then(function (res){
                                self.showScreen('FactureSavePaiementMultiple', { facturess_selected: values, montant_total_du: montant_total.toFixed(2), client_name:res.client_name, avoir_client: res.avoir_client.toFixed(2)});
                            });
                        } 
                    });
                }
        }
        back() { 
            this.trigger('close-temp-screen'); 
        } 
        getDate(factures_avoirs) {
             /*
            cette fonction permet de retourner la date de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur date de facturation
            en bonne format
            */
            if(factures_avoirs.invoice_date){
                return moment(factures_avoirs.invoice_date).format('DD/MM/YYYY');    
            }
            else{
                return "/";
            }
            
        }
        getDateEcheance(factures_avoirs){
            /*
            cette fonction permet de retourner la date d'échéance de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur date dd'échéance
            en bonne format
            */
            if(factures_avoirs.invoice_date_due){
                return moment(factures_avoirs.invoice_date_due).format('DD/MM/YYYY');
            }
            else{
                return "/";
            }
        }
        get_payment_state(factures_avoirs){
            /*
            cette fonction permet de retourner l'état du paiement de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur état du paiement
            */
            var etat_du_paiement = factures_avoirs.payment_state
            if (etat_du_paiement == 'not_paid')
                return 'Non payée'
            else if (etat_du_paiement == 'in_payment') 
                return 'En paiement'
            else if (etat_du_paiement == 'partial')
                return 'Partiellement réglé'
            else return 'Payée'            
        }
        get_payment_state_chifre(factures_avoirs){
            /*
            permet de retourner la clé de l'état de paiement
            @param:
            -factures_avoirs: la facture à retourner la clé de leur état de paiement
            */
            return factures_avoirs.payment_state           
        }
        get_payment_statut(factures_avoirs){
            /*
            cette fonction permet de retourner le statut de la facture en paramètre en bonne format
            @paramètre:
            -factures_non_payees:  la facture qu'on veut retourner leur statut
            */
            var state = factures_avoirs.state
            if (state == 'draft')
                return 'Brouillon'
            else if (state == 'posted') 
                return 'Comptabilisé'
            else if (state == 'cancel')
                return 'Annulé'
            else return 'Brouillon'            
        }
        async selectFacture_for_details(facture, facture_id){
            /*
            Cette fonction permet d'etre redirigé vers la page du sauvegarde
            de paiement si l'état de la facture est comptabilisé ou vers la page de
            saisie d'une cmd si l'état est brouillon
            */
            if(facture.state == 'draft'){
                this.load_commande(facture, facture_id);
            }else if(facture.state == 'posted'){
                this.showScreen('FactureSavePaiement', { facture_selected: facture });
            }
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
        /*
            Partie pour le filtre des factures par rapport au client
        */
        get factures_avoirsFiltre() {
            
            const filterCheck = (factures_avoirs) => {
                if (this.filter) {
                    const screen = factures_avoirs.get_screen_data();
                    return this.filter === this.constants.screenToStatusMap[screen.name];
                }
                return true;
            };
            const { fieldValue, searchTerm } = this.searchDetails;
            const fieldAccessor = this._searchFields[fieldValue];
            const searchCheck = (factures_avoirs) => {
                if (!fieldAccessor) return true;
                const fieldValue = fieldAccessor(factures_avoirs);
                if (fieldValue === null) return true;
                if (!searchTerm) return true;
                return fieldValue && fieldValue.toString().toLowerCase().includes(searchTerm.toLowerCase());
            };
            const predicate = (factures_avoirs) => {
                return filterCheck(factures_avoirs) && searchCheck(factures_avoirs);
            };
            return this.env.pos.factures_avoirs.filter(predicate);
        } 
        get searchBarConfig() {
            // cette fonction est associée à  la barre de recherche
            return {
                searchFields: this.constants.searchFieldNames,
                filter: { show: false, options: {} },
            };
        }
        get _searchFields() {
            const { Customer } = this.getSearchFieldNames();
            var fields = {
                [Customer]: (factures_avoirs) => factures_avoirs.partner_id[1],
            };
            return fields;
        }
        _initializeSearchFieldConstants() {
            this.constants = {};
            Object.assign(this.constants, {
                searchFieldNames: Object.keys(this._searchFields)
            });
        }
        _onFilterSelected(event) {
            this.filter = event.detail.filter;
            this.render();
        }
        _onSearch(event) {
            const searchDetails = event.detail;
            Object.assign(this.searchDetails, searchDetails);
            this.render();
        }
        getSearchFieldNames() {
           
            return {
                Customer: this.env._t('client'),
            };
        }
        /*
            Fin de la partie associée au filtre des factures par rapport au client
        */
    }
    FacturesAvoir.template = 'FacturesAvoir';
    Registries.Component.add(FacturesAvoir);
    return FacturesAvoir;
});


