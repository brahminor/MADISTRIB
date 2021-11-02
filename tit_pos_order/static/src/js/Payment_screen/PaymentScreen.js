odoo.define('tit_pos_order.PaymentScreenButton', function(require) {
'use strict';
    const { Gui } = require('point_of_sale.Gui');
    const PosComponent = require('point_of_sale.PosComponent');
    const { posbus } = require('point_of_sale.utils');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    var rpc = require('web.rpc');
    const CustomButtonPaymentScreen = (PaymentScreen) =>
    class extends PaymentScreen {
        constructor() {
            super(...arguments);
            var self = this;
            this.verif_groupe();
            this.render_paymentlines();
        }
        async verif_groupe(){
            /* cette fonction permet de vérifier le groupe associé à l'utilisateur 
            connecté à la session afin de gérer visibilité du bouton du débloque 
            client
            */
            let user = {}
                const order = this.env.pos.get_order();
                var l = this;
                let result = await this.rpc({
                                    model: 'res.users',
                                    method: 'verification_groupe_user_modified_in_pos',
                                    args: [l.env.pos.get_cashier().user_id[0]],
                                });
                var contents = $('.screen-content');
                if(result != 6){
                    //emecher de voir la case de debloquage pour user different que res de caisse
                    contents.find(".debloquer_client").hide();   //débloquer client
                } 
                contents.find(".customer-button").hide();   //change client
                if(result == 7 || result == 0){
                    //emecher de voir la case de debloquage pour user different que comptable
                    contents.find(".debloquer_client").show();   //débloquer client
                    contents.find(".customer-button").show();   //change client
                }      
        }
        async render_paymentlines () {
        // show avoir/avance amount 
        var self = this;
        var order = this.env.pos.get_order();
        var line = order ? order.selected_paymentline : false;
        var client = order.get_client();
        if (client){
            rpc.query({
                        model: 'res.partner',
                        method: 'avoir_du_client',
                        args: [this.env.pos.get_order().get_client().id]
                    }).then(function(result_fct){
                        $('.avoir_btn').text( result_fct.toFixed(2) );
                        $('.button_client_name').text(client.name) ;
                    });
         }  
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
        async validateOrder(isForceValidate) {
            // cette fonction permet de faire l'appel à la fonction qui fait la validation de la commande sur le pos
            this.validate_order_p(isForceValidate)
        }
        async validate_order_p(isForceValidate){
            //cette fonction permet de valider la commande sur le pos 
            var commande_ancienne = this.env.pos.get_order()
            var ligne_payements = this.env.pos.get_order().get_paymentlines()
            var l2 =this;
            for (var i = 0; i < ligne_payements.length; i++) {
                if (ligne_payements[i].payment_method['type_cheque'] === 'check' && (ligne_payements[i].check_number === undefined || ligne_payements[i].check_number === ''))
                 {
                     this.showPopup('ErrorPopup', {
                        title:('Le numéro de chèque est requis'),
                        body:('Veuillez renseigner le numéro de chèque s.v.p.')
                    });
                return false;
                }
                else if (ligne_payements[i].payment_method['type_cheque'] === 'deferred_check')
                {
                    if(ligne_payements[i].check_number === undefined || ligne_payements[i].check_number === '') 
                    {
                        this.showPopup('ErrorPopup', {
                            title:('Les données du chèque différé sont requises'),
                            body:('Veuillez renseigner le numéro de chèque s.v.p.')
                          });
                        return false;
                    }   
                    else if (ligne_payements[i].check_date === undefined || ligne_payements[i].check_date === '')
                    {
                        this.showPopup('ErrorPopup', {
                            title:('Les données du chèque différé sont requises'),
                            body:('Veuillez renseigner la date du remise s.v.p.')
                          });
                    return false;
                    } 
                }
                else if (ligne_payements[i].payment_method['type_cheque'] === 'check_kdo'  && (ligne_payements[i].check_date === undefined || ligne_payements[i].check_date === ''))
                {
                     this.showPopup('ErrorPopup', {
                        title:('La date du chèque kdo est requise'),
                        body:('Veuillez renseigner la date du remise s.v.p.')
                    });
                return false;
                } 
            }
            if(this.env.pos.config.cash_rounding) {
                if(!this.env.pos.get_order().check_paymentlines_rounding()) {
                    this.showPopup('ErrorPopup', {
                        title: this.env._t('Rounding error in payment lines'),
                        body: this.env._t("The amount of your payment lines must be rounded to validate the transaction."),
                    });
                    return;
                }
            }
            if (await this._isOrderValid(isForceValidate)) { 
                var order = this.env.pos.get_order()
                var selected_option = order.selected_option
                         
                if((!this.env.pos.get_order().is_to_invoice())
                    && (selected_option != 10) && (selected_option != 20)){
                                  this.showPopup('ErrorPopup', {
                                        title:('Le choix de la fature est requis'),
                                        body:('Veuillez sélectionner la facture s.v.p ! ')
                                    });
                                }
                else{
                    try {
                    let fields = {}
                    fields['id'] = this.env.pos.get_order().attributes.client.id
                    // vérifier si le client a atteind déjà la limite de crédit ou pas
                    let limite_atteind = await this.rpc({
                        model: 'res.partner',
                        method: 'utilsateur_atteind_limite_pay',
                        args: [fields],
                    }); 
                    var payment_lignes = []
                    /* 
                        voir si le montant est positif ou négative psq dans le cas de 
                        negative donc c un avoir et ne va pas afficher le msg de la limite
                        de crédit (psq le client entrain de faire un retour)
                    */
                    var montant_totale_trouve = 0
                    var ligne_payements_effectuees = this.env.pos.get_order().get_paymentlines()
                    for(var i =0; i<ligne_payements_effectuees.length;i++){
                        montant_totale_trouve += ligne_payements_effectuees[i].amount
 
                        payment_lignes.push({
                            'id_meth': ligne_payements_effectuees[i].payment_method.id,
                            'montant': ligne_payements_effectuees[i].amount
                        })
                    }
                    if((limite_atteind > 0 && montant_totale_trouve > 0)
                    && (selected_option != 10) && (selected_option != 20)
                     ){
                        /*
                            faire le traitement de vérification de la limite si elle est
                         éteint dans le cas ou le montant est positive.
                        */
                        var valll = $('input[name=debloc_client]:checked').val();
                        if (valll === 'yes'){
                            // c'est à dire le comptable a débloqué ce client
                            var order = this.env.pos.get_order()
                            var selected_option = order.selected_option
                            var down_payment_saisi = order.down_payment_saisi
                            if (selected_option == 10){
                                //ie c'est un acompte d'un SO avec %
                                var self = this;
                                var commande_ancienne = 0;
                                commande_ancienne = order.commande_id
                                rpc.query({
                                    model: 'pos.order',
                                    method: 'creer_facture',
                                    args: [commande_ancienne, self.env.pos.get_order().name, order.selected_option, down_payment_saisi, order.paymentlines.models[0].payment_method.id, order.paymentlines.models[0].amount]
                                }).then(function(u){
                                    //this.show_new_screeen();
                                    if (u < 0){
                                        if (u == (-1)){
                                            self.showPopup('ErrorPopup', {
                                                title:('Journal non trouvé'),
                                                body:('Veuillez configurer le journal associé à la méthode d e paiement')
                                            });
                                        }
                                        else if (u == (-2)){
                                            self.showPopup('ErrorPopup', {
                                                title:('Montant est requis'),
                                                body:('Veuillez saisir un montant différent que 0')
                                            });
                                        }
                                        else if (u == (-3)){
                                            self.show_new_screeen();
                                            Gui.showPopup("ValidationCommandeSucces", {
                                               title : self.env._t("Le paiement d'acompte est enregistré avec succès"),
                                               confirmText: self.env._t("OK"),
                                            });
                                        }     
                                    }
                                    else {
                                        self.showPopup('ErrorPopup', {
                                            title:('L\'avoir est insuffisant'),
                                            body:('Vous avez que  '+u.toFixed(2)+ ' comme avoir')
                                        });
                                    }
                                });
                            }
                            else if (selected_option == 20){
                                //ie c'est un acompte d'un SO avec montant fixe
                                var self = this;
                                var commande_ancienne = 0;
                                commande_ancienne = order.commande_id
                                rpc.query({
                                    model: 'pos.order',
                                    method: 'creer_facture',
                                    args: [commande_ancienne, self.env.pos.get_order().name, order.selected_option, down_payment_saisi, order.paymentlines.models[0].payment_method.id, order.paymentlines.models[0].amount]
                                }).then(function(u){
                                    if (u < 0){
                                        if (u == (-1)){
                                            self.showPopup('ErrorPopup', {
                                                title:('Journal non trouvé'),
                                                body:('Veuillez configurer le journal associé à la méthode d e paiement')
                                            });
                                        }
                                        else if (u == (-2)){
                                            self.showPopup('ErrorPopup', {
                                                title:('Montant est requis'),
                                                body:('Veuillez saisir un montant différent que 0')
                                            });
                                        }
                                        else if (u == (-3)){
                                            self.show_new_screeen();
                                            Gui.showPopup("ValidationCommandeSucces", {
                                               title : self.env._t("Le paiement d'acompte est enregistré avec succès"),
                                               confirmText: self.env._t("OK"),
                                            });
                                        }    
                                    }
                                    else {
                                        self.showPopup('ErrorPopup', {
                                            title:('L\'avoir est insuffisant'),
                                            body:('Vous avez que  '+u.toFixed(2)+ ' comme avoir')
                                        });
                                    }
                                });
                            }
                        else {
                                //ie c'est une commande normale
                            var commande_ancienne = 0;
                            commande_ancienne = order.commande_id
                            // remove pending payments before finalizing the validation
                            for (let line of this.paymentLines) {
                                if (!line.is_done()){
                                    this.currentOrder.remove_paymentline(line);
                                }
                            }
                            var self = this;
                            await this._finalizeValidation();
                            rpc.query({
                                model: 'pos.order',
                                method: 'fill_commande_principale',
                                args: [commande_ancienne, self.env.pos.get_order().name]
                            }).then(function(u){   
                                rpc.query({
                                        model: 'account.move',
                                        method: 'search_read',
                                        args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel']], []],
                                    }).then(function (factures_non_payees){
                                        self.env.pos.factures_non_payees = factures_non_payees;
                                        rpc.query({
                                            model: 'res.partner',
                                            method: 'search_read',
                                            args: [[], [ 'property_account_position_id', 'company_type', 'child_ids', 'type', 'website', 'siren_company', 'nic_company','credit_limit', 'avoir_client']],
                                        
                                        }).then(function (partner_result){
                                            self.env.pos.partner = partner_result;

                                            self.env.pos.delete_current_order();
                                            self.reload_cmd_vendeur(commande_ancienne);
                                        });
                                    });
                                });
                            }
                        }
                        else {
                            // le cas ou la limite de crédit est atteind
                            this.showPopup('ErrorPopup', {
                                title:('Limite de crédit'),
                                body:('La limite de crédit est dépassée pour ce client !')
                            });
                        } } 
                    else{
                            var order = this.env.pos.get_order()
                            var selected_option = order.selected_option
                            var down_payment_saisi = order.down_payment_saisi    
                            if (selected_option == 10){
                                //ie c'est un acompte d'un SO avec %
                                var self = this;
                                var commande_ancienne = 0;
                                commande_ancienne = order.commande_id
                                rpc.query({
                                    model: 'pos.order',
                                    method: 'creer_facture',
                                    args: [commande_ancienne, self.env.pos.get_order().name, order.selected_option, down_payment_saisi, order.paymentlines.models[0].payment_method.id, order.paymentlines.models[0].amount]
                                }).then(function(u){
                                    if (u < 0){
                                        if (u == (-1)){
                                            self.showPopup('ErrorPopup', {
                                                title:('Journal non trouvé'),
                                                body:('Veuillez configurer le journal associé à la méthode d e paiement')
                                            });
                                        }
                                        else if (u == (-2)){
                                            self.showPopup('ErrorPopup', {
                                                title:('Montant est requis'),
                                                body:('Veuillez saisir un montant différent que 0')
                                            });
                                        }
                                        else if (u == (-3)){
                                            self.show_new_screeen();
                                            Gui.showPopup("ValidationCommandeSucces", {
                                               title : self.env._t("Le paiement d'acompte est enregistré avec succès"),
                                               confirmText: self.env._t("OK"),
                                            });
                                        }  
                                    }
                                    else {
                                        self.showPopup('ErrorPopup', {
                                            title:('L\'avoir est insuffisant'),
                                            body:('Vous avez que  '+u.toFixed(2)+ ' comme avoir')
                                        });
                                    }
                                });
                            }
                            else if (selected_option == 20){
                                //ie c'est un acompte d'un SO avec montant fixe
                                var self = this;
                                var commande_ancienne = 0;
                                commande_ancienne = order.commande_id
                                rpc.query({
                                    model: 'pos.order',
                                    method: 'creer_facture',
                                    args: [commande_ancienne, self.env.pos.get_order().name, order.selected_option, down_payment_saisi, order.paymentlines.models[0].payment_method.id, order.paymentlines.models[0].amount]
                                }).then(function(u){
                                    if (u < 0){
                                        if (u == (-1)){
                                            self.showPopup('ErrorPopup', {
                                                title:('Journal non trouvé'),
                                                body:('Veuillez configurer le journal associé à la méthode d e paiement')
                                            });
                                        }
                                        else if (u == (-2)){
                                            self.showPopup('ErrorPopup', {
                                                title:('Montant est requis'),
                                                body:('Veuillez saisir un montant différent que 0')
                                            });
                                        }
                                        else if (u == (-3)){
                                            self.show_new_screeen();
                                            Gui.showPopup("ValidationCommandeSucces", {
                                               title : self.env._t("Le paiement d'acompte est enregistré avec succès"),
                                               confirmText: self.env._t("OK"),
                                            });
                                        } 
                                    }
                                    else {
                                        self.showPopup('ErrorPopup', {
                                            title:('L\'avoir est insuffisant'),
                                            body:('Vous avez que  '+u.toFixed(2)+ ' comme avoir')
                                        });
                                    }
                                });
                            }
                        else {
                                //ie c'est une commande normale  
                            var commande_ancienne = 0;
                            commande_ancienne = order.commande_id
                            // remove pending payments before finalizing the validation
                            for (let line of this.paymentLines) {
                                if (!line.is_done()){
                                    this.currentOrder.remove_paymentline(line);
                                }
                            }
                            var self = this;
                            await this._finalizeValidation();
                            rpc.query({
                                model: 'pos.order',
                                method: 'fill_commande_principale',
                                args: [commande_ancienne, self.env.pos.get_order().name]
                            }).then(function(u){
                                rpc.query({
                                        model: 'account.move',
                                        method: 'search_read',
                                        args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel']], []],
                                    }).then(function (factures_non_payees){
                                        self.env.pos.factures_non_payees = factures_non_payees;
                                        rpc.query({
                                            model: 'res.partner',
                                            method: 'search_read',
                                            args: [[], [ 'property_account_position_id', 'company_type', 'child_ids', 'type', 'website', 'siren_company', 'nic_company','credit_limit', 'avoir_client']],
                                        }).then(function (partner_result){
                                            self.env.pos.partner = partner_result;

                                            self.env.pos.delete_current_order();
                                            self.reload_cmd_vendeur(commande_ancienne);
                                        });
                                        });
                            });
                            }
                            this.reload_cmd_vendeur(commande_ancienne);
                    } 
                } catch (error) {
                    if (error.message.code < 0) {
                        await this.showPopup('OfflineErrorPopup', {
                            title: this.env._t('Offline'),
                            body: this.env._t('Unable to save changes.'),
                        });
                    } else {
                        throw error;
                    }
                }}  }
        }
        reload_cmd_vendeur(commande_ancienne){    
                        /// tester  actualisation de la page de cmd en attente////
                        var self = this; 
                        rpc.query({
                            model: 'pos.cmd_vendeur',
                            method: 'delete_ancienne_cmd',
                            args: [{
                            'commande_ancienne': commande_ancienne, 
                                                }]
                           }).then(function(u){
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
                        }); }); });
                        /// tester  actualisation de la page de cmd en attente////
        }       
    };
    Registries.Component.extend(PaymentScreen, CustomButtonPaymentScreen);
    return CustomButtonPaymentScreen;
});