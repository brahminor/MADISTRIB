# -*- coding: utf-8 -*-
from odoo import fields, models,api

class stock_picking(models.Model):
    _inherit = "stock.picking"

    @api.model
    def create_stock_picking(self, arguments):
        #cette fonction permet de créer un bon de livraison afin de réserver les qtes
        stock_picking_type = self.env['stock.picking.type'].search([('code', '=', 'outgoing')])
        emp_customer = self.env['stock.location'].search([('usage', '=', 'customer')])
        if stock_picking_type and emp_customer:
            record = self.env['stock.picking'].create({
                'picking_type_id': stock_picking_type[0].id,
                'partner_id': arguments['partner_id'],
                'origin': arguments['origin'],
                'location_id': stock_picking_type[0].default_location_src_id.id,
                'location_dest_id': emp_customer.id,
                });
            if record:
                commande_principale = self.env['pos.commande'].browse(arguments['order_id'])
                commande_principale.write({'bon_livraison': record.id})
            return record.id
        return 0
    @api.model
    def confirm_stock_picking_from_pos(self, arguments):
        #cette fonction permet de confirmer et verifier disponibilité dans le bl généré pour les cmd en attente
        bl_record = self.env['stock.picking'].browse(arguments['picking_id'])
        if bl_record:
            bl_record.action_confirm()
            bl_record.action_assign()

class stock_move(models.Model):
    _inherit = "stock.move"

    @api.model
    def create_stock_move(self, arguments):
        #cette fonction permet de créer un bon de livraison afin de réserver les qtes
        product_id = self.env['product.product'].browse(arguments['product_id'])
        stock_picking_type = self.env['stock.picking.type'].search([('code', '=', 'outgoing')])
        emp_customer = self.env['stock.location'].search([('usage', '=', 'customer')])
        if product_id and stock_picking_type and emp_customer:
            record = self.env['stock.move'].create({
                'picking_id': arguments['picking_id'],
                'product_id': arguments['product_id'],
                'name': product_id.name,
                'product_uom_qty': arguments['qty'],
                'product_uom': product_id.uom_id.id,
                'location_id':  stock_picking_type[0].default_location_src_id.id,
                'location_dest_id': emp_customer.id,
                })

            return record.id
        return 0