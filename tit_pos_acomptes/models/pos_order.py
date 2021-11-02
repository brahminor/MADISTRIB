# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

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
				if journal.type == 'avoir_type' and journal.avoir_journal == True and cmd_principale:
					#si le journal choisi est un avoir, débiter le montant depuis avoir du client
					client_associe = self.env['res.partner'].browse(cmd_principale.partner_id.id)
					if client_associe:
						if amount > client_associe.avoir_client:
							return client_associe.avoir_client
						else:
							client_associe.avoir_client = client_associe.avoir_client - amount
			
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