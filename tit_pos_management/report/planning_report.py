# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from datetime import datetime
import xlrd
from datetime import date
from odoo.exceptions import ValidationError
from odoo.exceptions import UserError
class PlanningXlsx(models.AbstractModel):
    _name = 'report.tit_pos_management.planning_report'
    _inherit = 'report.report_xlsx.abstract'

    def generate_xlsx_report(self, workbook, data, plannings):
        #Fonction pour générer le rapport Excel. 
        date_debut = ""
        date_fin = ""
        planning = ""
        chauffeur = ""
        transporteur = ""
        preparateur = ""
        val_planning = ""
        planning_choix = ""
        for obj in plannings:
            date_debut = obj.date_debut
            date_fin = obj.date_fin
            planning = obj.planning
            chauffeur = obj.chauffeur
            transporteur = obj.transporteur
            preparateur = obj.preparateur

        bls = {}
        if planning == 'p_t_chauffeur':
            val_planning = 'Planning tournée chauffeur'
            if chauffeur:
                bls=self.env['stock.picking'].search([
                ('scheduled_date', '>=' ,date_debut),
                ('scheduled_date', '<=' ,date_fin),
                ('picking_type_code', '=' ,'outgoing'),
                ('chauffeur', '=' ,chauffeur),('state', '!=' ,'cancel')
                ])
                planning_choix = 'Chauffeur'
            else:
                bls=self.env['stock.picking'].search([
                ('scheduled_date', '>=' ,date_debut),
                ('scheduled_date', '<=' ,date_fin),
                ('picking_type_code', '=' ,'outgoing'),
                ('chauffeur', '!=' ,False),('state', '!=' ,'cancel')
                ])
                planning_choix = 'Chauffeur'

        elif planning == 'p_t_transporteur':
            val_planning = 'Planning tournée transporteurs'
            if transporteur:
                bls=self.env['stock.picking'].search([
                ('scheduled_date', '>=' ,date_debut),
                ('scheduled_date', '<=' ,date_fin),
                ('picking_type_code', '=' ,'outgoing'),
                ('transporteur', '=' ,transporteur),('state', '!=' ,'cancel')
                ])
                planning_choix = 'Transporteur'
            else :
                bls = self.env['stock.picking'].search([
                ('scheduled_date', '>=' ,date_debut),
                ('scheduled_date', '<=' ,date_fin),
                ('picking_type_code', '=' ,'outgoing'),
                ('transporteur', '!=' ,False),('state', '!=' ,'cancel')
                ])
                planning_choix = 'Transporteur'

        elif planning == 'p_p_commande':
            val_planning ='Planning Préparateur de commande'
            if preparateur:
                planning_choix = 'Préparateur '
                bls=self.env['stock.picking'].search([
                ('scheduled_date', '>=' ,date_debut),
                ('scheduled_date', '<=' ,date_fin),
                ('picking_type_code', '=' ,'outgoing'),
                ('preparateur', '=' ,preparateur),('state', '!=' ,'cancel')
                ])
            else:
                bls = self.env['stock.picking'].search([
                ('scheduled_date', '>=' ,date_debut),
                ('scheduled_date', '<=' ,date_fin),
                ('picking_type_code', '=' ,'outgoing'),
                ('preparateur', '!=' ,False),('state', '!=' ,'cancel')
                ])
                planning_choix = 'Préparateur '

        sheet_situation = workbook.add_worksheet("Planning")
        bold = workbook.add_format({'bold': True})
        heading_format = workbook.add_format({'font_size': 12, 'align': 'vcenter', 'bold': True , 'size':12, 'align': 'vcenter'})
        heading_format2 = workbook.add_format({'font_size': 12, 'align': 'center', 'bold': True , 'size':12, 'align': 'vcenter','valign': 'center'})
        border_format = workbook.add_format({'font_size': 12, 'align': 'center','size':13,'align': 'vcenter', 'border': 2,'valign': 'center'})
        border_format_2 = workbook.add_format({'font_size': 12, 'align': 'center','size':13,'align': 'vcenter', 'border': 2,'valign': 'center','color':'#4080bf','bold': True})
        lot_header = workbook.add_format({'font_size': 12, 'align': 'center','size':13,'align': 'vcenter', 'border': 1,'valign': 'center','bold': True})
        lot_body = workbook.add_format({'font_size': 12, 'align': 'center','size':12,'align': 'vcenter', 'border': 1,'valign': 'center'})
        total_body = workbook.add_format({'bold':True,'font_size': 12, 'align': 'center','size':12,'align': 'vcenter', 'border': 1,'valign': 'center'})
        normal_num_bold = workbook.add_format({'bold':True, 'num_format':'#,###0,000'})
        border_format.set_text_wrap()
        lot_body.set_text_wrap()
        sheet_situation.set_column('A:A', 40)
        sheet_situation.set_column('B:B', 40)
        sheet_situation.set_column('C:C', 40)
        sheet_situation.set_column('D:D', 40)
        sheet_situation.merge_range('A2:L2', ''+ val_planning +' du : '+ str(date_debut)+ ' jusqu au : '+ str(date_fin), heading_format2)
        sheet_situation.merge_range('A4:A4', planning_choix, border_format)
        sheet_situation.write(4,0,planning_choix,border_format)
        sheet_situation.write(4,1,"Référence du BL",border_format)
        sheet_situation.write(4,2,"Date prévue",border_format)
        sheet_situation.write(4,3,"Date effectué",border_format)
        row = 5
        colun = 0
        if len(bls) > 0 :
            for obj in bls:
                if planning == 'p_t_chauffeur':
                    sheet_situation.write(row,colun,str(obj.chauffeur.name),lot_body)
                elif planning == 'p_t_transporteur':
                    sheet_situation.write(row,colun,str(obj.transporteur.name),lot_body)
                elif planning == 'p_p_commande':
                    sheet_situation.write(row,colun,str(obj.preparateur.name),lot_body)
                sheet_situation.write(row,colun+1,str(obj.name),lot_body)
                sheet_situation.write(row,colun+2,str(obj.scheduled_date),lot_body)
                sheet_situation.write(row,colun+3,str(obj.date_done),lot_body)
                row +=1  