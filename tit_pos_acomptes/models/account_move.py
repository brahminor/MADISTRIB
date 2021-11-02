# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class account_move(models.Model):
    _inherit = "account.move"

    @api.model
    def add_invoice_payment_acompte(self, amount, invoice_ids, id_meth_pay):        
        """
        cette fonction est appelé depuis pos et elle permet d'enregistrer
        le paiement d'une facture directement depuis le pos.
        @param:
            -amount : montant à payer
            -invoice_ids : la liste des factures à payer
            -id_meth_pay : la méthode de paiement choisi pour effectuer le paiement
        """
        factures_a_payer = []
        for i in invoice_ids:
            factures_a_payer.append(int(i))
        
        amount = float(amount)
        invoice_id = int(invoice_ids[0])
        methode_paiement_record = self.env['pos.payment.method'].browse(int(id_meth_pay))
        if methode_paiement_record:
            #chercher le journal associé à la méthode de paiement utilisée pour le paiement sur le pos
            journal_id = int(methode_paiement_record[0].cash_journal_id)
            journal = self.env['account.journal'].browse(journal_id)
            if amount > 0:
                facture_selected = self.env['account.move'].browse(invoice_id)
                # use the company of the journal and not of the current user
                company_cxt = dict(self.env.context, force_company=journal.company_id.id)
                
                payment_record = { 
                    'communication': "Paiement en caisse",
                    'journal_id': journal_id,
                    'amount': amount,
                }
                pay=self.env['account.payment.register'].with_context({'active_id': invoice_id,'active_ids': factures_a_payer,'active_model': 'account.move'}).create(payment_record)
                
                pay.action_create_payments()
                return -3
            return -2
        return -1