# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class pos_session(models.Model):
	_inherit = "pos.session"

	def action_pos_session_validate(self):
		"""
		cette fonction permet d'annuler les bl crée afin de réserver la qte des produits
		vendus depuis le pos pour éviter le déstockage dupliqué
		"""
		result = super(pos_session, self).action_pos_session_validate()
		pos_order = self.env['pos.order'].search([('session_id', '=', self.id)])
		for record in pos_order:
			if record.bon_livraison:
					if record.bon_livraison.state != 'cancel' and record.bon_livraison.state != 'done':
						record.bon_livraison.action_cancel()
						record.bon_livraison.unlink()
		return result