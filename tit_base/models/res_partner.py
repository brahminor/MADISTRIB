# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from datetime import date

class res_partner(models.Model):
    _inherit = "res.partner"
    
    siren_company = fields.Char("Siren")
    nic_company = fields.Char("NIC")
    avoir_client = fields.Float("Avoir")
    property_account_position_id = fields.Many2one(default=lambda self: self._get_property_account_position_id())