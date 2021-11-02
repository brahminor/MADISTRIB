# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class sale_order(models.Model):
    _inherit = "sale.order"
    
    acompte = fields.Monetary('Acompte', compute = "get_montants")
    montant_du = fields.Monetary('Montant dû', compute = 'get_montants')
    trait_tot = fields.Boolean('traité totalement depuis le pos',  copy = False, help = "Ce champ permet de déterminer si le traitement du sale order est terminé depuis le pos tel que tous les produits sont vendus ")
    

    @api.depends('amount_total','order_line')
    def get_montants(self):
        """
        cette fonction eprmet de calculer le montant du et l'acompte à partir des 
        acomptes payés et marqués dans les lignes des articles associées au SO
        """
        for record in self:
            somme_montant_paye = 0
            for  pod_order_record in record.order_line:
                if pod_order_record.product_id.type == 'service':
                    somme_montant_paye += pod_order_record.price_unit
            record.acompte = somme_montant_paye
            record.montant_du = record.amount_total - somme_montant_paye