# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError

class account_move(models.Model):
	_inherit = "account.move"

	@api.model
	def update_avoir(self, facture_id, lignes_produits):
		"""
		Cette fonction permet de modifier les lignes de facture avoir en brouillon
		depuis le pos ( modification sera une modification de la qte d'un article 
		à retourner ou bien suppession d'une ligne de facture pour un certain article
		afin de ne pas le retourner)
		"""
		facture_record = self.env['account.move'].browse(facture_id)
		id_ecr_compta_ancienne = []
		for u in facture_record.line_ids:
			id_ecr_compta_ancienne.append(u.id)
		ecriture_comptable_ancienne = self.env['account.move.line'].search([('id', 'in', id_ecr_compta_ancienne)])
		list_new_lignes_produits = [];
		for i in lignes_produits:
			record_ligne_facture = self.env['account.move.line'].browse(i[0])
			if record_ligne_facture:
				id_result = self.env['account.move.line'].create({'product_id': record_ligne_facture.product_id.id,
					'quantity': i[1],
					'product_uom_id': record_ligne_facture.product_uom_id.id,
					'account_id': record_ligne_facture.account_id.id,
					'price_unit': record_ligne_facture.price_unit,
					'tax_ids': [(6, 0, record_ligne_facture.tax_ids.ids)],
					'move_id': 0,
					'currency_id': record_ligne_facture.currency_id.id,
					})
				list_new_lignes_produits.append(id_result.id)
		facture_record.write({'invoice_line_ids': [(6, 0, list_new_lignes_produits)]})
		
		return True

	@api.model
	def get_avoir_client(self, partner_id):
		"""
		Cette fonction permet de chercher l'avoir du client et le retourner
		par la suite
		@param:
		-partner_id: id du client
		"""
		partner_record = self.env['res.partner'].browse(partner_id)
		if partner_record:
			return partner_record.avoir_client
		return 0

	@api.model
	def ajouter_avoir_facture(self, facture_parametre):
		"""
		Cette fonction permet d'ajouter un avoir sur la facture
		@param:
		-facture_parametre: un dictionnaire contenant l'id de la facture 
		sur laquelle on veut ajouter un avoir
		Cette fonction permet de retourner un dictionnaire cotenant les 
		données de la facture avoir client générée.
		"""
		if 'facture_modifier_id' in facture_parametre:
			facture_modifier_id = facture_parametre['facture_modifier_id']
			record = self.env['account.move'].browse(facture_modifier_id)
			if record:
				id_fac_list = []
				id_fac_list.append(int(facture_modifier_id))
				avoir_record = { 
					'reason': "Avoir sur facture",
					'date_mode': 'custom',
				}
				pay=self.env['account.move.reversal'].with_context({'active_id': facture_modifier_id,'active_ids': id_fac_list   ,'active_model': 'account.move'}).create(avoir_record)
				
				result = pay.reverse_moves_from_pos()
				if result:
					return {'id': result[0].id,
					'name': result[0].name,
					'amount_total': result[0].amount_total,
					'amount_residual': result[0].amount_residual,
					'partner_id': [result[0].partner_id.id, result[0].partner_id.name]
					}
			return False
class AccountMoveLine(models.Model):
	_inherit = 'account.move.line'

	move_id = fields.Many2one('account.move', required=False)

class AccountMoveReversal(models.TransientModel):
	_inherit = 'account.move.reversal'

	def reverse_moves_from_pos(self):
			"""
			Cette fonction contient le meme traitement du reverse_moves c'ets du 
			copier coller sauf que le retour est différent, cette fonction permet 
			de confirmer l'ajout de l'avoir à une facture
			Cette fonction permet de retourner la facture avoir client générée
			"""
			self.ensure_one()
			moves = self.move_ids

			# Create default values.
			default_values_list = []
			for move in moves:
				default_values_list.append(self._prepare_default_reversal(move))

			batches = [
				[self.env['account.move'], [], True],   # Moves to be cancelled by the reverses.
				[self.env['account.move'], [], False],  # Others.
			]
			for move, default_vals in zip(moves, default_values_list):
				is_auto_post = bool(default_vals.get('auto_post'))
				is_cancel_needed = not is_auto_post and self.refund_method in ('cancel', 'modify')
				batch_index = 0 if is_cancel_needed else 1
				batches[batch_index][0] |= move
				batches[batch_index][1].append(default_vals)

			# Handle reverse method.
			moves_to_redirect = self.env['account.move']
			for moves, default_values_list, is_cancel_needed in batches:
				new_moves = moves._reverse_moves(default_values_list, cancel=is_cancel_needed)

				if self.refund_method == 'modify':
					moves_vals_list = []
					for move in moves.with_context(include_business_fields=True):
						moves_vals_list.append(move.copy_data({'date': self.date if self.date_mode == 'custom' else move.date})[0])
					new_moves = self.env['account.move'].create(moves_vals_list)

				moves_to_redirect |= new_moves

			self.new_move_ids = moves_to_redirect
			return self.new_move_ids