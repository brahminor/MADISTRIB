# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from datetime import date

class res_partner(models.Model):
    _inherit = "res.partner"
    
    service_id = fields.Many2one('pos.service',string="Service",help="Ce champ permet d'indiquer le service du client")