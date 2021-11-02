# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from datetime import datetime
from odoo.exceptions import UserError, ValidationError

class pos_commande(models.Model):
    _name = "pos.cmd_vendeur"
    
    name = fields.Char(track_visibility = 'always')
    journal_id = fields.Many2one('account.journal',string="Journal")
    commande_suivante = fields.Many2one('pos.cmd_vendeur', string = "Commande suivante", help='Ce champ permet d\'indiquer la commande suivante contenant la suite du paiement')
    partner_id = fields.Many2one('res.partner', string = "Client")
    session_id = fields.Many2one('pos.session', string = "Session")
    vendeur_name = fields.Char(string = 'Vendeur', help="nom du vendeur quia a crée la commande")
    config_id = fields.Many2one('pos.config', related = "session_id.config_id", string = "Point de vente", store = True)
    date = fields.Datetime('Date', help = "Date de la commande", default = fields.Datetime.now())
    state = fields.Selection([('draft','Brouillon') ,('en_attente','En attente'), ('archived','Archivé'), ('done','Terminé'), ('annule','Annulé')], string = "Statut")
    currency_id = fields.Many2one('res.currency', string = "Devise" )
    order_line = fields.One2many('pos.cmd_vendeur.line', 'order_id')
    company_id = fields.Many2one('res.company', related = "session_id.config_id.company_id")
    currency_id = fields.Many2one('res.currency', string = "Devise", default = lambda self: self.env.user.company_id.currency_id)
    payment_ids = fields.One2many('pos.payment_cmd', 'pos_commande_id', string='Paiements')

    @api.model
    def create_commande(self, commande):
        #cette fonction permet de créer la commande en attente depuis point of sale ui
        """
        commande: dic contenant les données de la commande à créer
        """
        commande_coordonnee = dict()
        if 'journal_id' in  commande:
            commande_coordonnee['journal_id'] = commande['journal_id']
        if 'partner_id' in  commande:
            commande_coordonnee['partner_id'] = commande['partner_id']
        commande_coordonnee['state'] = "en_attente"
        if 'session_id' in commande:
            commande_coordonnee['session_id'] = commande['session_id']
        if 'vendeur_name' in commande:
            commande_coordonnee['vendeur_name'] = commande['vendeur_name']
        
        commande_id = self.create(commande_coordonnee).id
        return commande_id

    @api.model
    def delete_ancienne_cmd(self, donne):
        #cette fonction permet de supprimer la commande validée par vendeur
        """
        donne: dic contenant les données de la commande à supprimer
        """
        if 'commande_ancienne' in donne:
            cmd_record = self.env['pos.cmd_vendeur'].browse(donne['commande_ancienne'])
            if cmd_record:
                lignes_cmd = self.env['pos.cmd_vendeur.line'].search([('order_id','=',donne['commande_ancienne'])])
                for i in lignes_cmd:
                    i.unlink()
            cmd_record.unlink()

    @api.model
    def annuler_cmd(self, cmd):
        #cette fonction permet d'annuler l'acompte 
        """
        cmd: dic contenant les données de la commande à supprimer
        """
        if 'id_commande' in cmd:
            commande_courante = self.env['pos.cmd_vendeur'].browse(cmd['id_commande'])
            for i in commande_courante:
                i.state = 'annule'
                #chercher s'il y a des fils associés à cet acompte afin de les annuler aussi
                commande_archive = self.env['pos.cmd_vendeur'].search([('commande_suivante','=',i.id)])
                if commande_archive:
                    self.annuler_cmd_fils(commande_archive)
            return 1
        else:
            return 0
    def annuler_cmd_fils(self, commande_archive):
        #annuler la commande en paramètre
        """
        commande_archive: les cmd aricvées à supprimer
        """
        for j in commande_archive:
            j.state = 'annule'
            #chercher s'il y a des fils associés à cet acompte afin de les annuler aussi
            commande_archive2 = self.env['pos.cmd_vendeur'].search([('commande_suivante','=',j.id)])
            self.annuler_cmd_fils(commande_archive2)
    

class pos_commande_line(models.Model):
    _name = "pos.cmd_vendeur.line"
    
    product_id = fields.Many2one('product.product', string = "Article")
    qty = fields.Float('Quantité')
    price_unit = fields.Monetary('Prix unitaire')
    discount = fields.Float('Remise(%)')
    tax_ids = fields.Many2many('account.tax', string = "Taxes")
    order_id = fields.Many2one('pos.cmd_vendeur')    
    company_id = fields.Many2one('res.company', related = "order_id.company_id")
    price_ttc = fields.Monetary('Prix TTC', compute = "get_price_ttc", store = True)
    currency_id = fields.Many2one('res.currency', string = "Devise", default = lambda self: self.env.user.company_id.currency_id)
    company_id = fields.Many2one('res.company', related = "order_id.company_id")
    
    @api.depends('price_unit','tax_ids')
    def get_price_ttc(self):
        #cette fonction permet de calculer le prix TTC
        for res in self:
            tax_amount = 0
            for tax in res.tax_ids:
                tax_amount += (res.price_unit * tax.amount/100)
            res.price_ttc = res.price_unit + tax_amount

    @api.model
    def create_commande_line(self, commande_line):
        #cette fonction permet de créer la ligne de commande en attente
        """
        @param: commande_line : les lignes à créer
        """
        commande_id = self.create(commande_line).id
        return commande_id