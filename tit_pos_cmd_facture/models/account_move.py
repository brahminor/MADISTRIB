# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class account_move(models.Model):
    _inherit = "account.move"

    avoir_client = fields.Float("Avoir client", compute='_get_avoir_client')
    @api.model
    def get_montant_du(self, facture_id):
        """
        cette fonction permet de récupérer le montant du de la facture qui 
        a l'id en paramètre.
        @param:
        -facture_id: l'id de la facture a retourner son montant du
        """
        record = self.env['account.move'].browse(facture_id)
        if record:
            return record.move_type
        return ''

    @api.model
    def crediter_avoir_client(self, facture_id, montant):
        """
        Cette fonction permet de créditer l'avoir du client associé à la facture 
        qui a l'id en paramètre avec le montant précisé
        @param:
        -facture_id: l'id de la facture à créditer l'avoir de leur client associé
        -montant: le montant à ajouter à l'avoir du client
        """
        record = self.env['account.move'].browse(facture_id)
        if record.partner_id:
            record.partner_id.avoir_client += float(montant)
        return True

    @api.model
    def get_ref_facture(self, id_fac):
        """
        Cette fonction permet de chercher la facture qui a l'id en paramètre
        et retourne son réference
        @param:
        -id_fac: id de la facture
        @return: référence de la facture
        """
        record = self.env['account.move'].browse(id_fac)
        if record:
            return record.name
        return ''

    @api.model
    def get_amount_totals(self, id_fac):
        """
        Cette fonction permet de chercher la facture qui a l'id en paramètre
        et retourne son montant total
        @param:
        -id_fac: id de la facture
        @return: référence de la facture
        """
        record = self.env['account.move'].browse(id_fac)
        if record:
            return record.amount_total
        return 0

    @api.model
    def get_amount_residual(self, id_fac):
        """
        Cette fonction permet de chercher la facture qui a l'id en paramètre
        et retourne son montant du
        @param:
        -id: id de la facture
        @return: référence de la facture
        """
        record = self.env['account.move'].browse(id_fac)
        if record:
            return record.amount_residual
        return 0

    @api.depends('partner_id')
    def _get_avoir_client(self):
        for record in self:
            record.avoir_client = record.partner_id.avoir_client
    
    @api.model
    def update_partner(self, donnes):
        """cette fonction est appelé depuis front-end afin de modifier le client 
        de la facture
        @param:
        - donnes : est un dictionnaire contenant l'id de la facture et l'id du client modifié 
        dedans
        """
        if 'client_modifie' in donnes and'facture_modifier_id' in donnes:
            if donnes['client_modifie'] != 0:
                facture_modifier = self.env['account.move'].browse(donnes['facture_modifier_id'])
                if facture_modifier:
                    for i in facture_modifier:
                        i.partner_id = donnes['client_modifie']
                return 1
            return 0
        return 0

    @api.model
    def add_invoice_payment(self, amount, invoice_ids, journal_id, session_id):        
        """
        cette fonction est appelé depuis pos et elle permet d'enregistrer
        le paiement d'une facture directement depuis le pos.
        @param:
            -amount : montant à payer
            -invoice_ids : la liste des factures à payer
            -journal_id : le journal choisi pour effectuer le paiement
            -session_id : session courante ouvert dans le pos
        """
        factures_a_payer = []
        for i in invoice_ids:
            factures_a_payer.append(int(i))
        
        amount = float(amount)
        invoice_id = int(invoice_ids[0])
        journal_id = int(journal_id)
        session_id = int(session_id)
        if amount > 0:
            #create bank statement
            journal = self.env['account.journal'].browse(journal_id)
            facture_selected = self.env['account.move'].browse(invoice_id)
            if facture_selected.move_type != 'out_refund':
                """ie le paiement est associé à une facture normale et non pas facture avoir client
                donc il faut débiter l'avoir client"""
                if journal.type == 'avoir_type' and journal.avoir_journal == True and facture_selected:
                    #si le journal choisi est un avoir, débiter le montant depuis avoir du client
                    if facture_selected.partner_id:
                        if amount > facture_selected.partner_id.avoir_client:
                            return facture_selected.partner_id.avoir_client
                        else:
                            facture_selected.partner_id.avoir_client = facture_selected.partner_id.avoir_client - amount

                # use the company of the journal and not of the current user
                company_cxt = dict(self.env.context, force_company=journal.company_id.id)
                
                payment_record = { 
                    'communication': "Paiement en caisse",
                    'journal_id': journal_id,
                    'amount': amount,
                }
                pay=self.env['account.payment.register'].with_context({'active_id': invoice_id, 'active_ids': factures_a_payer, 'active_model': 'account.move'}).create(payment_record)
                
                pay.action_create_payments()
                return 1
            else:
                """
                ie la facture à payer est un avoir client donc on ne va pas débiter 
                depuis l'avoir client encore une fois
                """
                # use the company of the journal and not of the current user
                company_cxt = dict(self.env.context, force_company=journal.company_id.id)
                
                payment_record = { 
                    'communication': "Paiement en caisse",
                    'journal_id': journal_id,
                    'amount': amount,
                }
                pay=self.env['account.payment.register'].with_context({'active_id': invoice_id,'active_ids': factures_a_payer,'active_model': 'account.move'}).create(payment_record)
                
                pay.action_create_payments()
                return 1
        return 0


    @api.model
    def get_amount_total(self, facture_ids):
        """
        Cette fontion permet de retourner la somme des montant dû des factures en
         paramètre,
         @param:
         -facture_ids : la liste des id des facture
        """
        factures_a_payer = []
        for i in facture_ids:
            factures_a_payer.append(int(i))

        montant_du_total = 0
        facture_selected = self.env['account.move'].browse(factures_a_payer)
        meme_client = 0
        if facture_selected:
            client_choisi = facture_selected[0].partner_id.id
        for  i in facture_selected:
            if i.partner_id.id != client_choisi:
                #si factures sont pour des clients différents donc il faut retourner -1 pour arrereter le paiement des factures en paramètre à la fois
                return -1
            montant_du_total += i.amount_residual
        return montant_du_total

    @api.model
    def get_client_et_avoir(self, facture_ids):
        """cette methode permet de retourner le client de facture en paramètre et son avoir
        @param:
        - facture_ids :  liste des id des facture
        """
        res={}
        invoice_id = int(facture_ids[0])
        facture_selected = self.env['account.move'].browse(invoice_id)
        if facture_selected:
            client_associe = self.env['res.partner'].browse(facture_selected.partner_id.id)
            if client_associe:
                return {'client_name': client_associe.name, 'avoir_client': client_associe.avoir_client}
            else:
                return res
        return res