# Copyright 2020 ACSONE SA/NV
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
from odoo import models
from odoo.fields import first


class StockMoveLine(models.Model):

    _inherit = "stock.move.line"

    def _prepare_auto_lot_values(self):
        """
        Prepare multi valued lots per line to use multi creation.
        """
        self.ensure_one()
        return {"product_id": self.product_id.id, "company_id": self.company_id.id}

    def set_lot_auto(self):
        """
            Create lots using create_multi to avoid too much queries
            As move lines were created by product or by tracked 'serial'
            products, we apply the lot with both different approaches.
        """
        
        values = []
        res = []
        production_lot_obj = self.env["stock.production.lot"]
        lots_by_product = dict()
        for line in self:
            if line.qty_done > 0 :
                values.append(line._prepare_auto_lot_values())
        [res.append(x) for x in values if x not in res]
        lots = production_lot_obj.create(res)
        for lot in lots:
            if lot.product_id.id not in lots_by_product:
                lots_by_product[lot.product_id.id] = lot
            else:
                lots_by_product[lot.product_id.id] += lot
        for line in self:
            if line.qty_done > 0 :
                lot = first(lots_by_product[line.product_id.id])
                line.lot_id = lot
                if lot.product_id.tracking == "serial":
                    lots_by_product[line.product_id.id] -= lot
