odoo.define('tit_pos_order.verif_group_user', function (require) {
    "use strict";
    const PosComponent = require('point_of_sale.PosComponent');
    const { update_css } = require('tit_pos_order.CustomCashierScreen')
    const rpc = require('web.rpc');
    
    const verif_groupe = async () => {
        /* cette fonction permet de vérifier le groupe associé à l'utilisateur
        connecté à la session afin de lui mettre les bouton necessaire visibles
        et autre invisible selon le groupe trouvé.
        */
        if (PosComponent.env.pos.get_cashier()){
                let result = await rpc.query({
                        model: 'res.users',
                        method: 'verification_groupe_user_modified_in_pos',
                        args: [PosComponent.env.pos.get_cashier().user_id[0]],
                    });
                    if (result == 1) {
                        //vendeur
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").hide();//retour
                        contents.find(".ctrl_btnFactNonPaye").hide();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").show();//valider la commande
                        contents.find(".set-customer").show();//choisir client
                        contents.find(".pay").hide();//paiement
                        contents.find(".next").hide();//nouvelle commande après le paiement
                        $('.ticket-button').show(); // menu commandes du natif
                        $('.ticket_cmd_attente').hide();//cmd en attente
                        $('.ticket_cmd_vendeur').hide();//cmd validées par le vendeur
                        
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").hide();// factures non payées
                        contents.find(".devis_cmd_list").hide();//commandes b2b
                      
                    }
                    else if (result == 2) {
                        //caissier
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").hide();//retour
                        contents.find(".ctrl_btnFactNonPaye").show();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").hide();//valider la commande
                        contents.find(".set-customer").show();//choisir client
                        contents.find(".pay").show();//paiement
                        contents.find(".next").hide();//nouvelle commande après le paiement
                        $('.ticket-button').hide(); // menu commandes du natif
                        $('.ticket_cmd_attente').show();//cmd en attente
                        $('.ticket_cmd_vendeur').show();//cmd validées par le vendeur
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").show();// factures non payées
                        contents.find(".devis_cmd_list").hide();//commandes b2b
                    }
                    else if (result == 3) {
                        //comptable
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").hide();//retour
                        contents.find(".ctrl_btnFactNonPaye").show();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").hide();//valider la commande
                        contents.find(".set-customer").show();//choisir client
                        contents.find(".pay").show();//paiement
                        contents.find(".next").hide();//nouvelle commande après le paiement
                        $('.ticket-button').hide(); // menu commandes du natif
                        $('.ticket_cmd_attente').show();//cmd en attente
                        $('.ticket_cmd_vendeur').show();//cmd validées par le vendeur
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").show();// factures non payées 
                        contents.find(".devis_cmd_list").hide();//commandes b2b
                    }
                    else if (result == 5) {
                        //Responsable du service de livraison
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").hide();//retour
                        contents.find(".ctrl_btnFactNonPaye").hide();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").hide();//valider la commande
                        contents.find(".set-customer").hide();//choisir client
                        contents.find(".pay").show();//paiement
                        contents.find(".next").hide();//nouvelle commande après le paiement
                        $('.ticket-button').hide(); // menu commandes du natif
                        $('.ticket_cmd_attente').show();//cmd en attente
                        $('.ticket_cmd_vendeur').hide();//cmd validées par le vendeur 
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").hide();// factures non payées
                        contents.find(".devis_cmd_list").hide();//commandes b2b
                    }
                    else if (result == 6) {
                        //responsable de caisse
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").show();//retour
                        contents.find(".ctrl_btnFactNonPaye").show();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").hide();//valider la commande
                        contents.find(".set-customer").show();//choisir client
                        contents.find(".pay").show();//paiement
                        contents.find(".next").hide();//nouvelle commande après le paiement

                        $('.ticket-button').hide(); // menu commandes du natif
                        $('.ticket_cmd_attente').show();//cmd en attente
                        $('.ticket_cmd_vendeur').show();//cmd validées par le vendeur
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").show();// factures non payées
                        contents.find(".devis_cmd_list").hide();//commandes b2b
                    }
                    else if (result == 8) {
                        //responsable de commercial
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").hide();//retour
                        contents.find(".ctrl_btnFactNonPaye").show();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").hide();//valider la commande
                        contents.find(".set-customer").show();//choisir client
                        contents.find(".pay").show();//paiement
                        contents.find(".next").hide();//nouvelle commande après le paiement

                        $('.ticket-button').hide(); // menu commandes du natif
                        $('.ticket_cmd_attente').hide();//cmd en attente
                        $('.ticket_cmd_vendeur').hide();//cmd validées par le vendeur
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").show();// factures non payées
                        contents.find(".devis_cmd_list").show();//commandes b2b
                    }
                    else if (result == 9) {
                        //responsable de commercial
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").hide();//retour
                        contents.find(".ctrl_btnFactNonPaye").show();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").hide();//valider la commande
                        contents.find(".set-customer").show();//choisir client
                        contents.find(".pay").show();//paiement
                        contents.find(".next").hide();//nouvelle commande après le paiement

                        $('.ticket-button').hide(); // menu commandes du natif
                        $('.ticket_cmd_attente').hide();//cmd en attente
                        $('.ticket_cmd_vendeur').hide();//cmd validées par le vendeur
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").show();// factures non payées
                        contents.find(".devis_cmd_list").show();//commandes b2b
                    }

                    else if (result == 7) {
                        //admin du pos
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").show();//retour
                        contents.find(".ctrl_btnFactNonPaye").show();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").show();//valider la commande
                        contents.find(".set-customer").show();//choisir client
                        contents.find(".pay").show();//paiement
                        contents.find(".next").show();//nouvelle commande après le paiement
                        $('.ticket-button').show(); // menu commandes du natif
                        $('.ticket_cmd_attente').show();//cmd en attente
                        $('.ticket_cmd_valide').show();//cmd validées
                        $('.ticket_cmd_vendeur').show();//cmd validées par le vendeur
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").hide();// factures non payées
                        contents.find(".devis_cmd_list").show();//commandes b2b
                        
                    }
                    else if (result == 0) {
                        //ie simple utilisateur du pos
                        var contents = $('.pos-content');
                        contents.find(".ctrl_btnRetour").hide();//retour
                        contents.find(".ctrl_btnFactNonPaye").hide();//factures non payées
                        contents.find(".ctrl_btnValiderCmd").hide();//valider la commande
                        contents.find(".set-customer").show();//choisir client
                        contents.find(".pay").show();//paiement
                        contents.find(".next").show();//nouvelle commande après le paiement
                        $('.ticket-button').show(); // menu commandes du natif
                        $('.ticket_cmd_attente').hide();//cmd en attente
                        $('.ticket_cmd_valide').hide();//cmd validées
                        $('.ticket_cmd_vendeur').hide();//cmd validées par le vendeur
                        var contents2 = $('.screen_profile');
                        contents2.find(".fact_non_pay").hide();// factures non payées
                        contents.find(".devis_cmd_list").hide();//commandes b2b
                    }
            }
    };

    return { verif_groupe }
});