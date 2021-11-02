from odoo import api, fields, models, _

class PosPaymentCommande(models.Model):
    
    _name = "pos.payment_cmd"

    payment_date = fields.Datetime(string='Date', required=True, readonly=True, default=lambda self: fields.Datetime.now())
    pos_commande_id = fields.Many2one('pos.commande', string='Commande')
    montant = fields.Float(string='Montant')
    payment_method_id = fields.Many2one('pos.payment.method', string='Moyen de paiement', required=True)
    session_id = fields.Many2one('pos.session', string='Session', related='pos_commande_id.session_id', store=True)
    check_number = fields.Char('Numéro de chèque')
    check_date = fields.Date('Date remise')

    @api.model
    def create_payment_cmd(self, commande_line):
        #cette fonction permet de créer la ligne de commande en attente
        payment_cmd_id = self.create(commande_line).id
        return payment_cmd_id