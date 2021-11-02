# -*- encoding: utf-8 -*-
# Copyright 2021
{
    "name": "tit pos management",
    'version': '14.0.1.0.0',
    "author": "Sogesi",
    "website": "http://www.sogesi-dz.com",
    "sequence": 0,
    "depends": ["account","point_of_sale",'product','purchase','mail','stock'],
    "description": """
	""",
    "data": [
            "security/ir.model.access.csv",
            "security/security.xml",
            "data/notification.xml",
            "templates/point_of_sale_assets.xml",
            "views/pos_service_views.xml",
            "views/res_partner_views.xml",
            "views/product_template_views.xml"
    ],
    "installable": True,
}