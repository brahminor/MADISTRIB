# -*- coding: utf-8 -*-
from odoo import fields, models,api

class account_bank_statement_line(models.Model):
    _inherit = "account.bank.statement.line"

    is_accompte = fields.Boolean(string='Accompte')
    check_number = fields.Char('Numéro de chèque')
    check_date = fields.Date('Date remise')
    