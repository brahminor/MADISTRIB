# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class stock_picking(models.Model):
    _inherit = "stock.picking"

    preparateur = fields.Many2one('hr.employee', string = "Préparateur")
    chauffeur = fields.Many2one('hr.employee', string = "Chauffeur")
    transporteur = fields.Many2one('hr.employee', string = "Transporteur")