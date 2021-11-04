# -*- encoding: utf-8 -*-
# Copyright 2021
{
    "name": "tit pos management",
    'version': '14.0.1.0.0',
    "author": "Sogesi",
    "website": "http://www.sogesi-dz.com",
    "sequence": 0,
    "depends": ["account", "point_of_sale", 'product', 'purchase', 'mail', 'stock', 'hr', 'report_xlsx', 'tit_pos_order'],
    "description": """
	""",
    "data": [
            "security/ir.model.access.csv",
            "security/security.xml",
            "data/notification.xml",
            "templates/point_of_sale_assets.xml",
            "wizard/planning_preparation.xml",
            "report/planning_report.xml",
            "views/pos_service_views.xml",
            "views/res_partner_views.xml",
            "views/product_template_views.xml",
            "views/stock_picking.xml"

    ],
    "installable": True,
}