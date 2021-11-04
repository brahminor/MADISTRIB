# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
from datetime import timedelta
from datetime import datetime

class planning_preparation(models.TransientModel):
    _name = "planning.preparation_wizard"
    _description = "Wizard de planning de préparation"

    date_debut = fields.Date(string = 'Date debut')
    date_fin = fields.Date(string = 'Date fin')
    planning = fields.Selection([
        ('p_t_chauffeur', 'Planning tournée chauffeur'),
        ('p_t_transporteur', 'Planning tournée transporteurs'),
        ('p_p_commande', 'Planning Préparateur de commande')], string = "Planning", required = True)

    chauffeur = fields.Char(string = "Chauffeur")
    transporteur = fields.Char(string = "Transporteur")
    preparateur = fields.Char(string = "Préparateur")

    def print_report(self):
        #Fonction pour télécharger le rapport en Excel. 
        if self.date_debut > self.date_fin:
            raise ValidationError("Date de début doit être inferieur du date fin")
        else:
            bls = {} 
            if self.planning == 'p_t_chauffeur':
                if self.chauffeur:
                    bls = self.env['stock.picking'].search_read([
                    ('scheduled_date', '>=' ,self.date_debut),
                    ('scheduled_date', '<=' ,self.date_fin),
                    ('picking_type_code', '=' ,'outgoing'),
                    ('chauffeur', '=' ,self.chauffeur),
                    ('state', '!=' ,'cancel')
                    ],[])
                else:
                    bls = self.env['stock.picking'].search_read([
                    ('scheduled_date', '>=' ,self.date_debut),
                    ('scheduled_date', '<=' ,self.date_fin),
                    ('picking_type_code', '=' ,'outgoing'),
                    ('chauffeur', '!=' ,False),
                    ('state', '!=' ,'cancel')
                    ],[])

            elif self.planning == 'p_t_transporteur':
                if self.transporteur:
                    bls = self.env['stock.picking'].search([
                    ('scheduled_date', '>=' ,self.date_debut),
                    ('scheduled_date', '<=' ,self.date_fin),
                    ('picking_type_code', '=' ,'outgoing'),
                    ('transporteur', '=' ,self.transporteur),
                    ('state', '!=' ,'cancel')
                    ])
                else :
                    bls = self.env['stock.picking'].search([
                    ('scheduled_date','>=',self.date_debut),
                    ('scheduled_date','<=',self.date_fin),
                    ('picking_type_code','=','outgoing'),
                    ('transporteur','!=',False),
                    ('state','!=','cancel')
                    ])

            elif self.planning == 'p_p_commande':
                if self.preparateur:
                    bls = self.env['stock.picking'].search([
                    ('scheduled_date', '>=' ,self.date_debut),
                    ('scheduled_date', '<=' ,self.date_fin),
                    ('picking_type_code', '=' ,'outgoing'),
                    ('preparateur', '=' ,self.preparateur),
                    ('state', '!=' ,'cancel')
                    ])
                else:
                    bls = self.env['stock.picking'].search([
                    ('scheduled_date', '>=' ,self.date_debut),
                    ('scheduled_date', '<=' ,self.date_fin),
                    ('picking_type_code','=','outgoing'),
                    ('preparateur', '!=' ,False),('state', '!=' ,'cancel')
                    ])
            if len(bls)>0: 
                report_action = self.env.ref('tit_pos_management.planning_xlsx').report_action(self)       
                report_action['close_on_report_download'] = True
                return report_action
            else :
                raise ValidationError("Aucun résultat trouvé")    
        



