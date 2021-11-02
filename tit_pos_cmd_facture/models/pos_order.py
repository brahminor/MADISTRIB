# -*- coding: utf-8 -*-

from odoo import models, fields, api, _

class pos_order(models.Model):
    _inherit = "pos.order"
    
    etat_cmd = fields.Selection([('validee', "Validée"),('en_cours_prep','En cours de préparation'), ('expediee','Expédiée'), ('livree','Livrée')], default='validee', string='Etat expédition', help="Ce champ permet d'indiquer l'état de la commande", track_visibility = 'always')
    level_progress = fields.Integer(string="Etat expédition", compute='_onchange_etat_cmd')

    @api.depends('etat_cmd')
    def _onchange_etat_cmd(self):
        for record in self:
            if record.etat_cmd == 'validee':
                record.level_progress = 25
            elif record.etat_cmd == 'en_cours_prep':
                record.level_progress = 65
            elif record.etat_cmd == 'expediee':
                record.level_progress = 85
            elif record.etat_cmd == 'livree':
                record.level_progress = 100

    def cmd_en_cours_prep(self):
        self.etat_cmd = 'en_cours_prep'

    def cmd_expediee(self):
        self.etat_cmd = 'expediee'

    def cmd_livree(self):
        self.etat_cmd = 'livree'
