# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class product_product(models.Model):
	_inherit = "product.product"

	@api.model
	def get_product_acompte(self):
		#cette fonstion permet de retourner id du produit acompte crée depuis le data
		related_model_id = self.env.ref('tit_pos_acomptes.article_acompte_pos').id
		if related_model_id :
			return related_model_id
		return 0