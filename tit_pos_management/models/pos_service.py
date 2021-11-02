# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class pos_service(models.Model):
    _name = "pos.service"

    name = fields.Char(string='Nom du service', help="Ce champ permet d'indiquer le nom du service")
    reference = fields.Char(string="Référence", default='New', readonly=True)

    @api.model
    def create(self, vals):
        obj = super(pos_service, self).create(vals)
        if obj.reference == 'New':
            number = self.env['ir.sequence'].get('seq.service.sequence') or '/'
            obj.write({'reference': number})
        return obj
    