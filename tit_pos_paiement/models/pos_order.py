# -*- coding: utf-8 -*-


from odoo import models, fields, api, _
from odoo.exceptions import UserError
from datetime import datetime

class pos_order(models.Model):
	_inherit = "pos.order"

	def _payment_fields(self, order, ui_paymentline):
		res = super(pos_order, self)._payment_fields(order,ui_paymentline)
		res['check_number'] = ui_paymentline.get('check_number', False)
		res['check_date'] = ui_paymentline.get('check_date', False)
		return res

