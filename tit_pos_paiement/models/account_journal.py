# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class account_journal(models.Model):
	_inherit = "account.journal"

	deferred_check = fields.Boolean('Chèque différé', help="Cocher cette case si c'est un journal pour les chèques différé dans le pos")
	check= fields.Boolean('Chèque', help="Cocher cette case si c'est un journal pour les chèques dans le pos")
	check_kdo= fields.Boolean('Chèque KDO', help="Cocher cette case si c'est un journal pour les chèques KDO dans le pos")
	avoir_journal = fields.Boolean('Journal d\'avoir', help='Cocher cette case pour considérer ce journal pour les avoir')
	type = fields.Selection(selection_add=[('avoir_type', 'Avoir')], ondelete={'avoir_type': 'cascade'})

	@api.onchange('type')
	def on_change_type_user(self):
		self.deferred_check = False

	@api.onchange('type')
	def on_change_type_user_journal(self):
		self.check = False

	@api.onchange('type')
	def on_change_type_journal_kdo(self):
		self.check_kdo = False

	@api.onchange('type')
	def onchange_type_general(self):
		self.avoir_journal = False