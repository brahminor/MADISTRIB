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
                if(!this.env.pos.get_order().is_to_invoice()){
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
                    if(limite_atteind > 0 && montant_totale_trouve > 0 ){
                        /*
                            faire le traitement de vérification de la limite si elle est
                         éteint dans le cas ou le montant est positive.
                        */
                        var valll = $('input[name=debloc_client]:checked').val();
                        if (valll === 'yes'){
                            // c'est à dire le comptable a débloqué ce client
                            var order = this.env.pos.get_order()
                            var commande_ancienne = order.commande_id
                            // remove pending payments before finalizing the validation
                            for (let line of this.paymentLines) {
                                if (!line.is_done()){
                                    this.currentOrder.remove_paymentline(line);
                                }
                            }
                            var self = this;
                            await this._finalizeValidation();
                            rpc.query({
                                model: 'pos.commande',
                                method: 'update_state_done',
                                args: [commande_ancienne, self.env.pos.get_order().get_client().id, []]
                            }).then(function(u){
                                 
                                rpc.query({
                                    model: 'account.move',
                                    method: 'search_read',
                                    args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel'],['invoice_date_due', '<=',new Date()]], []],
                                }).then(function (factures_non_payees){
                                    self.env.pos.factures_non_payees = factures_non_payees;
                                    rpc.query({
                                        model: 'res.partner',
                                        method: 'search_read',
                                        args: [[], [ 'property_account_position_id', 'company_type', 'child_ids', 'type', 'website', 'siren_company', 'nic_company','credit_limit', 'avoir_client']],
                                    
                                    }).then(function (partner_result){
                                        self.env.pos.partner = partner_result;
                                        self.reload_cmd_en_attente(commande_ancienne);
                                    });
                                    });
                            })
                        }
                        else {
                            // le cas ou la limite de crédit est atteind
                            this.showPopup('ErrorPopup', {
                                title:('Limite de crédit'),
                                body:('La limite de crédit est dépassée pour ce client !')
                            });
                        } } 
                    else{
                        var self = this;
                        var order = this.env.pos.get_order()
                        var commande_ancienne = order.commande_id
                        
                        // remove pending payments before finalizing the validation
                        for (let line of this.paymentLines) {
                            if (!line.is_done()){
                                this.currentOrder.remove_paymentline(line);
                            }
                        }
                        await this._finalizeValidation();
                        rpc.query({
                            model: 'pos.commande',
                            method: 'update_state_done',
                            args: [commande_ancienne, self.env.pos.get_order().get_client().id, payment_lignes]
                        }).then(function(u){
                            rpc.query({
                                model: 'account.move',
                                method: 'search_read',
                                args: [[['payment_state','in',['not_paid','partial']],['move_type','in',['out_invoice']],['state','!=','cancel'],['invoice_date_due', '<=',new Date()]], []],
                            })
                                .then(function (factures_non_payees){
                                    self.env.pos.factures_non_payees = factures_non_payees;
                                    rpc.query({
                                        model: 'res.partner',
                                        method: 'search_read',
                                        args: [[], [ 'property_account_position_id', 'company_type', 'child_ids', 'type', 'website', 'siren_company', 'nic_company','credit_limit', 'avoir_client']],
                                    
                                    }).then(function (partner_result){
                                        self.env.pos.partner = partner_result;
                                        self.reload_cmd_en_attente(commande_ancienne);
                                    });
                                    
                                });
                            })
                        this.reload_cmd_en_attente(commande_ancienne);
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
                } } }
        }
        async validate_cmd_acompte(){

            var commande_ancienne = this.env.pos.get_order();
           /*
           Fonction pour créer la commande en attente
           */

           var self2 = this
            var avoir_atteind_limite_ou_p =0;

           var l =this;
            const order = this.env.pos.get_order();
            var commande_ancienne = order.commande_id

            var payment_lignes = []
            var ligne_payements_effectuees = this.env.pos.get_order().get_paymentlines()
            for(var i =0; i<ligne_payements_effectuees.length;i++){
                payment_lignes.push({
                    'id_meth': ligne_payements_effectuees[i].payment_method.id,
                    'montant': ligne_payements_effectuees[i].amount
                })
            }

                //traitement associé à la confirmation de l'alerte de dépassement de la limite
                    let fields = {}
                    fields['id'] = order.attributes.client.id
                    fields['partner_id'] = order.attributes.client.id
                    fields['session_id'] = order.pos_session_id
                    fields['journal_id'] = order.selected_paymentline.payment_method.id
                    var montant_acompte = 0.0
                    if (order.paymentlines.length){
                        for(let k=0; k<order.paymentlines.length; k++){
                            montant_acompte += order.paymentlines.models[k].amount
                        }
                    }
                    fields['acompte'] = montant_acompte
                    //création de la commande en attente
                    let commandeId = await this.rpc({
                        model: 'pos.commande',
                        method: 'create_commande',
                        args: [fields],
                    }).then(function (commande_id) {
                        //création des lignes de commandes associé à la cmd en attente crée
                        for (let i=0; i<order.orderlines.models.length ; i++){
                            
                            let commandeLineId = rpc.query({
                            model: 'pos.commande.line',
                            method: 'create_commande_line',
                            args: [{
                                'order_id' : commande_id,
                                'qty' : order.orderlines.models[i].quantity,
                                'product_id' : order.orderlines.models[i].product.id,
                                'price_unit' : order.orderlines.models[i].price,
                                'discount' : order.orderlines.models[i].discount,
                                'tax_ids' : order.orderlines.models[i].product.taxes_id,
                            }]
                            });
                        }  
                        //remplissage des paiements associés à la cmd en attente
                        if (order.paymentlines.length){
                            
                        for(let k=0; k<order.paymentlines.length; k++){
                            //////////////
                             if (order.paymentlines.models[k].check_date  && order.paymentlines.models[k].check_number){
                                let paymentLineId = rpc.query({
                                model: 'pos.payment_cmd',
                                method: 'create_payment_cmd',
                                args: [{
                                    'pos_commande_id' : commande_id,
                                    'montant' : order.paymentlines.models[k].amount,
                                    'check_number' : order.paymentlines.models[k].check_number,
                                    'check_date' : order.paymentlines.models[k].check_date,
                                    'session_id' : order.pos_session_id,
                                    'payment_method_id' : order.paymentlines.models[k].payment_method.id
                                    }]
                                    });
                            }
                            else if(order.paymentlines.models[k].check_number){
                                let paymentLineId = rpc.query({
                                model: 'pos.payment_cmd',
                                method: 'create_payment_cmd',
                                args: [{
                                    'pos_commande_id' : commande_id,
                                    'check_number' : order.paymentlines.models[k].check_number,
                                    'montant' : order.paymentlines.models[k].amount,
                                    'session_id' : order.pos_session_id,
                                    'payment_method_id' : order.paymentlines.models[k].payment_method.id
                                    }]
                                    });
                            }
                            else if(order.paymentlines.models[k].check_date){
                                let paymentLineId = rpc.query({
                                model: 'pos.payment_cmd',
                                method: 'create_payment_cmd',
                                args: [{
                                    'pos_commande_id' : commande_id,
                                    'check_date' : order.paymentlines.models[k].check_date,
                                    'montant' : order.paymentlines.models[k].amount,
                                    'session_id' : order.pos_session_id,
                                    'payment_method_id' : order.paymentlines.models[k].payment_method.id
                                    }]
                                    });
                            }
                            else{
                                let paymentLineId = rpc.query({
                                model: 'pos.payment_cmd',
                                method: 'create_payment_cmd',
                                args: [{
                                    'pos_commande_id' : commande_id,
                                    'montant' : order.paymentlines.models[k].amount,
                                    'session_id' : order.pos_session_id,
                                    'payment_method_id' : order.paymentlines.models[k].payment_method.id
                                    }]
                                    });
                            }  } }
                        //modifier l'état de la commande courante
                        rpc.query({
                                model: 'pos.commande',
                                method: 'update_state_archived',
                                args: [{
                                    'commande_ancienne': commande_ancienne, 
                                    'commande_nouvelle': commande_id
                                }]
                                }).then(function(u){
                                    rpc.query({
                                            model: 'res.partner',
                                            method: 'search_read',
                                            args: [[], [ 'property_account_position_id', 'company_type', 'child_ids', 'type', 'website', 'siren_company', 'nic_company','credit_limit', 'avoir_client']],
                                        }).then(function (partner_result){
                                            l.env.pos.partner = partner_result;
                                            l.reload_cmd_en_attente(commande_ancienne);
                                        });
                               })
                    });
                    
                    Gui.showPopup("ValidationCommandeSucces", {
                       title : this.env._t("La commande est validée avec succès"),
                           confirmText: this.env._t("OK"),
                    });
                    /*créer une nouvelle commande (pour etre redirigé vers une nouvelle
                    interface de commande et le tous soit à 0)
                    */ 
                    this.env.pos.delete_current_order();
                    var v = this.env.pos.add_new_order();
                    this.env.pos.delete_current_order();
                    this.env.pos.set_order(v);
                

        }
        async IsCustomButton() {
            this.validate_cmd_acompte();
        } 

                reload_cmd_en_attente(commande_ancienne){
                    
                        /*
                        cette fonction permet d'actualiser la page des acomptes
                        et faire appel à la fct d'actualisation de la page des cmd
                        validées par vendeur
                        @param: commande_ancienne : id de la commande qu'elle était coura,te
                        */
                        var self = this; 
                        rpc.query({
                            model: 'pos.cmd_vendeur',
                            method: 'delete_ancienne_cmd',
                            args: [{
                            'commande_ancienne': commande_ancienne, 
                                                }]
                           }).then(function(u){
                           
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
                            self.reload_cmd_vendeur(); 
                        }); }); });});
                        /// tester  actualisation de la page de cmd en attente////
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
                        }); }); 
                        /// tester  actualisation de la page de cmd en attente////
        }       
    };
    Registries.Component.extend(PaymentScreen, CustomButtonPaymentScreen);
    return CustomButtonPaymentScreen;
});