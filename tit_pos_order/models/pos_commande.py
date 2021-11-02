# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from dateutil.relativedelta import relativedelta
from datetime import datetime, timedelta
from odoo.exceptions import UserError, ValidationError

class pos_commande(models.Model):
    _name = "pos.commande"
    
    name = fields.Char(track_visibility = 'always')
    journal_id = fields.Many2one('account.journal',string="Journal")
    commande_suivante = fields.Many2one('pos.commande', string = "Commande suivante", help='Ce champ permet d\'indiquer la commande suivante contenant la suite du paiement')
    partner_id = fields.Many2one('res.partner', string = "Client")
    session_id = fields.Many2one('pos.session', string = "Session")
    config_id = fields.Many2one('pos.config', related = "session_id.config_id", string = "Point de vente", store = True)
    date = fields.Datetime('Date', help = "Date de la commande", default = fields.Datetime.now())
    state = fields.Selection([('draft','Brouillon') ,('en_attente','En attente'), ('archived','Archivé'), ('done','Terminé'), ('annule','Remboursée')], string = "Statut")
    currency_id = fields.Many2one('res.currency', string = "Devise" )
    order_line = fields.One2many('pos.commande.line', 'order_id')
    company_id = fields.Many2one('res.company', related = "session_id.config_id.company_id")
    amount_total = fields.Monetary('Total TTC', compute = "get_amount_total", store = True)
    currency_id = fields.Many2one('res.currency', string = "Devise", default = lambda self: self.env.user.company_id.currency_id)
    acompte = fields.Monetary('Acompte')
    montant_du = fields.Monetary('Montant dû', compute='_get_montant', help='Ce champ contient le montant dû reste à payer ')
    payment_ids = fields.One2many('pos.payment_cmd', 'pos_commande_id', string='Paiements')

    def unlink(self):
        raise ValidationError(_('Attention! \n Vous ne pouvez pas supprimer les acomptes déjà validés'))

    @api.depends('acompte','amount_total')
    def _get_montant(self):
        #cette fonction permet de calculer le montant dû à partir du ttc et l'acompte
        for record in self:
            record.montant_du = record.amount_total - record.acompte 

    @api.depends('order_line.price_subtotal')
    def get_amount_total(self):
        #cette fonction permet de calculer le total TTC
        for order in self:
            amount_total = 0
            for line in order.order_line:
                amount_total += line.price_subtotal
            order.update({
                'amount_total': amount_total,
            })

    @api.model
    def create_commande(self, commande):
        #cette fonction permet de créer la commande en attente depuis point of sale ui
        commande_coordonnee = dict()
        if 'journal_id' in  commande:
            commande_coordonnee['journal_id'] = commande['journal_id']
        if 'partner_id' in  commande:
            commande_coordonnee['partner_id'] = commande['partner_id']
        commande_coordonnee['state'] = "en_attente"
        if 'session_id' in commande:
            commande_coordonnee['session_id'] = commande['session_id']
        if 'acompte' in commande:
            commande_coordonnee['acompte'] = commande['acompte']
        commande_id = self.create(commande_coordonnee).id
        return commande_id

    @api.model
    def update_state_archived(self, donne):
        """
        Cette fonction permet d'archiver la commande en attente ancienne et remplire
        le champ commande_suivante par la nouvelle commande qui suit cette commande
        ancienne afin de payer la suite de l'acompte.
        
        """
        if 'commande_ancienne' in donne and 'commande_nouvelle' in donne:
            commande_courante = self.env['pos.commande'].search([('id','=',donne['commande_ancienne'])])
            for i in commande_courante:
                i.state = 'archived'
                i.commande_suivante = donne['commande_nouvelle']
    @api.model
    def update_state_done(self, commande_id, client_choisi, payment_lignes):
        """cette partie est pour remplir l'avoir du client dans le cas ou 
        la methode de paiement est un avoir et mettre la commande en attente en état terminé
        @param:
        - commande_id: la commande en attente reprisse(ancienne)
        - client_choisi: l'id du client choisi depuis le pos
        - payment_lignes: la liste des lignes de paiements , chaque élement contient id du
        moyen de paiement et le montant à payer avec ce dernier
        """
        montant_avoir_negatif = 0 #montant à jouter comme avoir au client
        montant_avoir_positif = 0 #montant à débiter depuis l'avoir du client
        for i in payment_lignes:
            meth_pay = self.env['pos.payment.method'].browse(i.get('id_meth'))
            if meth_pay:
                if meth_pay[0].methode_avoir and i.get('montant') < 0:
                    montant_avoir_negatif += (i.get('montant')) * (-1)
                elif meth_pay[0].methode_avoir and i.get('montant') > 0:
                    montant_avoir_positif += i.get('montant')

        client_associe = self.env['res.partner'].browse(client_choisi)
        if montant_avoir_negatif != 0 and client_associe: 
            client_associe[0].avoir_client = client_associe[0].avoir_client + montant_avoir_negatif
        if montant_avoir_positif!= 0 and client_associe: 
            client_associe[0].avoir_client = client_associe[0].avoir_client - montant_avoir_positif
        
        #cette partie pour mettre la commande en attente en état terminé
        commande_courante = self.env['pos.commande'].browse(commande_id)
        for i in commande_courante:
            i.state = 'done'

    @api.model
    def update_avoir_client(self, commande_id, client_choisi, payment_lignes):
        """cette partie est pour remplir l'avoir du client dans le cas ou 
        la methode de paiement est un avoir et mettre la commande en attente en état terminé
        @param:
        - commande_id: la commande en attente reprisse(ancienne)
        - client_choisi: l'id du client choisi depuis le pos
        - payment_lignes: la liste des lignes de paiements , chaque élement contient id du
        moyen de paiement et le montant à payer avec ce dernier
        """
        montant_avoir_negatif = 0 #montant à jouter comme avoir au client
        montant_avoir_positif = 0 #montant à débiter depuis l'avoir du client
        for i in payment_lignes:
            meth_pay = self.env['pos.payment.method'].browse(i.get('id_meth'))
            if meth_pay:
                if meth_pay[0].methode_avoir and i.get('montant') < 0:
                    montant_avoir_negatif += (i.get('montant')) * (-1)
                elif meth_pay[0].methode_avoir and i.get('montant') > 0:
                    montant_avoir_positif += i.get('montant')

        client_associe = self.env['res.partner'].browse(client_choisi)
        if montant_avoir_negatif != 0 and client_associe: 
            client_associe[0].avoir_client = client_associe[0].avoir_client + montant_avoir_negatif
        if montant_avoir_positif!= 0 and client_associe: 
            client_associe[0].avoir_client = client_associe[0].avoir_client - montant_avoir_positif
    
    @api.model
    def annuler_acompte(self, cmd):
        #cette fonction permet d'annuler l'acompte 
        if 'id_commande' in cmd:
            commande_courante = self.env['pos.commande'].search([('id','=',cmd['id_commande'])])
            for i in commande_courante:
                i.state = 'annule'
                #chercher s'il y a des fils associés à cet acompte afin de les annuler aussi
                commande_archive = self.env['pos.commande'].search([('commande_suivante','=',i.id)])
                if commande_archive:
                    self.annuler_cmd_fils(commande_archive)
            return 1
        else:
            return 0

    def annuler_cmd_fils(self, commande_archive):
        #annuler la commande en paramètre
        for j in commande_archive:
            j.state = 'annule'
            #chercher s'il y a des fils associés à cet acompte afin de les annuler aussi
            commande_archive2 = self.env['pos.commande'].search([('commande_suivante','=',j.id)])
            self.annuler_cmd_fils(commande_archive2)

class pos_commande_line(models.Model):
    _name = "pos.commande.line"
    
    product_id = fields.Many2one('product.product', string = "Article")
    qty = fields.Float('Quantité')
    price_unit = fields.Monetary('Prix unitaire')
    discount = fields.Float('Remise(%)')
    tax_ids = fields.Many2many('account.tax', string = "Taxes")
    order_id = fields.Many2one('pos.commande')    
    company_id = fields.Many2one('res.company', related = "order_id.company_id")
    price_ttc = fields.Monetary('Prix TTC', compute = "get_price_ttc", store = True)
    currency_id = fields.Many2one('res.currency', string = "Devise", default = lambda self: self.env.user.company_id.currency_id)
    price_subtotal = fields.Monetary('Sous-total', compute = "get_amount_subtotal", store = True)
    total_hors_taxe = fields.Monetary('Sous-total hors taxes', compute = "get_amount_subtotal_ht", store = True)
    company_id = fields.Many2one('res.company', related = "order_id.company_id")
    
    @api.depends('price_unit','tax_ids')
    def get_price_ttc(self):
        #cette fonction permet de calculer le prix TTC
        for res in self:
            tax_amount = 0
            for tax in res.tax_ids:
                tax_amount += (res.price_unit * tax.amount/100)
            res.price_ttc = res.price_unit + tax_amount

    @api.depends('price_unit', 'qty', 'discount', 'tax_ids')
    def get_amount_subtotal(self):
        #cette fonction permet de calculer le sous total
        for line in self:
            price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            taxes = line.tax_ids.compute_all(price, line.currency_id, line.qty, product = line.product_id, partner = line.order_id.partner_id)
            line.update({
                'price_subtotal': taxes['total_included'],
            })
    
    @api.depends('price_unit', 'qty')
    def get_amount_subtotal_ht(self):
        #cette fonction permet de calculer le sous total hors taxes
        for line in self:
            price = line.price_unit * line.qty
            line.update({
                'total_hors_taxe': price,
            })
    
    @api.model
    def create_commande_line(self, commande_line):
        #cette fonction permet de créer la ligne de commande en attente
        commande_id = self.create(commande_line).id
        return commande_id