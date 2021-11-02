# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import time

from odoo import api, fields, models, _
from odoo.exceptions import UserError


class SaleAdvancePaymentInv(models.TransientModel):
    _inherit = "sale.advance.payment.inv"
    

    def create_invoices_from_pos(self):
        """
        Cette fontion permet de créer une facture pour l'acompte payé depuis le pos
        cette fonction retourne  la facture générée
        """
        sale_orders = self.env['sale.order'].browse(self._context.get('active_ids', []))    
        if self.advance_payment_method == 'delivered':
            donne_de_facture_cree = {}
            facture_cree = sale_orders._create_invoices(final=self.deduct_down_payments)
            donne_de_facture_cree['id'] = facture_cree.id
            donne_de_facture_cree['name'] = facture_cree.name
            donne_de_facture_cree['state'] = 'draft'
            donne_de_facture_cree['invoice_date'] = facture_cree.invoice_date
            donne_de_facture_cree['invoice_date_due'] = facture_cree.invoice_date_due
            donne_de_facture_cree['payment_state'] = facture_cree.payment_state
            donne_de_facture_cree['amount_total'] = facture_cree.amount_total
            donne_de_facture_cree['amount_residual'] = facture_cree.amount_residual
            donne_de_facture_cree['partner_id'] = [facture_cree.partner_id.id, facture_cree.partner_id.name]
            donne_de_facture_cree['avoir_client'] = facture_cree.partner_id.avoir_client
            return donne_de_facture_cree
        else:
            # Create deposit product if necessary
            if not self.product_id:
                vals = self._prepare_deposit_product()
                self.product_id = self.env['product.product'].create(vals)
                self.env['ir.config_parameter'].sudo().set_param('sale.default_deposit_product_id', self.product_id.id)

            sale_line_obj = self.env['sale.order.line']
            for order in sale_orders:
                amount, name = self._get_advance_details(order)
                if self.product_id.invoice_policy != 'order':
                    raise UserError(_('The product used to invoice a down payment should have an invoice policy set to "Ordered quantities". Please update your deposit product to be able to create a deposit invoice.'))
                if self.product_id.type != 'service':
                    raise UserError(_("The product used to invoice a down payment should be of type 'Service'. Please use another product or update this product."))
                taxes = self.product_id.taxes_id.filtered(lambda r: not order.company_id or r.company_id == order.company_id)
                tax_ids = order.fiscal_position_id.map_tax(taxes, self.product_id, order.partner_shipping_id).ids
                analytic_tag_ids = []
                for line in order.order_line:
                    analytic_tag_ids = [(4, analytic_tag.id, None) for analytic_tag in line.analytic_tag_ids]

                so_line_values = self._prepare_so_line(order, analytic_tag_ids, tax_ids, amount)
                so_line = sale_line_obj.create(so_line_values)
                invoice_result = self._create_invoice(order, so_line, amount)
                return invoice_result