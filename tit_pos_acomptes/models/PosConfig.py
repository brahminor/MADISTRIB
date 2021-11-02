# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import fields, models, api, _

class PosConfig(models.Model):
    _inherit = 'pos.config'

    down_payment_product_id = fields.Many2one('product.product',
        string = "Produit acompte",
        help = "Ce produit sera utilisé comme acompte pour les devis/commandes .")