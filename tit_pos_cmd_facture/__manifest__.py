# -*- encoding: utf-8 -*-
# Copyright 2021
{
    'name': "Tit pos Cmd & Facture",

    "version": "1.0.1",
    "author": "Sogesi",
    "website": "https://www.sogesi-dz.com",
    "sequence": 0,
    "depends": [
            "point_of_sale","tit_pos_order"
    ],
    "category": "Point of Sale",
    'license': 'LGPL-3',
    "description": """
    """,
    "data": [
        'views/pos_order_view.xml',
        'templates/point_of_sale_assets.xml',
    ],
    'qweb': [
            'static/src/xml/Screens/facture_button.xml',
            'static/src/xml/Detail_screen/FactureSavePaiementMultiple.xml',
            'static/src/xml/Detail_screen/FactureSavePaiement.xml',
            'static/src/xml/Detail_screen/FactureDetails.xml',
            'static/src/xml/Menu_screens/FacturesNonPayee.xml',

    ],

    'images': ['static/description/images/icon.png'],
    "auto_install": False,
    "installable": True,
    "application": False,
    
}