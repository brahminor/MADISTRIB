odoo.define('tit_pos_order.TicketScreenEnAttente', function (require) {
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
        model: 'pos.commande',
        fields: [],
        domain: function(self){return [['state','in',['draft','en_attente']],['config_id','=',self.config.id]]; },
        loaded: function(self,commandes){
            self.commandes = commandes;
        },
    });

    models.load_models({
        model: 'pos.commande.line',
        fields: [],
        domain: function(self){ return [['order_id.state','in',['draft', 'en_attente']]]; },
        loaded: function(self,commandes_lines){
            self.commandes_lines = commandes_lines;
        },
    });

    models.load_models({
        model: 'pos.payment_cmd',
        fields: [],
        domain: function(self){ return [['pos_commande_id.state','in',['draft', 'en_attente']]]; },
        loaded: function(self,payment_cmd_lines){
            self.payment_cmd_lines = payment_cmd_lines;
        },
    });      
    class TicketScreenEnAttente extends PosComponent {
        constructor() {
            super(...arguments);
            var self = this; 
            this.commandes_recupere = this.env.pos.commandes
            this.commandes_lines_recupere = this.env.pos.commandes_lines

            useListener('filter-selected', this._onFilterSelected);
            useListener('search', this._onSearch);
            this.searchDetails = {};
            this.filter = null;
            this._initializeSearchFieldConstants();
        } 

        back() { 
            this.trigger('close-temp-screen'); 
        } 
        getDate(commande) {
            return moment(commande.date).format('DD/MM/YYYY hh:mm A');
        }

        reload_cmd_en_attente(){
            
                        /// tester  actualisation de la page de cmd en attente////
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
                            var v = self.env.pos.add_new_order();
                            self.env.pos.delete_current_order();
                            self.showScreen('TicketScreenEnAttente');
                        }); }); });
                        /// tester  actualisation de la page de cmd en attente////
        }     

        async annuler_acompte(id){
            var l = this;
            const { confirmed } = await this.showPopup('ValidationCommandePopup', {
                            title : this.env._t("Annuler acompte"),
                            body : this.env._t('Voulez-vous vraiment rembourser l\'acompte ? '),
                            confirmText: this.env._t("Oui"),
                            cancelText: this.env._t("Non"),
                        });
                        if (confirmed) {
                            /* vérifier si l'utilisateur courant a le droit de faire le remboursement
                            ou pas*/
                            if (l.env.pos.get_cashier()){
                                let result = await rpc.query({
                                    model: 'res.users',
                                    method: 'verification_groupe_user_modified_in_pos',
                                    args: [l.env.pos.get_cashier().user_id[0]],
                                }).then(function(u){
                                    if ((u != 3) || (u != 7)){
                                        l.showPopup('ErrorPopup', {
                                            title:('Problème des droits d\'accès'),
                                            body:('Attention! \n Vous n\'avez pas la possibilité de rembourser l\'acompte , \n Veuillez contacter votre administrateur s.v.p ! ')
                                        });
                                    }
                                    else{
                                        //traitement associé à la confirmation de l'alerte de dépassement de la limite
                                        rpc.query({
                                        model: 'pos.commande',
                                        method: 'annuler_acompte',
                                        args: [{
                                            'id_commande': id,
                                        }]
                                        }).then(function(u){
                                            
                                        l.reload_cmd_en_attente();

                                       })
                                    }
                                });
                            }
                            else{
                                //traitement associé à la confirmation de l'alerte de dépassement de la limite
                                rpc.query({
                                    model: 'pos.commande',
                                    method: 'annuler_acompte',
                                    args: [{
                                        'id_commande': id,
                                    }]
                                    }).then(function(u){
                                        
                                    l.reload_cmd_en_attente();

                                   })
                            }
                            
                            
                           
                        } 
        }
        selectOrder(com, id){
            let or = this.env.pos.get_order()
            this.load_commande(com, id);
        }

        load_commande (commande_id, id) {
            var order = this.env.pos.add_new_order();
            //récupérer la commande selectinnée
            var commande = this.get_commande_by_id(id)
            //modifier client de la commande crée
            order.set_client(this.env.pos.db.get_partner_by_id(commande.partner_id[0]));
            // récupérer les order line de la commande selectionnée
            order.commande_id = id;
            var commande_line = this.get_commande_lines(commande.id)
            for (var i=0; i<commande_line.length;i++) {
                var product = this.env.pos.db.get_product_by_id(commande_line[i].product_id[0])
                var qty = parseFloat(commande_line[i].qty)
                var discount = parseInt(commande_line[i].discount)
                var price = parseFloat(commande_line[i].price_unit)
                order.add_product(product,{quantity : qty, price : price, discount : discount})
            }
            // récupérer les lignes de paiement de la commande selectionnée
            var cmd_paymnt_line = this.get_cmd_payment_lines(commande.id)
            // payment line
            if (commande.journal_id) {
                for (var i=0; i<cmd_paymnt_line.length;i++) {
                    var cashregister = this.get_cashregister_from_journal_id(cmd_paymnt_line[i].payment_method_id[0]);
                    var paymentline = order.add_paymentline(cashregister)
                    order.selected_paymentline.set_amount(cmd_paymnt_line[i].montant)
                    order.selected_paymentline.set_check_number(cmd_paymnt_line[i].check_number)
                    order.selected_paymentline.set_check_date(cmd_paymnt_line[i].check_date)
                }
                
            }

            this.env.pos.delete_current_order();
            this.env.pos.set_order(order);

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

        
        get_commande_by_id (id) {
            /*
            @param : id = identifiant de la commande sélectionnée
            cette fonction permet de retourner la commande  en attente qui a id en paramètre
            */
            var commandes = this.env.pos.commandes;
            for (var i=0; i < commandes.length; i++) {
                if (commandes[i].id === id) {
                    return commandes[i];
                }
            }
        }
        get_cmd_payment_lines(cmd_id){
            var lines = [];
            var cmd_pay_lignes = this.env.pos.payment_cmd_lines;
            for (var i=0; i < cmd_pay_lignes.length; i++) {
                if (cmd_pay_lignes[i].pos_commande_id[0] === cmd_id) {
                    lines.push(cmd_pay_lignes[i]);
                }
            }
            return lines
        }
        get_commande_lines(commande_id) {
            /*
            @param : commande_id = identifiant de la commande selectinnée
            cette fonction permet de retourner les lignes de commandes en attente associées
            à la commande qui a id = commande_id
            */
            var lines = [];
            var commandes_lines = this.env.pos.commandes_lines;
            for (var i=0; i < commandes_lines.length; i++) {
                if (commandes_lines[i].order_id[0] === commande_id) {
                    lines.push(commandes_lines[i]);
                }
            }
            return lines
        }

        get_cashregister_from_journal_id(journal_id) {
            /*
            @param : journal_id = journal trouvé dans la commande sélectionnée
            cette fonction permet de retourner la méthode de payement de la commande
            en attente selectionnée
            */
            for (var i in this.env.pos.payment_methods) {
                if (this.env.pos.payment_methods[i].id === journal_id) {
                    return this.env.pos.payment_methods[i]
                }
            }
        }

        get CmdEnAttenteFiltre() {
            /*
            Cette fonction permet de retourner la liste des commandes
            en attente avec filtre appliqué
            */
            const filterCheck = (commandes) => {
                if (this.filter) {
                    const screen = commandes.get_screen_data();
                    return this.filter === this.constants.screenToStatusMap[screen.name];
                }
                return true;
            };
            const { fieldValue, searchTerm } = this.searchDetails;
            const fieldAccessor = this._searchFields[fieldValue];
            const searchCheck = (commandes) => {
                if (!fieldAccessor) return true;
                const fieldValue = fieldAccessor(commandes);
                if (fieldValue === null) return true;
                if (!searchTerm) return true;
                return fieldValue && fieldValue.toString().toLowerCase().includes(searchTerm.toLowerCase());
            };
            const predicate = (commandes) => {
                return filterCheck(commandes) && searchCheck(commandes);
            };
            return this.env.pos.commandes.filter(predicate);
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
                [Customer]: (commandes) => commandes.partner_id[1],
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
            /*
                cette fonction permet de retourner le nom du champs à utiliser
                pour faire le filtre
            */
            return {
                Customer: this.env._t('client'),
            };
        }
    }
    TicketScreenEnAttente.template = 'TicketScreenEnAttente';

    Registries.Component.add(TicketScreenEnAttente);

    return TicketScreenEnAttente;
});


