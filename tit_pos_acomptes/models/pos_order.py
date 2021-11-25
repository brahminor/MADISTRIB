# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class pos_order(models.Model):
	_inherit = "pos.order"

	bon_livraison = fields.Many2one('stock.picking', string = "Bon de livraison", help = "Ce champ à une relation avec le bon de livraison qui permet de réserver les qtes des produits à vendre au client")

	@api.model
	def creer_facture(self, pos_commande, num_recu, id_choix_pop_up, valeur_saisie, id_meth_pay, amount):
		"""
		Cette fonction permet de créer une facture pour l'acompte à payer 
		depuis le pos en faison l'appel à la methode create_invoices_from_pos()
		@param:
		-pos_commande: ancienne commande sélectionnée
		-num_recu: numéro de reçu de la nouvelle commande générée
		-id_choix_pop_up: l'option sélectionnée lors du paiement de l'acompte
		soit par %(= 20) ou par montant fixe (=10)
		-valeur_saisie: down_payment saisi sur le pop up
		-id_meth_pay: l'id de la méthode de paiement utilisée pour l'acompte
		-amount: montant à payer comme acompte
		Cette fonction permet de retourner des valeurs négatifs lors des erreurs 
		et le résultat obtenue suite à l'appel de la fontion qui permet de créer 
		la facture pour l'acompte payé associé au SO
		"""
		amount = float(amount)
		methode_paiement_record = self.env['pos.payment.method'].browse(int(id_meth_pay))
		if methode_paiement_record:
			journal_id = int(methode_paiement_record[0].cash_journal_id)
		methode_paiement_record = self.env['pos.payment.method'].browse(int(id_meth_pay))
		if methode_paiement_record:
			journal_id = int(methode_paiement_record[0].cash_journal_id)
			if amount > 0:
				cmd_principale = self.env['sale.order'].browse(pos_commande)
				#create bank statement
				journal = self.env['account.journal'].browse(journal_id)
				so = []
				invoice_generated = 0
				for i in cmd_principale:
					so.append(int(i.id))
				if cmd_principale:
					if id_choix_pop_up == 10:
						#ie avec % ou montant fixe
						payment_record = { 
							'advance_payment_method': 'percentage',
							'amount': valeur_saisie,
						}
					elif id_choix_pop_up == 20:
						#ie avec % ou montant fixe
						payment_record = { 
							'advance_payment_method': 'fixed',
							'fixed_amount': valeur_saisie,
						}
					pay = self.env['sale.advance.payment.inv'].with_context({'active_id': cmd_principale.id,'active_ids': so,'active_model': 'sale.order'}).create(payment_record)
					invoice_generated = pay.create_invoices_from_pos()
					invoice_generated.action_post()
					result = invoice_generated.add_invoice_payment_acompte(invoice_generated.amount_total, [invoice_generated.id], id_meth_pay)
				
				return result
			else:
				return -2
		return -1

	@api.model
	def fill_commande_principale(self, pos_commande, num_recu):
		"""cette fontion permet d'associer le bc au devis/commande et remplire le 
		tableau des produits du devis par le produit acompte associé 
		et permet de mettre de rendre le champ trait_tot du sale order en True
		dans le cas du transfert de  la totalité du sale order vers le pos
		et pertmette par la suite de débiter avoir client dans le cas d'une vente
		avec avoir
		@param:
		- pos_commande: id du devis (sale order) principal
		- num_recu: référence  de la commande générée (pos order)
		"""
		
		pos_order = self.env['pos.order'].search([('pos_reference', '=', num_recu)])
		#récupération de l'id du produit acompte
		is_product_acompte = self.env['product.product'].get_product_acompte()		
		
		
		ligne_commande = []#cette liste contienne la liste des lignes des articles vendus (différent que le produit acompte)
		for ligne in pos_order.lines:
			if ligne.product_id.id != is_product_acompte:
				ligne_commande.append({'product_id': ligne.product_id.id, 'qte': ligne.qty})
		
		if len(ligne_commande) > 0:
			"""créer un bon de livraison pour réserver les qtes des produits vendu 
			depuis le pos (vuq que les bl ne sont pas générés lors d'une vente 
			depuis le pos si et seulement si on ferme la session et on valide 
			les écritures comptables)"""
			new_name = str((self.name)) + '(Pour réservation)'
			bl_id = self.env['stock.picking'].create_stock_picking({'partner_id': self.partner_id, 'order_id': self.id, 'origin': new_name})
			if bl_id:
				for i in ligne_commande:
					self.env['stock.move'].create_stock_move({'picking_id': bl_id, 'product_id': i['product_id'], 'qty': i['qte']})
				bl_record = self.env['stock.picking'].browse(bl_id)
				if bl_record:
					bl_record.action_confirm()
					bl_record.action_assign()
					pos_order.write({'bon_livraison': bl_record.id})

		#voir si meth de paiement est avoir donc débiter depuis avoir du client
		list_payment = []
		for j in pos_order.payment_ids:
			#récupérer dans une liste les methodes de paiements utilisés dans la commande
			if j.payment_method_id.id not in list_payment:
				list_payment.append(j.payment_method_id.id)
		for k in list_payment:
			payment_recrod = self.env['pos.payment'].search([('pos_order_id', '=', pos_order.id),('payment_method_id', '=', k)])
			montant_a_payer = 0
			for l in payment_recrod:
				montant_a_payer += l.amount
			if payment_recrod.payment_method_id.cash_journal_id:
				if payment_recrod.payment_method_id.cash_journal_id.type == 'avoir_type' and payment_recrod.payment_method_id.cash_journal_id.avoir_journal == True and montant_a_payer > 0:
					pos_order.partner_id.avoir_client -= float(montant_a_payer)

	@api.model
	def validate_facture(self, pos_commande, num_recu):
		"""cette fontion  permette d'enregistrer le paiement de la facture associée
		au pos order automatiquement après la validation du paiement depuis le pos
		@param:
		- pos_commande: id du devis (sale order) principal
		- num_recu: référence  de la commande générée (pos order)
		"""
		
		pos_order = self.env['pos.order'].search([('pos_reference', '=', num_recu)])
		if pos_order.account_move:
			"""
			ie cette commande admet une facture générée:
			Enregistrer le paiement de la facture liée au pos order automatiquement après la validation 
			du paiement de la commande sur le pos
			"""
			list_payment = []
			for j in pos_order.payment_ids:
				#récupérer dans une liste les methodes de paiements utilisés dans la commande
				if j.payment_method_id.id not in list_payment:
					list_payment.append(j.payment_method_id.id)

			for k in list_payment:
				"""pour chaque methode de paiement on fait la somme des montants et enregistrer le paiement
				de la facture du pos order avec le montant résultant et le journal associé à 
				la methode de paiement courante"""
				payment_recrod = self.env['pos.payment'].search([('pos_order_id', '=', pos_order.id),('payment_method_id', '=', k)])
				montant_a_payer = 0
				"""faire la somme des montants pour chaque ligne de paiement afin
				d'enregistrer le paiement de la facture avec le journal associé"""
				for l in payment_recrod:
					montant_a_payer += l.amount
				if payment_recrod:
					if not payment_recrod[0].payment_method_id.cash_journal_id:
						raise UserError(_("Facture non payée !\n Veuillez remplir le journal associé à chaque méthode de paiement utilisée s.v.p"))
					else:
						if pos_order.account_move.move_type == 'out_refund':
							payment_partial = {
							'communication': pos_order.pos_reference,
							'journal_id': payment_recrod[0].payment_method_id.cash_journal_id.id,
							'amount': montant_a_payer * (-1),
							}
						else:
							payment_partial = {
							'communication': pos_order.pos_reference,
							'journal_id': payment_recrod[0].payment_method_id.cash_journal_id.id,
							'amount': montant_a_payer,
							}
						pay=self.env['account.payment.register'].with_context({'active_id': pos_order.account_move.id,'active_ids': [pos_order.account_move.id],'active_model': 'account.move'}).create(payment_partial)
						pay.action_create_payments()