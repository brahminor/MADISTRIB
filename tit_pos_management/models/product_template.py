# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from datetime import datetime

class product_template(models.Model):
    _inherit = "product.template"
    
    tracking = fields.Selection([
        ('serial', 'By Unique Serial Number'),
        ('lot', 'By Lots'),
        ('none', 'No Tracking')], help="Ensure the traceability of a storable product in your warehouse.", string="Tracking", default='lot', required=True)
 
    state_qty = fields.Selection([
        ('reapprovisionner', 'A réapprovisionner'),
        ('none', '')], string="Réapprovisionnement", default='none')

    isAlerte =  fields.Boolean('Est alerter', default=False)
    dateAlerte =  fields.Date('Date alerte')
    seuil_alerte = fields.Float("Seuil d'alerte")
 
    @api.onchange('type')
    def _onchange_type(self):
        # Activer par défaut la case "lot" 
        res = super(product_template, self)._onchange_type()
        if self.type == 'consu' and self.tracking != 'lot':
            self.tracking = 'lot'

        return res

    def product_seuil_notif(self):
        # Fonction qui permet de déclancher le lancement du message à l'utilisateur 
        # pour lui indiquer qu'il y'a des produit qui sont arrivés au seuil
        id_s = self.env['product.template'].search([])
        for move in id_s:
            if move.active:
                if move.qty_available <= move.seuil_alerte:
                    move.write({'dateAlerte' : datetime.now()})
                    description = move.name +" est arrivé(e) au seuil d'alerte"
                    if  not move.isAlerte:  
                        message_id = self.env['mail.message'].create({          
                            'email_from': self.env.user.partner_id.email, 
                            'author_id': self.env.user.partner_id.id, 
                            'model': 'mail.channel',
                            'message_type': 'comment',
                            'body':  description ,
                            'subtype_id': self.env.ref('mail.mt_comment').id,
                            'channel_ids': [(4, self.env.ref('tit_pos_management.channel_stock_purchase_group').id)], 
                            'res_id': self.env.ref('tit_pos_management.channel_stock_purchase_group').id, 
                            'subject': 'Seuil Alerte',
                            'needaction' : True,
                            'need_moderation': True,
                                })
                        move.write({'isAlerte' : True ,'state_qty': 'reapprovisionner'})
        return True

    def enleve_seuil_notif(self):
        # Fonction qui permet de régler le statut d'alert dans le cas de réapprovisionnement de produit
        id_s = self.env['product.template'].search([])
        for move in id_s:
            if move.active:
                if move.qty_available > move.seuil_alerte:
                    move.write({'dateAlerte' : datetime.now()})
                    move.write({'isAlerte' : False ,'state_qty': 'none'})
                    
        return True




    

    

