# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, models, modules, _

class resUsers(models.Model):
    _inherit = 'res.users'
    
    @api.model
    def verification_groupe_user_modified_in_pos(self, user_id):
        #cette fonction permet de vérifier le groupe associé à l'utilisateur en paramètre
        #@param : user_id : id du user connecté depuis pos
        user_actif = self.env['res.users'].browse(user_id)
        if user_actif and user_actif.has_group('tit_pos_order.group_vendeur'):
            return 1
        elif user_actif and user_actif.has_group('tit_pos_order.group_caissier'):
            return 2
        elif user_actif and user_actif.has_group('tit_pos_order.group_comptable'):
            return 3
        elif user_actif and user_actif.has_group('tit_pos_order.group_resp_logistique'):
            return 4
        elif user_actif and user_actif.has_group('tit_pos_order.group_srvce_livraison'):
            return 5
        elif user_actif and user_actif.has_group('tit_pos_order.group_resp_caisse'):
            return 6
        elif user_actif and user_actif.has_group('point_of_sale.group_pos_manager'):
            return 7
        return 0