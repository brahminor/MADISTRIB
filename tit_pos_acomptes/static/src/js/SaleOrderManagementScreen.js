odoo.define('tit_pos_acomptes.SaleOrderManagementScreen', function (require) {
    'use strict';
    const PosComponent = require('point_of_sale.PosComponent'); 
    const { sprintf } = require('web.utils');
    const { parse } = require('web.field_utils');
    const Registries = require('point_of_sale.Registries');
    const IndependentToOrderScreen = require('point_of_sale.IndependentToOrderScreen');
    const { useListener } = require('web.custom_hooks');
    const { posbus } = require('point_of_sale.utils');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');
    class SaleOrderManagementScreen extends PosComponent {
        constructor() {
            super(...arguments);
            var self = this; 
            this.sale_orders = this.env.pos.sale_orders
            useListener('filter-selected', this._onFilterSelected);
            useListener('search', this._onSearch);
            this.searchDetails = {};
            this.filter = null;
            this._initializeSearchFieldConstants();
        } 
        async genre(){
            //cette fonction permet de récupérer les id de toutes les lignes sélectionnées
            const values = Array.from(document.querySelectorAll('input[type="checkbox"]'))
              .filter((checkbox) => checkbox.checked)
              .map((checkbox) => checkbox.value);
        }
        show_new_screeen(){
            /*
            cette fonction permet la redirection vers la page de saisie 
            de cmd mais vide sans ajout d'une nvlle  cmd dans menu cmd du 
            natif du pos
            */
            var v = this.env.pos.add_new_order();
            this.env.pos.delete_current_order();
            this.env.pos.set_order(v);  
        } 
        back() { 
            //cette fonction permet de fermer la page de la liste des sales orders
            this.trigger('close-temp-screen'); 
        } 
        getDate(sale_order) {
            /*cette fonction permet de retourner la date du sale order en bonne 
            format
            @param: 
            -sale_order: l'enregistrement du sale order selectionné
            */
            return moment(sale_order.date_order).format('DD/MM/YYYY HH:mm:ss');
        }
        selectOrder(com, id){
            /*cette fonction est associé à une ligne de sale order selectionnée afin 
            d'afficher le pop up associée
            @param:
            -com: l'enregistrement du sale order selectionné
            -id: id de l'enregistrement du sale order selectionné
            */
            let or = this.env.pos.get_order()
            this.load_commande(com, id);
        }
        async load_commande (commande_id, id) {
            var id_de_cmd = id;
            /*cette fonction permet de faire le chargement dans la page de
             saisie de cmd
             @param:
             -commande_id: l'enregistrement du sale order selectionné
             -id: l'id de l'enregistrement du sale order selectionné
             */
            var self = this;
            const { confirmed, payload: selectedOption } = await this.showPopup('SelectionPopup',
                {
                    title: this.env._t('Qu\'est ce que vous voulez faire ?'),
                    list: [{id:"0", label: "Appliquer un acompte (%)", item: 0},  {id:"1", label: "Appliquer un acompte ( Montant fixe )", item: 1}, {id:"2", label: "Régler la totalité de la commande", item: 2}],
                });
                if(confirmed)
                {
                    if (selectedOption == 2){
                        //Régler la commande
                        var order = this.env.pos.get_order();
                        order.selected_option = 2
                        var self_1 = this;
                        rpc.query({
                            model: 'sale.order',
                            method: 'creer_facture_totale',
                            args: [id_de_cmd]
                        }).then(function(invoice_generated){
                            self_1.showScreen('FactureDetails', { facture_selected: invoice_generated });
                        })
                } 
                else if (selectedOption == 0)
                {
                    //Appliquer un acompte (%)
                    let down_payment = commande_id.amount_total;
                    const { confirmed, payload } = await this.showPopup('NumberPopup', {
                        title: sprintf(this.env._t("Montant dû %s (règlement en %)"), this.env.pos.format_currency(commande_id.montant_du)),
                        startingValue: 0,
                    });
                    if (confirmed){
                        down_payment = commande_id.montant_du * parse.float(payload) / 100;
                    }
                    rpc.query({
                        model: 'product.product',
                        method: 'get_product_acompte',
                    }).then(function(id_produit_acompte){
                        if(id_produit_acompte != 0){
                            var order = self.env.pos.add_new_order();
                            //modifier client de la commande crée
                            order.set_client(self.env.pos.db.get_partner_by_id(commande_id.partner_id[0]));
                            order.commande_id = id;
                            order.selected_option = 10
                            order.down_payment_saisi = parse.float(payload)
                            self.env.pos.set_order(order);
                            var product = self.env.pos.db.get_product_by_id(id_produit_acompte)
                            order.add_product(product,{quantity : 1, price : down_payment, discount : 0})
                        } 
                    })
                }
                else if (selectedOption == 1)
                {
                    //Appliquer un acompte ( Montant fixe )
                    let down_payment = commande_id.amount_total;
                    const { confirmed, payload } = await this.showPopup('NumberPopup', {
                        title: sprintf(this.env._t(" Montant dû %s (règlement avec montant fixe)"), this.env.pos.format_currency(commande_id.montant_du)),
                        startingValue: 0,
                    });
                    if (confirmed){
                        down_payment =  parse.float(payload);
                    }
                    if (commande_id.montant_du < down_payment){
                        this.showPopup('ErrorPopup', {
                            title:('Montant non valide'),
                            body:('Veuillez saisir un acompte inférieur ou égale au montant dû ')
                        });
                    }
                    else{
                    rpc.query({
                        model: 'product.product',
                        method: 'get_product_acompte',
                    }).then(function(id_produit_acompte){
                        if(id_produit_acompte != 0){
                           var order = self.env.pos.add_new_order();
                            //modifier client de la commande crée
                            order.set_client(self.env.pos.db.get_partner_by_id(commande_id.partner_id[0]));
                            order.commande_id = id;
                            order.selected_option = 20
                            order.down_payment_saisi = parse.float(payload)              
                            self.env.pos.set_order(order);          
                            var product = self.env.pos.db.get_product_by_id(id_produit_acompte)
                            order.add_product(product,{quantity : 1, price : down_payment, discount : 0})
                        } 
                    })
                }
                }
            }
        }
         
        /*
            Partie pour le filtre des factures par rapport au client
        */
        get sale_ordersFiltre() {
            //cette fonction permet de retourner la liste des sale order filtré
            const filterCheck = (sale_orders) => {
                if (this.filter) {
                    const screen = sale_orders.get_screen_data();
                    return this.filter === this.constants.screenToStatusMap[screen.name];
                }
                return true;
            };
            const { fieldValue, searchTerm } = this.searchDetails;
            const fieldAccessor = this._searchFields[fieldValue];
            const searchCheck = (sale_orders) => {
                if (!fieldAccessor) return true;
                const fieldValue = fieldAccessor(sale_orders);
                if (fieldValue === null) return true;
                if (!searchTerm) return true;
                return fieldValue && fieldValue.toString().toLowerCase().includes(searchTerm.toLowerCase());
            };
            const predicate = (sale_orders) => {
                return filterCheck(sale_orders) && searchCheck(sale_orders);
            };
            return this.env.pos.sale_orders.filter(predicate);
        }
        get searchBarConfig() {
            // cette fonction est associée à  la barre de recherche
            return {
                searchFields: this.constants.searchFieldNames,
                filter: { show: false, options: {} },
            };
        }
        get _searchFields() {
            //cette fonction est associée à la zone de recherche
            const { Customer } = this.getSearchFieldNames();
            var fields = {
                [Customer]: (sale_orders) => sale_orders.partner_id[1],
            };
            return fields;
        }
        _initializeSearchFieldConstants() {
            //cette fonction est associée à la zone de recherche
            this.constants = {};
            Object.assign(this.constants, {
                searchFieldNames: Object.keys(this._searchFields)
            });
        }
        _onFilterSelected(event) {
            //cette fonction est associée à la zone de recherche
            this.filter = event.detail.filter;
            this.render();
        }
        _onSearch(event) {
            //cette fonction est associée à la zone de recherche
            const searchDetails = event.detail;
            Object.assign(this.searchDetails, searchDetails);
            this.render();
        }
        getSearchFieldNames() {
            //cette fonction retourne le client saisi sur la zone de recherche
            return {
                Customer: this.env._t('client'),
            };
        }
        /*
            Fin de la partie associée au filtre des factures par rapport au client
        */
    }
    SaleOrderManagementScreen.template = 'SaleOrderManagementScreen';
    Registries.Component.add(SaleOrderManagementScreen);
    return SaleOrderManagementScreen;
});


