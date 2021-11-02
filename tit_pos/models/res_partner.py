# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from datetime import date

class res_partner(models.Model):
    _inherit = "res.partner"
    
    @api.model
    def _get_property_account_position_id(self):
        """
        cette fonction permet de retourner la position fiscale qu'elle a 
        client français cochée
        """
        position_fiscale=self.env['account.fiscal.position'].search([('client_francais','=',True)])
        if position_fiscale:
            return position_fiscale[0].id
        return 0
    
    @api.model
    def create_from_ui(self, partner):
        """ create or modify a partner from the point of sale ui.
            partner contains the partner's fields. """
        # image is a dataurl, get the data after the comma
        partners = {}
        contact = {}
        for key, value in partner.items():
            if key in ['contact_name', 'contact_phone', 'contact_email']:
                contact[key] = value
            elif key != 'contact_id':
                partners[key] = value
        if partners.get('image'):
            partners['image'] = partners['image'].split(',')[1]
        partner_id = partners.pop('id', False)
        if partner_id:  # Modifying existing partner
            self.browse(partner_id).write(partners)
        else:
            partners['lang'] = self.env.user.lang
            partner_id = self.create(partners).id
        
        return partner_id

    @api.model
    def utilsateur_atteind_limite(self, partner):
        """
        cette fonction utilisée par la page de création d'une commande sur front,
        elle permette de chercher la limite de crédit du client
        et chercher s'il a atteind la limite de crédit ou pas encore.
        """
        partner_id = self.env['res.partner'].search([('id','=',partner['id'])])
        limite_credit = 0.0
        if partner_id:
            limite_credit = partner_id[0].credit_limit
        somme_montants_du = 0.0
        today = str(date.today())
        factures_ids = self.env['account.move'].search([('partner_id', '=', partner['id']), ('invoice_date_due', '<', today)])
        for i in factures_ids:
            somme_montants_du += i.amount_residual
        
        if (limite_credit != 0 and limite_credit < somme_montants_du ):
            #c'est a dire le client a atteind la limite de crédit
            return 1
        else:
            #c'est à dire le client n'atteind plus la limite
            return 0

    @api.model
    def utilsateur_atteind_limite_pay(self, partner):
        """
        cette fonction utilisée par la page de paiement d'une commande sur front,
        cette fonction permette de chercher la limite de crédit du client
        et chercher s'il a atteind la limite de crédit selon les conditions de 
        regelement ou pas encore
        """
        partner_id = self.env['res.partner'].search([('id','=',partner['id'])])
        limite_credit = 0.0
        if partner_id:
            limite_credit = partner_id[0].credit_limit
        somme_montants_du = 0.0
        today = str(date.today())
        factures_ids = self.env['account.move'].search([('partner_id', '=', partner['id']), ('invoice_date_due', '<', today)])
        for i in factures_ids:
            somme_montants_du += i.amount_residual
        if (limite_credit != 0 and limite_credit < somme_montants_du ):
            #c'est a dire le client a atteind la limite de crédit
            return 1
        else:
            #c'est à dire le client n'atteind plus la limite
            return 0
    @api.model
    def avoir_depasse_ou_pas(self, client_choisi, payment_lignes):
        """
        Cette fonction permet de vérifier si le montant à payer par avoir 
        est > avoir possible du client ou pas
        
        @param:
        -client_choisi : id du client choisi dans le point de vente (pos)
        -payment_lignes : la liste des lignes des paiements récupérés depuis la page 
        du paiement du pos (chauqe élément de la liste contient id du moyen de paiement,
        et montant à payer par ce dernier)

        """
        
        montant_avoir_positif = 0
        for i in payment_lignes:
            meth_pay = self.env['pos.payment.method'].browse(i.get('id_meth'))
            if meth_pay and meth_pay[0].methode_avoir and i.get('montant') > 0:
                    montant_avoir_positif += (i.get('montant'))

        if montant_avoir_positif != 0:
            # ie il existe des lignes de paiements tel que la méthode de paiement est avoir
            client_associe = self.env['res.partner'].browse(client_choisi)
            if client_associe and client_associe[0].avoir_client <= 0:
                return 0
            elif client_associe and client_associe[0].avoir_client < montant_avoir_positif:
                # ie l'avoir est < au montant à payer depuis l'avoir possible du client
                return client_associe[0].avoir_client
        return -1
    @api.model
    def avoir_du_client(self, client_choisi):
        """
        Cette fonction permet de retourner l'avoir du client
        @param:
        - client_choisi: l'id du client choisi depuis le pos 
        """
        client_associe = self.env['res.partner'].browse(client_choisi)
        if client_associe:
            return client_associe[0].avoir_client
        else:
            return 0