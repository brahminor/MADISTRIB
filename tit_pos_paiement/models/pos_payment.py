# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class pos_payment(models.Model):
	_inherit = "pos.payment"

	check_number = fields.Char('Numéro de chèque')
	check_date = fields.Date('Date remise')