# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class accountFiscalPosition(models.Model):
    _inherit = "account.fiscal.position"

    client_francais = fields.Boolean(default = False, help = "En sélectionnant cette case, on précise que la position fiscale est un client français")
    
    